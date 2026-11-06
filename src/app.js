/* Entirely client-side search and bookmarks. No third-party JavaScript or tracking. */
(()=>{

 /* Decorative icons are selected from each card's topic; no external icon downloads. */
 const iconRules=[
  [/\b(api|integration|backend|developer)\b/i,'🔌'],
  [/\b(job|career|recruit|vacanc|internship|employment)\b/i,'💼'],
  [/\b(course|learn|training|certificate|education)\b/i,'🎓'],
  [/\b(design|figma|ux|ui|wireframe|prototype)\b/i,'🎨'],
  [/\b(data|sql|analytics|excel|dashboard|power bi)\b/i,'📊'],
  [/\b(video|youtube|animation|film)\b/i,'🎬'],
  [/\b(audio|speech|voice|podcast)\b/i,'🎧'],
  [/\b(code|website|react|github|programming|mobile)\b/i,'💻'],
  [/\b(security|privacy|cyber|testing)\b/i,'🛡️'],
  [/\b(business|requirement|product|agile|process)\b/i,'📋'],
  [/\b(guide|article|read)\b/i,'📖']
 ];
 for(const card of document.querySelectorAll('.guide-card,.api-card')){
  if(card.querySelector('.card-topic-icon'))continue;
  const words=[card.querySelector('h2,h3')?.textContent||'',card.querySelector('.eyebrow')?.textContent||'',card.getAttribute('href')||''].join(' ');
  const icon=iconRules.find(([pattern])=>pattern.test(words))?.[1]||'✦';
  const symbol=document.createElement('span');
  symbol.className='card-topic-icon';symbol.setAttribute('aria-hidden','true');symbol.textContent=icon;
  card.prepend(symbol);
 }
 const navButton=document.querySelector('.mobile-menu');
 navButton?.addEventListener('click',()=>{const open=navButton.getAttribute('aria-expanded')==='true';navButton.setAttribute('aria-expanded',String(!open));document.querySelector('.main-nav')?.classList.toggle('nav-open',!open)});
 const cards=[...document.querySelectorAll('[data-tool]')];
 const search=document.querySelector('#tool-search');
 const category=document.querySelector('#category-filter');
 const access=document.querySelector('#access-filter');
 const showFavorites=document.querySelector('#favorites-toggle');
 const count=document.querySelector('#results-count');
 const empty=document.querySelector('#no-results');
 // Guests retain device-local stars; signed-in accounts use owner-protected Supabase saves.
 // Do not silently transfer guest/local favorites between user accounts.
 let saved=new Set();try{saved=new Set(JSON.parse(localStorage.getItem('freeaitaskbook-favorites')||'[]'));}catch{}
 let favoriteDb=null,favoriteUser=null,favoriteReady=false;
 const renderFavorites=()=>{document.querySelectorAll('[data-favorite]').forEach(btn=>{const isSaved=saved.has(btn.dataset.favorite);btn.setAttribute('aria-pressed',String(isSaved));btn.setAttribute('aria-label',(isSaved?'Remove saved ':'Save ')+(btn.dataset.favorite||'tool'));btn.textContent=isSaved?'★':'☆';btn.title=isSaved?'Remove saved tool':'Save tool';});};
 const favoriteFeedback=message=>{
  if(!showFavorites)return;
  let node=document.getElementById('favorite-sync-status');
  if(!node){node=document.createElement('span');node.id='favorite-sync-status';node.setAttribute('role','status');node.className='favorite-sync-status';showFavorites.insertAdjacentElement('afterend',node);}
  node.textContent=message;
 };
 document.addEventListener('click',async e=>{
  const btn=e.target.closest('[data-favorite]');if(!btn)return;
  if(!favoriteReady){favoriteFeedback('Loading saved tools. Please try again.');return;}
  const slug=btn.dataset.favorite;if(!/^[a-z0-9-]{2,150}$/.test(slug||''))return;
  const alreadySaved=saved.has(slug);
  btn.disabled=true;
  try{
   if(favoriteDb&&favoriteUser){
    const response=alreadySaved
     ?await favoriteDb.from('saved_items').delete().eq('user_id',favoriteUser).eq('item_kind','ai_tool').eq('item_id',slug)
     :await favoriteDb.from('saved_items').upsert({user_id:favoriteUser,item_kind:'ai_tool',item_id:slug},{onConflict:'user_id,item_kind,item_id'});
    if(response.error){favoriteFeedback('Could not update your account saves. Please retry.');return;}
   }else{
    const next=new Set(saved);alreadySaved?next.delete(slug):next.add(slug);
    try{localStorage.setItem('freeaitaskbook-favorites',JSON.stringify([...next]));}
    catch{favoriteFeedback('Local saving is unavailable in this browser.');return;}
   }
   alreadySaved?saved.delete(slug):saved.add(slug);
   favoriteFeedback(favoriteUser?'Saved tools updated in your account.':'Saved on this device. Sign in to save across devices.');
   renderFavorites();applyFilters();
  }catch{favoriteFeedback('Saved tools could not be updated. Check your connection and retry.');}
  finally{btn.disabled=false;}
 });
 renderFavorites();
 document.addEventListener('DOMContentLoaded',async()=>{
  if(!cards.length){favoriteReady=true;return;}
  const config=window.TASKBOOK_CONFIG;
  if(config?.url&&config?.key&&window.supabase?.createClient){
   try{
    favoriteDb=window.supabase.createClient(config.url,config.key,{auth:{flowType:'pkce',detectSessionInUrl:false}});
    const {data,error}=await favoriteDb.auth.getUser();
    if(!error&&data?.user){
     const userId=data.user.id;
     const {data:rows,error:readError}=await favoriteDb.from('saved_items').select('item_id').eq('user_id',userId).eq('item_kind','ai_tool').limit(1000);
     if(readError){favoriteFeedback('Your account saves could not be loaded. Refresh to retry.');return;}
     favoriteUser=userId;
     saved=new Set((rows||[]).map(x=>x.item_id));renderFavorites();applyFilters();
    }
   }catch{favoriteFeedback('Unable to load saved tools. Refresh to retry.');return;}
  }
  favoriteReady=true;
 });
 let favoriteOnly=false;
 let visibleLimit=6;
 document.getElementById('show-more-tools')?.addEventListener('click',()=>{visibleLimit+=6;applyFilters();});
 const params=new URLSearchParams(location.search);
 if(search)search.value=params.get('q')||'';
 if(category)category.value=params.get('category')||'';
 if(access)access.value=params.get('access')||'';
 function applyFilters(){
  if(!search||!category||!access)return;
  const q=search.value.trim().toLowerCase();const words=q.split(/\s+/).filter(Boolean);
  let matched=0,shown=0;
  for(const card of cards){const match=words.every(w=>card.dataset.search.includes(w))&&(!category.value||card.dataset.category===category.value)&&(!access.value||card.dataset.access===access.value)&&(!favoriteOnly||saved.has(card.dataset.slug));if(match)matched++;const visible=match&&shown<visibleLimit;card.hidden=!visible;if(visible)shown++;}
  if(count)count.textContent=`Showing ${shown} of ${matched} matching tools`;
  const more=document.getElementById('show-more-tools');if(more){more.hidden=shown>=matched;more.textContent=`Show ${Math.min(6,matched-shown)} more tools ↓`;}
  if(empty)empty.hidden=matched!==0;
  const next=new URLSearchParams();if(q)next.set('q',search.value.trim());if(category.value)next.set('category',category.value);if(access.value)next.set('access',access.value);
  const newUrl=`${location.pathname}${next.toString()?'?'+next:''}${location.hash}`;
  if(location.pathname==='/'&&location.pathname+location.search+location.hash!==newUrl)history.replaceState(null,'',newUrl);
 }
 [search,category,access].forEach(el=>el?.addEventListener(el===search?'input':'change',()=>{visibleLimit=6;applyFilters();}));
 showFavorites?.addEventListener('click',()=>{favoriteOnly=!favoriteOnly;visibleLimit=6;showFavorites.setAttribute('aria-pressed',String(favoriteOnly));showFavorites.textContent=favoriteOnly?'★ Saved only':'☆ Saved tools';applyFilters();});
 const reset=()=>{visibleLimit=6;if(search)search.value='';if(category)category.value='';if(access)access.value='';favoriteOnly=false;if(showFavorites){showFavorites.setAttribute('aria-pressed','false');showFavorites.textContent='☆ Saved tools';}applyFilters();};
 document.querySelector('#clear-filters')?.addEventListener('click',reset);
 document.querySelector('#empty-reset')?.addEventListener('click',reset);
 applyFilters();
 document.querySelector('.hero-search')?.addEventListener('submit',e=>{if(location.pathname==='/'){e.preventDefault();const val=document.querySelector('#hero-query')?.value||'';if(search){search.value=val;visibleLimit=6;applyFilters();search.scrollIntoView({behavior:'smooth',block:'center'});search.focus();}}});
 if(params.has('q')&&search){setTimeout(()=>{document.querySelector('#explore')?.scrollIntoView({block:'start'});},120);}
 document.addEventListener('keydown',e=>{const tag=document.activeElement?.tagName||'';if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(tag)){if(search){e.preventDefault();search.focus();}}});

 // API directory filters: all browsing happens in the current browser.
 const apiCards=[...document.querySelectorAll('[data-api]')];
 const apiSearch=document.querySelector('#api-search');
 const apiAccess=document.querySelector('#api-access');
 const apiPlatform=document.querySelector('#api-platform');
 function filterApis(){if(!apiSearch)return;const q=apiSearch.value.trim().toLowerCase();let visible=0;
  for(const c of apiCards){const ok=c.dataset.search.includes(q)&&(!apiAccess.value||c.dataset.access===apiAccess.value)&&(!apiPlatform.value||c.dataset.platforms.split(',').includes(apiPlatform.value));c.hidden=!ok;if(ok)visible++;}
  const count=document.querySelector('#api-count');if(count)count.textContent=`Showing ${visible} of ${apiCards.length} APIs`;
  const empty=document.querySelector('#api-none');if(empty)empty.hidden=visible>0;
 }
 [apiSearch,apiAccess,apiPlatform].forEach(el=>el?.addEventListener('input',filterApis));filterApis();
 // No client-side personal data persistence: suggestions open a public GitHub issue draft.
 const suggest=document.querySelector('#suggest-form');
 if(suggest){
  const kind=suggest.querySelector('[name=kind]'), cat=suggest.querySelector('[name=category]'), accessType=suggest.querySelector('[name=access]');
  const apiCategories=new Set(['AI','Commerce','Websites','Email','Maps','Database','Payments','Media','Developer']);
  const apiAccess=new Set(['free-tier','free-credits','paid','platform-included','self-hosted']);
  const toolAccess=new Set(['free-tier','free','free-credits','local-open-source','free-software']);
  function updateKind(){const isApi=kind.value==='API';
   for(const op of cat.options){const good=isApi?apiCategories.has(op.value):!apiCategories.has(op.value);op.hidden=!good;op.disabled=!good;}
   if(cat.selectedOptions[0]?.disabled)cat.value=isApi?'AI':'chat-research';
   for(const op of accessType.options){const good=(isApi?apiAccess:toolAccess).has(op.value);op.hidden=!good;op.disabled=!good;}
   if(accessType.selectedOptions[0]?.disabled)accessType.value='free-tier';
  }
  kind.addEventListener('change',updateKind);updateKind();
 }
 suggest?.addEventListener('submit',(e)=>{
  e.preventDefault();const f=new FormData(suggest);const kind=String(f.get('kind')||'Tool');const name=String(f.get('name')||'').trim();const website=String(f.get('website')||'').trim();const pricing=String(f.get('pricing')||'').trim();
  const repo=suggest.dataset.repo;if(!/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repo)){document.querySelector('#submission-help').textContent='GitHub submissions are not configured.';return;}
  if(![website,pricing].every(v=>{try{const u=new URL(v);return u.protocol==='https:'&&!!u.hostname.includes('.');}catch{return false;}}))return;
  const fields={'Listing type':kind,'Tool / API name':name,'Official website':website,'Official pricing, license or free-plan source':pricing,'Category':String(f.get('category')),'Access':String(f.get('access')),'Description / tasks':String(f.get('description')).trim(),'Free plan / pricing limitations':String(f.get('limitations')).trim(),'API Platforms':String(f.get('platforms')||'custom')};
  const body=Object.entries(fields).map(([k,v])=>`### ${k}\n\n${v}`).join('\n\n');
  const title=`${kind} suggestion: ${name}`;
  const url=`${repo}/issues/new?${new URLSearchParams({title,body})}`;
  window.open(url,'_blank','noopener,noreferrer');document.querySelector('#submission-help').textContent='Your GitHub draft has opened in a new tab. Sign in and click Submit new issue there to send it.';
 });
})();

// Job-source category cards and keyword filtering. No user tracking.
(()=>{
 const q=document.getElementById('source-search');
 const cards=[...document.querySelectorAll('[data-job-source]')];
 const count=document.getElementById('source-results');
 const reset=document.getElementById('source-reset');
 const tiles=[...document.querySelectorAll('[data-source-filter]')];
 if(!q||!cards.length)return;
 let category='';
 function group(type){
  if(type==='government')return 'government';
  if(['private','technology','startup'].includes(type))return 'private';
  if(type==='remote')return 'remote';
  if(type==='internship')return 'internship';
  return 'other';
 }
 function run(){
  const term=q.value.trim().toLowerCase();
  let shown=0;
  for(const card of cards){
   const sourceType=card.dataset.sourceType||'';
   const groupName=group(sourceType);
   const fitsCategory=!category||(category==='remote'?groupName==='remote'||sourceType==='technology':groupName===category);
   const match=fitsCategory&&card.dataset.search.includes(term);
   card.hidden=!match;
   if(match)shown++;
  }
  for(const tile of tiles)tile.setAttribute('aria-pressed',String(tile.dataset.sourceFilter===category));
  if(reset)reset.hidden=!category&&!term;
  if(count)count.textContent=shown+' portal'+(shown===1?'':'s')+' found'+(category?' · '+category:'');
 }
 for(const tile of tiles)tile.addEventListener('click',()=>{
  category=category===tile.dataset.sourceFilter?'':tile.dataset.sourceFilter;
  run();
  document.getElementById('source-grid')?.scrollIntoView({behavior:'smooth',block:'nearest'});
 });
 q.addEventListener('input',run);
 reset?.addEventListener('click',()=>{category='';q.value='';run();q.focus();});
 run();
})();

// Hide expired recruitment highlights while preserving their official reference links.
(()=>{
 const cards=[...document.querySelectorAll('.official-recruitment-card[data-job-deadline]')];
 if(!cards.length)return;
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 for(const card of cards){
  const deadline=card.dataset.jobDeadline;
  const expired=!!deadline&&date>deadline;
  card.classList.toggle('job-recruitment-expired',expired);
  card.hidden=expired; // Past-deadline spotlights no longer appear in active listings.
  const notice=card.querySelector('.job-deadline-state');
  if(notice)notice.textContent=expired?'Registration deadline has passed — check the official website for any extension.':'Registration window is currently within the advertised dates.';
 }
})();

// Public jobs are queried from Supabase with an anonymous publishable key.
// Public row-level security exposes ONLY verified, currently open vacancies.
(()=>{
 const host=document.getElementById('verified-job-feed');if(!host)return;
 const status=host.querySelector('#verified-job-status'),cards=host.querySelector('#verified-job-cards');
 const base=host.dataset.apiUrl,key=host.dataset.apiKey;
 if(!base||!key)return;
 const setStatus=text=>{if(status)status.textContent=text;};
 const safeURL=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:null}catch{return null}};
 const link=(href,title)=>{const a=document.createElement('a');a.href=href;a.textContent=title+' ↗';a.target='_blank';a.rel='noopener noreferrer';return a};
 async function load(){
  try{
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
   const endpoint=new URL('/rest/v1/job_postings',base);
   endpoint.searchParams.set('select','id,title,organization,location,job_type,application_deadline,official_notification_url,application_url,verified_at');
   endpoint.searchParams.set('order','verified_at.desc');endpoint.searchParams.set('limit','30');
   endpoint.searchParams.set('status','eq.open');endpoint.searchParams.set('review_status','eq.verified');
   const res=await fetch(endpoint,{headers:{apikey:key,Accept:'application/json'},credentials:'omit',cache:'no-store'});
   if(!res.ok)throw new Error('Could not load verified openings');
   const rows=await res.json();if(!Array.isArray(rows))throw new Error('Invalid job response');
   const valid=rows.filter(j=>!j.application_deadline||j.application_deadline>=today);
   cards.replaceChildren();for(const job of valid){
    const article=document.createElement('article');article.className='guide-card';
    const tag=document.createElement('span');tag.className='eyebrow';tag.textContent=(job.job_type||'job')+' · '+(job.location||'Location not specified');
    const title=document.createElement('h3');title.textContent=job.title;
    const org=document.createElement('p');org.textContent=job.organization;article.append(tag,title,org);
    if(job.application_deadline){const deadline=document.createElement('p');deadline.textContent='Apply by: '+job.application_deadline;article.append(deadline)}
    if(job.id)article.append(link(location.origin+'/vacancies/'+encodeURIComponent(job.id),'View verified job details'));
    const official=safeURL(job.official_notification_url);if(official)article.append(link(official,'Official notification'));
    const apply=safeURL(job.application_url);if(apply)article.append(link(apply,'Apply through provider'));
    cards.append(article);
   }
   setStatus(valid.length?`${valid.length} verified vacancies from official sources`:'No independently verified, currently open vacancies have been published yet. Visit the source directory below.');
  }catch{setStatus('Live verified jobs could not be loaded. Use the official job-source directory below.')}
 }
 load();
})();
