import {esc,safeHttps,origin,response,page,rows,errorPage} from '../../src/server/shared.js';
export async function onRequestGet({request,env,params}) {
 const id=String(params.id||'');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return response('Not found',404,'text/plain; charset=utf-8',0);
 try {
  const p=new URLSearchParams({select:'id,title,organization,location,region,employment_mode,job_type,official_notification_url,application_url,qualifications,salary_note,vacancy_count,posted_on,application_deadline,verified_at,updated_at',id:`eq.${id}`,review_status:'eq.verified',status:'eq.open',limit:'1'});
  const [job]=await rows(env,'job_postings',p.toString(),1);
  if(!job || (job.application_deadline && job.application_deadline < new Date().toISOString().slice(0,10)))return response('Not found',404,'text/plain; charset=utf-8',0);
  const canonical=`${origin(env,request)}/vacancies/${id}`;
  const link=safeHttps(job.application_url || job.official_notification_url);
  const notification=safeHttps(job.official_notification_url);
  const description=`${job.title} at ${job.organization}. Verify eligibility and deadlines in the employer's official notice.`;
  const rowsHtml=[['Organization',job.organization],['Location',job.location||job.region],['Work mode',job.employment_mode],['Job type',job.job_type],['Qualifications',job.qualifications],['Vacancies',job.vacancy_count],['Salary',job.salary_note],['Posted',job.posted_on],['Apply by',job.application_deadline],['Last verified',job.verified_at?.slice(0,10)]].filter(([,v])=>v!==null&&v!==undefined&&v!=='').map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  const body=`<p><a href="/jobs/">← All jobs</a></p><h1>${esc(job.title)}</h1><p>${esc(description)}</p><dl>${rowsHtml}</dl>${notification?`<p><a href="${esc(notification)}" target="_blank" rel="noopener noreferrer">Official notification ↗</a></p>`:''}${link?`<p><a href="${esc(link)}" target="_blank" rel="noopener noreferrer">Apply on official site ↗</a></p>`:''}<p>Eligibility, fees and vacancy categories must be checked against the official notice. This website does not submit your application.</p>`;
  // Emit JobPosting only when authoritative posted date exists. Omit unsupported fields.
  const structured=job.posted_on&&notification?{'@context':'https://schema.org','@type':'JobPosting',title:job.title,datePosted:job.posted_on,hiringOrganization:{'@type':'Organization',name:job.organization},description,validThrough:job.application_deadline?`${job.application_deadline}T23:59:59+05:30`:undefined,url:canonical}:null;
  return response(page({title:`${job.title} — ${job.organization}`,description,canonical,body,jsonld:structured}));
 } catch{return errorPage()}
}
