/* Entirely client-side search and bookmarks. No third-party JavaScript or tracking. */
(()=>{
 const navButton=document.querySelector('.mobile-menu');
 navButton?.addEventListener('click',()=>{const open=navButton.getAttribute('aria-expanded')==='true';navButton.setAttribute('aria-expanded',String(!open));document.querySelector('.main-nav')?.classList.toggle('nav-open',!open)});
 const cards=[...document.querySelectorAll('[data-tool]')];
 const search=document.querySelector('#tool-search');
 const category=document.querySelector('#category-filter');
 const access=document.querySelector('#access-filter');
 const showFavorites=document.querySelector('#favorites-toggle');
 const count=document.querySelector('#results-count');
 const empty=document.querySelector('#no-results');
 let saved=new Set();try{saved=new Set(JSON.parse(localStorage.getItem('freeaitaskbook-favorites')||'[]'));}catch{}
 const renderFavorites=()=>{document.querySelectorAll('[data-favorite]').forEach(btn=>{const isSaved=saved.has(btn.dataset.favorite);btn.setAttribute('aria-pressed',String(isSaved));btn.textContent=isSaved?'★':'☆';btn.title=isSaved?'Remove saved tool':'Save tool';});};
 document.addEventListener('click',(e)=>{const btn=e.target.closest('[data-favorite]');if(!btn)return;const slug=btn.dataset.favorite;if(saved.has(slug))saved.delete(slug);else saved.add(slug);try{localStorage.setItem('freeaitaskbook-favorites',JSON.stringify([...saved]));}catch{}renderFavorites();applyFilters();});
 renderFavorites();
 let favoriteOnly=false;
 const params=new URLSearchParams(location.search);
 if(search)search.value=params.get('q')||'';
 if(category)category.value=params.get('category')||'';
 if(access)access.value=params.get('access')||'';
 function applyFilters(){
  if(!search||!category||!access)return;
  const q=search.value.trim().toLowerCase();const words=q.split(/\s+/).filter(Boolean);
  let shown=0;
  for(const card of cards){const visible=words.every(w=>card.dataset.search.includes(w))&&(!category.value||card.dataset.category===category.value)&&(!access.value||card.dataset.access===access.value)&&(!favoriteOnly||saved.has(card.dataset.slug));card.hidden=!visible;if(visible)shown++;}
  if(count)count.textContent=`Showing ${shown} of ${cards.length} tools`;
  if(empty)empty.hidden=shown!==0;
  const next=new URLSearchParams();if(q)next.set('q',search.value.trim());if(category.value)next.set('category',category.value);if(access.value)next.set('access',access.value);
  const newUrl=`${location.pathname}${next.toString()?'?'+next:''}${location.hash}`;
  if(location.pathname==='/'&&location.pathname+location.search+location.hash!==newUrl)history.replaceState(null,'',newUrl);
 }
 [search,category,access].forEach(el=>el?.addEventListener(el===search?'input':'change',applyFilters));
 showFavorites?.addEventListener('click',()=>{favoriteOnly=!favoriteOnly;showFavorites.setAttribute('aria-pressed',String(favoriteOnly));showFavorites.textContent=favoriteOnly?'★ Saved only':'☆ Saved tools';applyFilters();});
 const reset=()=>{if(search)search.value='';if(category)category.value='';if(access)access.value='';favoriteOnly=false;if(showFavorites){showFavorites.setAttribute('aria-pressed','false');showFavorites.textContent='☆ Saved tools';}applyFilters();};
 document.querySelector('#clear-filters')?.addEventListener('click',reset);
 document.querySelector('#empty-reset')?.addEventListener('click',reset);
 applyFilters();
 document.querySelector('.hero-search')?.addEventListener('submit',e=>{if(location.pathname==='/'){e.preventDefault();const val=document.querySelector('#hero-query')?.value||'';if(search){search.value=val;reset?applyFilters():null;search.scrollIntoView({behavior:'smooth',block:'center'});search.focus();}}});
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

// Job source directory: local filtering, no personal tracking or unverified vacancy claims.
(()=>{const q=document.querySelector('#source-search'),cards=[...document.querySelectorAll('[data-job-source]')],count=document.querySelector('#source-results');if(!q||!cards.length)return;const run=()=>{const term=q.value.trim().toLowerCase();let shown=0;for(const card of cards){const match=card.dataset.search.includes(term);card.hidden=!match;if(match)shown++;}if(count)count.textContent=`${shown} job source${shown===1?'':'s'}`;};q.addEventListener('input',run);})();

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
   const today=new Date().toISOString().slice(0,10);
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
    const official=safeURL(job.official_notification_url);if(official)article.append(link(official,'Official notification'));
    const apply=safeURL(job.application_url);if(apply)article.append(link(apply,'Apply through provider'));
    cards.append(article);
   }
   setStatus(valid.length?`${valid.length} verified vacancies from official sources`:'No independently verified, currently open vacancies have been published yet. Visit the source directory below.');
  }catch{setStatus('Live verified jobs could not be loaded. Use the official job-source directory below.')}
 }
 load();
})();
