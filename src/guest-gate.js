/* Two minutes of active guest browsing per tab, shared across page navigation.
   This is a UX access gate, not a server-side authorization boundary. */
(()=>{
 'use strict';
 const LIMIT_MS=120000;
 const KEY='freeaitaskbook_guest_active_ms_v1';
 const RETURN_KEY='freeaitaskbook_guest_return_v1';
 const paths=['/account/','/privacy/','/terms/','/disclosure/'];
 if(paths.some(p=>location.pathname===p||location.pathname.startsWith(p)) || location.pathname==='/404/')return;
 const config=window.TASKBOOK_CONFIG;
 if(!config?.url||!config?.key||!window.supabase?.createClient)return;
 const db=window.supabase.createClient(config.url,config.key,{auth:{flowType:'pkce',detectSessionInUrl:false}});
 let signedIn=false,ready=false,dialog=null,clock=null,last=Date.now(),active=0,checking=false;
 let previouslyFocused=null;
 try{active=Math.min(LIMIT_MS,Math.max(0,Number(sessionStorage.getItem(KEY))||0));}catch{}
 function save(){
  try{sessionStorage.setItem(KEY,String(Math.min(active,LIMIT_MS)));}catch{}
 }
 function pauseClock(){
  if(document.visibilityState==='visible'&&ready&&!signedIn){
   const now=Date.now();
   active=Math.min(LIMIT_MS,active+Math.max(0,Math.min(now-last,5000)));
   save();
  }
  last=Date.now();
 }
 function lock(){
  if(dialog||signedIn||!ready)return;
  active=LIMIT_MS;save();
  try{sessionStorage.setItem(RETURN_KEY,location.pathname+location.search+location.hash);}catch{}
  dialog=document.createElement('div');dialog.className='guest-limit-overlay';dialog.id='guest-limit-overlay';
  dialog.setAttribute('role','dialog');
  dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-labelledby','guest-limit-title');
  dialog.setAttribute('aria-describedby','guest-limit-description');
  const box=document.createElement('section');box.className='guest-limit-panel';
  const emblem=document.createElement('div');emblem.className='guest-limit-icon';emblem.setAttribute('aria-hidden','true');emblem.textContent='✳';
  const kicker=document.createElement('p');kicker.className='guest-limit-kicker';kicker.textContent='FREEAITASKBOOK · PERSONAL ACCESS';
  const title=document.createElement('h2');title.id='guest-limit-title';title.textContent='Keep exploring with a free account.';
  const description=document.createElement('p');description.id='guest-limit-description';description.textContent="You've used your two minutes of free guest browsing. Sign in or create a free account to continue using the tools, courses and job resources.";
  const note=document.createElement('p');note.className='guest-limit-note';note.textContent='Already registered? Select Log in. New here? Choose Create account and enter your name and email. We use secure email links, not passwords.';
  const actions=document.createElement('div');actions.className='guest-limit-actions';
  const login=document.createElement('a');login.href='/account/';login.className='guest-limit-action-primary';login.textContent='Log in or create account ↗';
  const privacy=document.createElement('a');privacy.href='/privacy/';privacy.className='guest-limit-action-secondary';privacy.textContent='Privacy information';
  actions.append(login,privacy);box.append(emblem,kicker,title,description,note,actions);dialog.append(box);
  previouslyFocused=document.activeElement;
  document.body.append(dialog);
  document.body.classList.add('guest-limit-locked');
  for(const element of document.querySelectorAll('header,main,footer'))element.inert=true;
  // Preserve underlying document HTML for indexing; restrict keyboard focus during the prompt.
  dialog.addEventListener('keydown',event=>{
   if(event.key!=='Tab')return;
   const links=[...dialog.querySelectorAll('a[href]')];
   if(!links.length)return;
   const first=links[0],last=links[links.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  dialog.querySelector('a')?.focus();
 }
 function unlock(){
  if(dialog){dialog.remove();dialog=null;}
  document.body.classList.remove('guest-limit-locked');
  for(const element of document.querySelectorAll('header,main,footer'))element.inert=false;
  if(previouslyFocused?.isConnected)previouslyFocused.focus?.();
  previouslyFocused=null;
 }
 async function session(){
  if(checking)return;checking=true;
  try{
   // getUser() returns AuthSessionMissingError for a normal signed-out guest.
   // A guest is not an identity-service failure: always start/enforce the timer.
   const {data:cached,error:sessionError}=await db.auth.getSession();
   if(sessionError)throw sessionError;
   if(!cached?.session){
    signedIn=false;ready=true;
    if(active>=LIMIT_MS)lock();else unlock();
   }else{
    const {data,error}=await db.auth.getUser();
    if(error)throw error;
    signedIn=!!data?.user;ready=true;
    if(signedIn)unlock();
    else if(active>=LIMIT_MS)lock();
    else unlock();
   }
  }catch{ready=false;unlock();}
  finally{last=Date.now();checking=false;}
 }
 function tick(){
  if(!ready||signedIn||document.visibilityState!=='visible'){last=Date.now();return;}
  pauseClock();
  if(active>=LIMIT_MS)lock();
 }
 db.auth.onAuthStateChange(()=>{queueMicrotask(session);});
 window.addEventListener('pageshow',session);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')pauseClock();else last=Date.now();});
 window.addEventListener('pagehide',pauseClock);
 clock=window.setInterval(tick,1000);
 session();
})();