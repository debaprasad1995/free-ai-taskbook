import {esc,safeHttps,origin,response,page,rows,errorPage} from '../_lib/shared.js';
export async function onRequestGet({request,env,params}) {
 const slug=String(params.slug||'');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return response('Not found',404,'text/plain; charset=utf-8',0);
 try {
  const p=new URLSearchParams({select:'slug,title,summary,kind,category,official_url,pricing_class,source_url,last_verified_at,details,updated_at',slug:`eq.${slug}`,review_status:'eq.published',limit:'1'});
  const [item]=await rows(env,'resource_catalog',p.toString(),1);
  if(!item)return response('Not found',404,'text/plain; charset=utf-8',0);
  const canonical=`${origin(env,request)}/catalog/${encodeURIComponent(slug)}`;
  const official=safeHttps(item.official_url);
  const source=safeHttps(item.source_url);
  const verified=item.last_verified_at?new Date(item.last_verified_at).toISOString().slice(0,10):'Not independently verified';
  const description=String(item.summary||`${item.title} official resource listing`).slice(0,260);
  const body=`<p><a href="/resources/">← Back to resources</a></p><p>${esc(item.kind)} · ${esc(item.category)} · ${esc(item.pricing_class)}</p><h1>${esc(item.title)}</h1><p>${esc(description)}</p><p><strong>Last verified:</strong> ${esc(verified)}</p>${official?`<p><a href="${esc(official)}" target="_blank" rel="noopener noreferrer">Visit official website ↗</a></p>`:''}${source?`<p><a href="${esc(source)}" target="_blank" rel="noopener noreferrer">Official documentation or pricing ↗</a></p>`:''}<p>Check provider terms before purchasing or integrating any product. This is an independently curated listing.</p>`;
  return response(page({title:item.title,description,canonical,body,jsonld:{'@context':'https://schema.org','@type':'WebPage',name:item.title,url:canonical,description}}));
 } catch{return errorPage()}
}
