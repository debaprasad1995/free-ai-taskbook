import fs from 'node:fs';
const tools=JSON.parse(fs.readFileSync('data/tools.json','utf8'));
const apis=JSON.parse(fs.readFileSync('data/apis.json','utf8'));
const videos=JSON.parse(fs.readFileSync('data/youtube-courses.json','utf8'));
const sources=JSON.parse(fs.readFileSync('data/job-sources.json','utf8'));
const today=new Date().toISOString().slice(0,10);
const day=Math.floor(Date.now()/86400000);
const pick=(rows,n)=>Array.from({length:Math.min(rows.length,n)},(_,i)=>rows[(day*n+i)%rows.length]);
const candidates=[
 ...pick(tools,8).map(x=>({kind:'AI tool',name:x.name,url:x.pricingUrl})),
 ...pick(apis,8).map(x=>({kind:'API',name:x.name,url:x.pricingUrl})),
 ...pick(videos,8).map(x=>({kind:'Video',name:x.title,url:'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v='+x.id+'&format=json'}))
];
async function statusOf(item){
 try{
  const response=await fetch(item.url,{headers:{'User-Agent':'FreeAITaskbook-directory-audit/1.0'},signal:AbortSignal.timeout(9000),redirect:'follow'});
  await response.body?.cancel();
  return {kind:item.kind,name:item.name,url:item.url,code:response.status,status:response.ok?'reachable':response.status===403||response.status===429?'access restricted; manual check':'review required'};
 }catch{return {kind:item.kind,name:item.name,url:item.url,code:'-',status:'request unavailable; manual check'};}
}
const tested=[];
for(const c of candidates)tested.push(await statusOf(c));
let discoveries=[];
try{
 const r=await fetch('https://api.github.com/search/repositories?q=topic%3Aai-agents+stars%3A%3E100&sort=updated&per_page=12',{headers:{Accept:'application/vnd.github+json',...(process.env.GH_TOKEN?{Authorization:'Bearer '+process.env.GH_TOKEN}:{})},signal:AbortSignal.timeout(15000)});
 if(r.ok){const json=await r.json();discoveries=(json.items||[]).filter(x=>!x.archived).slice(0,7).map(x=>({name:x.full_name,url:x.html_url}));}
}catch{}
const officialSources=sources.filter(x=>x.type==='government').slice(0,15);
const discoveryLinks=[
 ['FreeJobAlert — Latest Notifications','https://www.freejobalert.com/latest-notifications/'],
 ['FreeJobAlert — Railways','https://www.freejobalert.com/RAILWAY-JOBS/'],
 ['RRB Official Recruitment','https://rrb.indianrailways.gov.in/'],
 ['RRB CEN Notices','https://www.rrbcdg.gov.in/employment-notices.php'],
 ['WBPSC Official Announcements','https://psc.wb.gov.in/notification_announcement.jsp']
];
const safe=s=>String(s).replaceAll('|','/').replace(/[\r\n]/g,' ');
const rows=tested.map(x=>'| '+[safe(x.kind),safe(x.name),x.code,safe(x.status)].join(' | ')+' |').join('\n');
const markdown=[
 '# Daily resource and vacancy review — '+today,
 '',
 '**Review-only discovery. Do not treat aggregator snippets as official vacancies or automatically publish unverified free-tier claims.**',
 '',
 '## AI tools, APIs and videos — rotating link audit',
 '',
 '| Type | Resource | HTTP | Assessment |','|---|---|---:|---|',rows,
 '',
 'A reachable page does not prove its free pricing, current quota, safety or course accuracy. Review provider details before publishing.',
 '',
 '## Candidate AI projects (unverified)',
 discoveries.length?discoveries.map(x=>'- ['+safe(x.name)+']('+x.url+') — verify official pricing, license and relevance.').join('\n'):'- No GitHub discovery results returned.',
 '',
 '## Government recruitment discovery (verification required)',
 discoveryLinks.map(x=>'- ['+x[0]+']('+x[1]+')').join('\n'),
 '',
 '## Official government sources already in the directory',
 officialSources.map(x=>'- ['+safe(x.name)+']('+x.url+')').join('\n'),
 '',
 '## Publishing checklist',
 '- [ ] Check exact original recruiting authority notice PDF and corrections.',
 '- [ ] Confirm title, category, application URL, eligibility and India-local deadline.',
 '- [ ] Deduplicate by recruiter and notification/external ID.',
 '- [ ] Add verified government vacancy via admin review; never scrape restricted job portals.',
 '- [ ] Validate any candidate AI/API free plan and licensing on official provider pages.',
 '- [ ] Verify new YouTube video subject, channel and embed availability before adding to Learning Hub.',
 '',
 'Approved Greenhouse feeds sync independently when GitHub board IDs and Supabase server credentials are configured.',
 ''
].join('\n');
fs.mkdirSync('/tmp/freeaitaskbook',{recursive:true});
fs.writeFileSync('/tmp/freeaitaskbook/daily-review.md',markdown);
console.log('Daily review prepared for '+today+': '+tested.length+' checks, '+discoveries.length+' unverified discoveries.');