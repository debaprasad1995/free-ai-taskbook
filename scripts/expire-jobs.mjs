import {supabaseWriteHeaders} from './job-sync-helpers.mjs';
// Safe daily maintenance: close only jobs past their original application deadline.
// Public RLS and the website hide expired posts even when this optional maintenance is skipped.
const url=process.env.SUPABASE_URL||'';
const key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY||'';
if(!url||!key)throw Error('Expiry maintenance not configured: set SUPABASE_URL and a server-only SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) in GitHub Actions secrets.');
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('Invalid Supabase project URL.');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
if(!/^\d{4}-\d{2}-\d{2}$/.test(today))throw Error('Cannot determine India-local date');
const params=new URLSearchParams({status:'eq.open',application_deadline:'lt.'+today,select:'id'});
const resp=await fetch(url+'/rest/v1/job_postings?'+params.toString(),{
 method:'PATCH',
 headers:{...supabaseWriteHeaders(key),Prefer:'return=representation'},
 body:JSON.stringify({status:'closed',updated_at:new Date().toISOString()}),
 signal:AbortSignal.timeout(20000)
});
if(!resp.ok)throw Error('Expired-job maintenance failed with HTTP '+resp.status);
const rows=await resp.json();
console.log('Expired jobs marked closed: '+rows.length+' (India date '+today+').');
