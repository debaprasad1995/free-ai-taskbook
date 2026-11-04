import {esc,origin,response,rows} from './_lib/shared.js';
export async function onRequestGet({request,env}) {
 try {
  const [resources,jobs]=await Promise.all([
   rows(env,'resource_catalog',new URLSearchParams({select:'slug,updated_at',review_status:'eq.published',order:'updated_at.desc',limit:'1000'}).toString()),
   rows(env,'job_postings',new URLSearchParams({select:'id,updated_at,application_deadline',status:'eq.open',review_status:'eq.verified',order:'updated_at.desc',limit:'1000'}).toString())
  ]);
  const root=origin(env,request);const current=new Date().toISOString().slice(0,10);
  const entries=[];
  for(const r of resources){if(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug||''))entries.push({loc:`${root}/catalog/${r.slug}`,lastmod:r.updated_at});}
  for(const j of jobs){if(/^[0-9a-f-]{36}$/i.test(j.id||'')&&(!j.application_deadline||j.application_deadline>=current))entries.push({loc:`${root}/vacancies/${j.id}`,lastmod:j.updated_at});}
  const xml=`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(e=>`<url><loc>${esc(e.loc)}</loc>${e.lastmod?`<lastmod>${esc(new Date(e.lastmod).toISOString().slice(0,10))}</lastmod>`:''}</url>`).join('')}</urlset>`;
  return response(xml,200,'application/xml; charset=utf-8',300);
 }catch{return response('<?xml version="1.0"?><error>Temporarily unavailable</error>',503,'application/xml; charset=utf-8',0)}
}
