/**
 * Nonpublishing AI-tool candidate discovery.
 * Uses the GitHub API, not copied third-party directory content.
 * Outputs JSON outside the catalog for human review of project fitness,
 * license, actual free usage, official site, duplicates and safety.
 *
 * Usage: node scripts/discover-ai-candidates.mjs
 * Optional: GH_TOKEN or GITHUB_TOKEN for higher API limits.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN||'';
const headers={Accept:'application/vnd.github+json','User-Agent':'FreeAITaskbook-catalog-discovery',...(token?{Authorization:'Bearer '+token}:{})};
const queries=[
 'topic:llm stars:>100 archived:false',
 'topic:rag stars:>100 archived:false',
 'topic:ai-agents stars:>100 archived:false',
 'topic:stable-diffusion stars:>100 archived:false',
 'topic:speech-recognition stars:>100 archived:false',
 'topic:ai-coding stars:>100 archived:false'
];
const existing=JSON.parse(await fs.readFile('data/tools.json','utf8'));
const known=new Set(existing.map(x=>new URL(x.url).pathname.replace(/\\/$/,'').toLowerCase()));
const suggestions=new Map();
const safe=s=>String(s||'').replace(/[\\r\\n\\t]/g,' ').slice(0,300);
for(const q of queries){
 try{
  const u='https://api.github.com/search/repositories?'+new URLSearchParams({q,sort:'stars',order:'desc',per_page:'100'});
  const r=await fetch(u,{headers,signal:AbortSignal.timeout(20000)});
  if(!r.ok){console.error('Discovery unavailable for '+q+': HTTP '+r.status);continue;}
  const data=await r.json();
  for(const item of data.items||[]){
   if(item.archived||item.disabled||item.fork||!item.license?.spdx_id||item.license.spdx_id==='NOASSERTION')continue;
   const repo=String(item.full_name||'').toLowerCase();
   if(!repo||suggestions.has(repo)||known.has('/'+repo))continue;
   const license=item.license.spdx_id;
   if(!/^(MIT|Apache-2.0|BSD-2-Clause|BSD-3-Clause|GPL-3.0|AGPL-3.0|LGPL-3.0|MPL-2.0)$/.test(license))continue;
   suggestions.set(repo,{name:safe(item.name),source_repository:item.html_url,description:safe(item.description),license,stars:item.stargazers_count,updated_at:item.updated_at,discovered_via:q,review_status:'unverified',review_checks:['Confirm this is an actual usable AI tool, not a model variant or template','Check its original official source and approved license','Verify no paid-only requirement and document any API/hosting cost','Assign the correct category and tasks','Check duplicate domain, company and existing slug']});
  }
 }catch(error){console.error('Discovery unavailable for '+q+': '+safe(error.message));}
}
const output={generated_at:new Date().toISOString(),purpose:'Human verification only, no automatic publication',discovery_sources:[
 {name:'TopAI.tools',url:'https://topai.tools/',policy:'Discover names only; no copying descriptions or bulk scraping'},
 {name:'Open Tool Atlas',url:'https://www.opentoolatlas.com/',policy:'Cross-check names and GitHub repositories; no bulk copying'},
 {name:'Raise Digital',url:'https://tools.raisedigital.io/',policy:'Reference directory, not an authorization to republish its data'},
 {name:'CuratedAI',url:'https://www.curatedai.net/directory',policy:'Reference directory; model variants and paid products require filtering'},
 {name:'GitHub public repository metadata API',url:'https://docs.github.com/en/rest/search/search',policy:'API-based discovery with attribution, eligibility and license review'}
 ],existing_catalog_count:existing.length,discovered_count:suggestions.size,candidates:[...suggestions.values()].sort((a,b)=>b.stars-a.stars)};
await fs.mkdir('tmp',{recursive:true});
const out=path.resolve('tmp/ai-catalog-review.json');
await fs.writeFile(out,JSON.stringify(output,null,2)+'\n');
console.log('Review queue: '+suggestions.size+' candidates. No catalog changes. File: '+out);
