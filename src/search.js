(()=>{
 const input=document.getElementById('universal-query');if(!input)return;
 const kind=document.getElementById('universal-type'),cost=document.getElementById('universal-price'),results=document.getElementById('universal-results'),count=document.getElementById('universal-count');
 const compare=document.getElementById('tool-compare');
 const searchParams=new URLSearchParams(location.search);
 input.value=searchParams.get('q')||'';
 const safeUrl=(s)=>{try{const x=new URL(s,location.origin);return x.protocol==='https:'||x.origin===location.origin?x.href:null}catch{return null}};
 const make=(parent,tag,txt)=>{const n=document.createElement(tag);n.textContent=txt;parent.append(n);return n};
 const selected=new Map();let data=[];
 function renderCompare(){compare.replaceChildren();if(!selected.size)return make(compare,'p','Select 2–3 AI tools to compare their free access and task fit.');
 const table=make(compare,'div','');table.className='guide-grid';for(const r of selected.values()){const box=make(table,'article','');box.className='guide-card';make(box,'h3',r.name);make(box,'p','Access: '+r.pricing);make(box,'p','Tasks: '+r.description);const a=make(box,'a','Official details ↗');a.href=safeUrl(r.url)||'/search/';}
 }
 function render(){
  const tokens=input.value.toLowerCase().trim().split(/\s+/).filter(Boolean),t=kind.value,p=cost.value;
  const filtered=data.filter(x=>(!t||x.type===t)&&(!p||x.pricing===p)&&tokens.every(term=>x.search.includes(term))).slice(0,150);
  results.replaceChildren();count.textContent=`${filtered.length} matches${filtered.length===150?' (first 150)':''}`;
  for(const r of filtered){const card=make(results,'article','');card.className='guide-card';make(card,'span',r.type+' · '+r.pricing);make(card,'h2',r.name);make(card,'p',r.description);const link=make(card,'a','View details ↗');link.href=safeUrl(r.url)||'/';if(r.external){link.target='_blank';link.rel='noopener noreferrer';}
   if(r.type==='AI tool'){const button=make(card,'button',selected.has(r.url)?'✓ Selected':'Compare');button.type='button';button.addEventListener('click',()=>{if(selected.has(r.url))selected.delete(r.url);else if(selected.size<3)selected.set(r.url,r);renderCompare();render();});}
  }
  if(!filtered.length)make(results,'p','No matching entries. Try fewer words or another category.');
  const u=new URL(location.href);if(input.value.trim())u.searchParams.set('q',input.value.trim());else u.searchParams.delete('q');history.replaceState(null,'',u.pathname+u.search);
 }
 Promise.all([fetch('/search-index.json',{cache:'force-cache'}).then(r=>{if(!r.ok)throw Error('Search index unavailable');return r.json();})]).then(([rows])=>{data=rows;render();}).catch(()=>{count.textContent='Search index unavailable. Please try again later.';});
 for(const el of [input,kind,cost])el.addEventListener(el===input?'input':'change',render);
 renderCompare();
})();
