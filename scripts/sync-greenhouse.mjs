import {greenhouseJobUrl,supabaseWriteHeaders} from './job-sync-helpers.mjs';
/**
 * Daily employer job-board ingestion. Explicitly configured Greenhouse board IDs only.
 * Reads the public GET job-board API; writes through a server-only Supabase key in GitHub Actions.
 * Never publish a job from an untrusted origin, and never close jobs if upstream retrieval fails.
 */
const project=process.env.SUPABASE_URL;
const secret=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
const tokens=(process.env.GREENHOUSE_BOARD_TOKENS||'').split(',').map(x=>x.trim()).filter(Boolean);
const limit=Number(process.env.JOB_SYNC_MAX_ITEMS||400);
if(!tokens.length){console.log('Job sync skipped: no approved Greenhouse board tokens configured.');process.exit(0)}
if(!project||!secret)throw Error('Missing SUPABASE_URL or server-only SUPABASE_SECRET_KEY (or legacy SERVICE_ROLE_KEY) in GitHub Actions secrets.');
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(project))throw Error('Invalid Supabase endpoint');
if(!Number.isSafeInteger(limit)||limit<1||limit>1000)throw Error('JOB_SYNC_MAX_ITEMS must be 1..1000');
if(tokens.length>15||tokens.some(x=>!/^[a-zA-Z0-9_-]{2,80}$/.test(x)))throw Error('Invalid configured Greenhouse board identifiers');
const headers=supabaseWriteHeaders(secret);
async function database(table,{method='GET',params='',body}={}){
 const response=await fetch(`${project}/rest/v1/${table}${params}`,{method,headers:{...headers,'Prefer':'return=representation,resolution=merge-duplicates'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error(`Supabase ${table} ${method} returned HTTP ${response.status}: ${(await response.text()).slice(0,200)}`);
 return await response.json();
}

async function syncBoard(token){
 const sourceKey=`greenhouse:${token}`;
 const [run]=await database('sync_runs',{method:'POST',body:[{integration:sourceKey,status:'running'}]});
 let stats={fetched:0,inserted:0,rejected:0};
 try{
  const response=await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error(`Board returned HTTP ${response.status}`);
  const payload=await response.json();
  if(!Array.isArray(payload.jobs))throw Error('Unexpected job board payload');
  if(payload.jobs.length>limit)throw Error('Job board exceeds configured safety limit; not applying partial sync');
  stats.fetched=payload.jobs.length;
  const boardResponse=await fetch(`https://boards-api.greenhouse.io/v1/boards/${token}`,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)});
  if(!boardResponse.ok)throw Error(`Employer board metadata returned HTTP ${boardResponse.status}`);
  const board=await boardResponse.json();if(!String(board.name||'').trim())throw Error('Employer board name missing');
  const employer=String(board.name).trim().slice(0,200);
  const valid=[],active=new Set();
  for(const j of payload.jobs){
   const official=greenhouseJobUrl(j.absolute_url);
   // Greenhouse prospect posts have no real internal vacancy and should not be published.
   if(j.internal_job_id===null)continue;
   if(!official||!Number.isSafeInteger(j.id)||!String(j.title||'').trim()){stats.rejected++;continue}
   active.add(String(j.id));
   valid.push({source_key:sourceKey,external_id:String(j.id),title:String(j.title).slice(0,240),organization:employer,location:String(j.location?.name||'Location not specified').slice(0,200),job_type:'private',official_notification_url:official,application_url:official,review_status:'verified',status:'open',verified_at:new Date().toISOString(),attributes:{board:token,source:'Greenhouse public Job Board API'}});
  }
  // Upsert returned jobs; do not infer salary, age, dates or category vacancies.
  if(valid.length){for(let i=0;i<valid.length;i+=100){const r=await database('job_postings',{method:'POST',params:'?on_conflict=source_key,external_id',body:valid.slice(i,i+100)});stats.inserted+=r.length;}}
  // Reconcile removals ONLY after a successful, complete board response and successful upsert.
  const existing=await database('job_postings',{params:`?select=id,external_id&source_key=eq.${encodeURIComponent(sourceKey)}&status=eq.open&limit=1000`});
  const missing=stats.rejected?[]:existing.filter(x=>!active.has(x.external_id));
  // One malformed upstream record must not cause removal of a previously verified vacancy.
  // Avoid mass-closure if an upstream feed suddenly empties or changes identifiers.
  if(existing.length && (valid.length===0 || (existing.length>=10 && missing.length/existing.length>0.5)))throw Error('Unexpected loss of published employer jobs. Reconciliation paused for manual review.');
  for(const row of missing){await database('job_postings',{method:'PATCH',params:`?id=eq.${encodeURIComponent(row.id)}`,body:{status:'closed'}})}
  await database('sync_runs',{method:'PATCH',params:`?id=eq.${encodeURIComponent(run.id)}`,body:{status:stats.rejected?'partial':'success',completed_at:new Date().toISOString(),...stats,details:{closed:missing.length,board:token}}});
  console.log(`${sourceKey}: fetched ${stats.fetched}, upserted ${stats.inserted}, rejected ${stats.rejected}, closed ${missing.length}`);
 }catch(error){
  await database('sync_runs',{method:'PATCH',params:`?id=eq.${encodeURIComponent(run.id)}`,body:{status:'failure',completed_at:new Date().toISOString(),...stats,details:{error:String(error.message).slice(0,240)}}}).catch(()=>{});
  console.error(`${sourceKey}: ${error.message}`);process.exitCode=1;
 }
}
for(const token of tokens)await syncBoard(token);
