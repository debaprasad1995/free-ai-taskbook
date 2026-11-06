/* Topic and difficulty filtering, accessible progressive loading, explicit video consent. */
(()=>{
 const topic=document.getElementById('video-topic');
 const level=document.getElementById('video-level');
 const search=document.getElementById('video-search');
 const more=document.getElementById('video-more');
 const count=document.getElementById('video-count');
 const cards=[...document.querySelectorAll('[data-video-course]')];
 const player=document.getElementById('video-player');
 const slot=document.getElementById('video-frame-slot');
 const title=document.getElementById('video-player-title');
 if(!topic||!player||!slot||!level||!search)return;
 const initialCourse=new URLSearchParams(location.search).get('course');
 if(initialCourse)search.value=initialCourse.slice(0,100);
 let limit=6;
 function render(){
  const term=search.value.trim().toLowerCase();
  let matches=0,visible=0;
  for(const card of cards){
   const match=(!topic.value||card.dataset.topic===topic.value)&&(!level.value||card.dataset.level===level.value)&&(!term||card.dataset.search.includes(term));
   if(match)matches++;
   const show=match&&visible<limit;
   card.hidden=!show;
   if(show)visible++;
  }
  count.textContent='Showing '+visible+' of '+matches+' matching video courses';
  const link=document.getElementById('youtube-more-sources');if(link){const phrase=[topic.value,level.value,search.value,'full course tutorial'].filter(Boolean).join(' ');link.href='https://www.youtube.com/results?search_query='+encodeURIComponent(phrase);}
  if(more){more.hidden=visible>=matches;more.textContent='Show '+Math.min(6,matches-visible)+' more courses ↓';}
 }
 for(const control of [topic,level,search])control.addEventListener(control===search?'input':'change',()=>{limit=6;render();});
 document.querySelectorAll('[data-level-shortcut]').forEach(button=>button.addEventListener('click',()=>{
  level.value=button.dataset.levelShortcut;topic.value='';search.value='';limit=6;render();
 }));
 more?.addEventListener('click',()=>{limit+=6;render();});
 document.querySelector('a[href="#learning-resources"]')?.addEventListener('click',()=>{const details=document.getElementById('learning-resources');if(details)details.open=true;});
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-video-id]');if(!button)return;
  const id=button.dataset.videoId||'';if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
  const frame=document.createElement('iframe');frame.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0';
  frame.title=button.dataset.videoTitle||'YouTube lesson';
  frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen=true;frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';
  slot.replaceChildren(frame);title.textContent=frame.title;player.hidden=false;
  player.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
 });
 document.getElementById('video-player-close')?.addEventListener('click',()=>{slot.replaceChildren();player.hidden=true;});
 render();
})();