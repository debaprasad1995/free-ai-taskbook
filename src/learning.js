/* YouTube embeds load only when a visitor explicitly clicks Watch. */
(()=>{
const selector=document.getElementById('video-topic');
const cards=[...document.querySelectorAll('[data-video-course]')];
const player=document.getElementById('video-player');
const slot=document.getElementById('video-frame-slot');
const title=document.getElementById('video-player-title');
if(!selector||!player||!slot)return;
selector.addEventListener('change',()=>{for(const card of cards)card.hidden=!!selector.value&&card.dataset.topic!==selector.value;});
document.addEventListener('click',event=>{
const button=event.target.closest('[data-video-id]');if(!button)return;
const id=button.dataset.videoId||'';if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
const frame=document.createElement('iframe');
frame.src='https://www.youtube-nocookie.com/embed/'+id+'?rel=0';
frame.title=button.dataset.videoTitle||'YouTube lesson';
frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
frame.allowFullscreen=true;frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';
slot.replaceChildren(frame);title.textContent=frame.title;player.hidden=false;player.scrollIntoView({behavior:'smooth',block:'center'});
});
document.getElementById('video-player-close')?.addEventListener('click',()=>{slot.replaceChildren();player.hidden=true;});
})();
