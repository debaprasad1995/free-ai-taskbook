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
})();
