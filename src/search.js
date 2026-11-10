(()=>{
 const input=document.getElementById('universal-query');
 if(!input)return;
 const type=document.getElementById('universal-type');
 const price=document.getElementById('universal-price');
 const results=document.getElementById('universal-results');
 const count=document.getElementById('universal-count');
 const panel=document.getElementById('tool-compare');
 const tray=document.getElementById('compare-tray');
 const trigger=document.getElementById('compare-run');
 const clear=document.getElementById('compare-clear');
 const trayCount=document.getElementById('compare-count');
 const trayList=document.getElementById('compare-names');
 const compareStatus=document.getElementById('compare-status');
 const searchParams=new URLSearchParams(location.search);
 input.value=searchParams.get('q')||'';
 const selection=new Map();
 let data=[];
 let visibleLimit=18;
 let liveWarning='';
 const catalogVersion='__SEARCH_INDEX_VERSION__';
 const indexUrl='/search-index.json?v='+encodeURIComponent(catalogVersion);
 const todayIndia=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const liveConfig=window.TASKBOOK_CONFIG||{};
 function toLiveRow(item,kind){
  if(kind==='catalog'){
   const name=String(item.title||'').trim();
   if(!name||!item.slug)return null;
   const description=String(item.summary||'');
   return {name,type:'AI tool',pricing:item.pricing_class==='free'?'free':item.pricing_class==='free_tier'?'free-tier':item.pricing_class==='free_credits'?'free-credits':item.pricing_class==='open_source'?'local-open-source':item.pricing_class==='paid'?'paid':'varies',description,
    search:[name,description,item.category,item.kind,item.slug].join(' ').toLowerCase(),url:'/catalog/'+encodeURIComponent(item.slug)+'/',external:false};
  }
  if(item.application_deadline&&item.application_deadline<todayIndia())return null;
  if(!item.id||!item.title)return null;
  const name=String(item.title||'').trim();
  const description=String(item.organization||'')+' · '+String(item.location||'')+(item.application_deadline?' · Apply by '+item.application_deadline:'');
  return {name,type:'Verified job',pricing:'varies',description,search:[name,description,item.job_type,item.region,'recruitment vacancy job'].join(' ').toLowerCase(),url:'/vacancies/'+encodeURIComponent(item.id)+'/',external:false};
 }
 async function fetchLiveTable(table,columns,filters,kind){
  const key=liveConfig.key,url=liveConfig.url;
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url||'')||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key||''))return [];
  const entries=[];
  // Public RLS is the authoritative access control. Read only published rows.
  for(let offset=0;offset<5000;offset+=500){
   const q=new URLSearchParams({select:columns,...filters,order:'created_at.desc',limit:'500',offset:String(offset)});
   const response=await fetch(url+'/rest/v1/'+table+'?'+q,{headers:{apikey:key,Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('Public '+table+' temporarily unavailable');
   const rows=await response.json();if(!Array.isArray(rows))throw Error('Unexpected '+table+' response');
   for(const item of rows){const row=toLiveRow(item,kind);if(row)entries.push(row);}
   if(rows.length<500)break;
  }
  return entries;
 }
 async function loadLiveData(){
  if(!liveConfig.url||!liveConfig.key)return;
  const [catalog,jobs]=await Promise.allSettled([
   fetchLiveTable('resource_catalog','slug,title,summary,category,kind,pricing_class,created_at',{review_status:'eq.published'},'catalog'),
   fetchLiveTable('job_postings','id,title,organization,location,region,job_type,application_deadline,created_at',{review_status:'eq.verified',status:'eq.open'},'job')
  ]);
  const extra=[];
  for(const outcome of [catalog,jobs]){
   if(outcome.status==='fulfilled')extra.push(...outcome.value);
   else liveWarning='Some live listings could not be loaded. Static directory results remain available.';
  }
  if(extra.length){
   const seen=new Set(data.map(x=>x.type+'|'+x.url));
   for(const row of extra){const key=row.type+'|'+row.url;if(!seen.has(key)){data.push(row);seen.add(key);}}
  }
  render();
 }
 const safeUrl=s=>{try{const u=new URL(s,location.origin);return u.protocol==='https:'||u.origin===location.origin?u.href:null;}catch{return null;}};
 const el=(parent,tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);parent.append(n);return n;};
 const makeLink=(parent,href,label)=>{const u=safeUrl(href);if(!u)return;const a=el(parent,'a',label);a.href=u;a.target=u.startsWith(location.origin)?'_self':'_blank';if(a.target==='_blank')a.rel='noopener noreferrer';return a;};
 function updateTray(){
  tray.hidden=selection.size===0;
  trayCount.textContent=selection.size+' of 3 selected';
  trayList.replaceChildren();
  for(const [key,tool] of selection){
   const item=el(trayList,'span',tool.name+' ');
   item.className='compare-chip';
   const remove=el(item,'button','×');
   remove.type='button';remove.setAttribute('aria-label','Remove '+tool.name+' from comparison');
   remove.addEventListener('click',()=>{selection.delete(key);updateTray();render();});
  }
  trigger.disabled=selection.size<2;
  trigger.textContent=selection.size>=2?'Compare '+selection.size+' tools ↗':'Select another tool';
  if(selection.size<2)compareStatus.textContent='Choose at least two AI tools to compare.';
  if(!selection.size){panel.hidden=true;panel.replaceChildren();}
 }
 function openCompare(){
  if(selection.size<2)return;
  panel.hidden=false;
  panel.replaceChildren();
  const head=el(panel,'div');head.className='compare-title';
  el(head,'h2','Side-by-side AI tool comparison');
  const close=el(head,'button','Close comparison ×');close.type='button';close.addEventListener('click',()=>{panel.hidden=true;trigger.focus();});
  const viewport=el(panel,'div');viewport.className='compare-table-scroll';viewport.tabIndex=0;viewport.setAttribute('aria-label','Scrollable comparison table');
  const table=el(viewport,'table');table.className='compare-table';
  const caption=el(table,'caption','Comparison based on published directory descriptions; verify provider limits before choosing.');
  caption.className='sr-only';
  const tbody=el(table,'tbody');
  const entries=[...selection.values()];
  for(const [label,render] of [
   ['Tool',x=>x.name],['Free access',x=>x.pricing],['Main use case',x=>x.description],['Resource type',x=>x.type],
   ['Official details',x=>x.url]
  ]){
   const tr=el(tbody,'tr');const th=el(tr,'th',label);th.scope='row';
   for(const item of entries){
    const td=el(tr,'td');
    if(label==='Official details')makeLink(td,item.url,'Open tool ↗');
    else td.textContent=render(item)||'Not specified';
   }
  }
  const note=el(panel,'p','Free-plan limits, API availability and pricing can change. Consult each provider before subscribing.');note.className='compare-footnote';
  panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  head.querySelector('h2')?.setAttribute('tabindex','-1');
  head.querySelector('h2')?.focus({preventScroll:true});
 }
 function render(){
  const tokens=input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches=data.filter(x=>(!type.value||x.type===type.value)&&(!price.value||x.pricing===price.value)&&tokens.every(t=>String(x.search||'').includes(t)));
  const shown=matches.slice(0,visibleLimit);
  results.replaceChildren();
  count.textContent='Showing '+shown.length+' of '+matches.length+' matching resources'+(liveWarning?' · '+liveWarning:'');
  for(const r of shown){
   const card=el(results,'article');card.className='guide-card search-result-card';
   el(card,'span',r.type+' · '+r.pricing).className='search-tag';
   el(card,'h2',r.name);el(card,'p',r.description);
   const actions=el(card,'div');actions.className='search-card-actions';
   makeLink(actions,r.url,'View details ↗');
   if(r.type==='AI tool'){
    const selected=selection.has(r.url);
    const button=el(actions,'button',selected?'✓ Selected':'＋ Compare');
    button.type='button';button.className='compare-select';button.setAttribute('aria-pressed',String(selected));
    button.setAttribute('aria-label',(selected?'Remove ':'Add ')+r.name+(selected?' from comparison':' to comparison'));
    button.addEventListener('click',()=>{
     if(selection.has(r.url))selection.delete(r.url);
     else if(selection.size<3)selection.set(r.url,r);
     else{compareStatus.textContent='Compare up to three tools. Remove one to add another.';return;}
     updateTray();render();
    });
   }
  }
  const more=document.getElementById('search-more');
  if(more){more.hidden=shown.length>=matches.length;more.textContent='Show '+Math.min(18,matches.length-shown.length)+' more resources ↓';}
  if(!matches.length)el(results,'p','No matching entries. Try fewer words or another category.');
  const u=new URL(location.href);
  if(input.value.trim())u.searchParams.set('q',input.value.trim());else u.searchParams.delete('q');
  history.replaceState(null,'',u.pathname+u.search);
 }
 trigger.addEventListener('click',openCompare);
 clear.addEventListener('click',()=>{selection.clear();updateTray();render();});
 document.getElementById('search-more')?.addEventListener('click',()=>{visibleLimit+=18;render();});
 for(const item of [input,type,price])item.addEventListener(item===input?'input':'change',()=>{visibleLimit=18;render();});
 fetch(indexUrl,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Index unavailable');return r.json();}).then(rows=>{
  if(!Array.isArray(rows))throw Error('Unexpected search index');
  data=rows;render();return loadLiveData();
 }).catch(()=>{count.textContent='Search index unavailable. Please refresh and retry.';});
 updateTray();
})();