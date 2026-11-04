import fs from 'node:fs';
const tools=JSON.parse(fs.readFileSync('data/tools.json','utf8'));
const apis=JSON.parse(fs.readFileSync('data/apis.json','utf8'));
const rows=[...apis.map(a=>({name:a.name,url:a.pricingUrl})),...tools.slice(0,10).map(a=>({name:a.name,url:a.pricingUrl}))];
const tested=[];
for(const item of rows){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),7500);
 try{const res=await fetch(item.url,{method:'GET',redirect:'follow',signal:controller.signal,headers:{'User-Agent':'FreeAITaskbook-link-audit/1.0'}});tested.push({name:item.name,url:item.url,status:res.status,note:res.status===403||res.status===429?'May block automated checks; verify manually':res.ok?'Reachable':'Review status'});await res.body?.cancel();}
 catch(e){tested.push({name:item.name,url:item.url,status:'unavailable',note:'Network check could not complete; manually verify'});}
 finally{clearTimeout(timeout);}
}
// Discovery leads are unverified GitHub projects, NOT automatically published products.
let leads=[];
try{
 const token=process.env.GH_TOKEN||'';
 const res=await fetch('https://api.github.com/search/repositories?q=topic%3Aai-tools+stars%3A%3E50&sort=updated&order=desc&per_page=8',{headers:{'Accept':'application/vnd.github+json',...(token?{'Authorization':`Bearer ${token}`}:{})}});
 if(res.ok){const j=await res.json();leads=(j.items||[]).filter(x=>!x.archived).slice(0,5).map(x=>({name:x.full_name,url:x.html_url,description:(x.description||'').slice(0,180)}));}
}catch{}
const markdown=`# Weekly AI & API catalog review\n\nGenerated: ${new Date().toISOString().slice(0,10)}\n\n**Review queue only. No provider is added automatically.** Website access limits and free pricing require official human verification.\n\n## Provider sources and crawl signals\n\n| Provider | HTTP result | Notes |\n|---|---|---|\n${tested.map(r=>`| ${r.name.replaceAll('|','/')} | ${r.status} | ${r.note} |`).join('\n')}\n\n## GitHub discovery leads (unverified)\n\n${leads.map(x=>`- [${x.name}](${x.url}) — ${x.description.replaceAll('\n',' ')}`).join('\n')||'No new repository leads fetched.'}\n\n## Owner review\n\n- [ ] Confirm official websites and real free-plan conditions before publishing.\n- [ ] Reject spam, duplicates, suspicious links and compromised sources.\n- [ ] Add approved tools/APIs using the public submission workflow or a reviewed PR.\n`;
fs.mkdirSync('/tmp/freeaitaskbook',{recursive:true});fs.writeFileSync('/tmp/freeaitaskbook/catalog-audit.md',markdown);
console.log(`Catalog audit prepared: ${tested.length} providers, ${leads.length} discovery leads.`);
