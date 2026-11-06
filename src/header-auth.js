/* Shared authenticated account menu across public and account pages. */
(()=>{
 const link=document.querySelector('[data-account-link]');
 const menu=document.getElementById('account-menu');
 const adminLink=document.querySelector('[data-admin-menu-link]');
 const signout=document.querySelector('[data-header-signout]');
 const menuStatus=document.querySelector('[data-menu-status]');
 const cfg=window.TASKBOOK_CONFIG;
 if(!link||!menu||!cfg?.url||!cfg?.key||!window.supabase?.createClient)return;
 const db=window.supabase.createClient(cfg.url,cfg.key,{auth:{flowType:'pkce',detectSessionInUrl:false}});
 let request=0;
 let signedIn=false;
 const close=()=>{
  menu.hidden=true;
  link.setAttribute('aria-expanded','false');
 };
 const setLabel=(name,user)=>{
  signedIn=!!user;
  const label=String(name||'').trim().replace(/\s+/g,' ').slice(0,100);
  link.textContent=signedIn?'👤 '+(label||'My account')+' ▾':'Log in / Join';
  link.setAttribute('aria-label',signedIn?'Open account menu for '+(label||'My account'):'Log in or create an account');
  link.title=signedIn?'Open account menu':'Log in or create an account';
  link.classList.toggle('signed-in-account',signedIn);
  link.setAttribute('aria-haspopup',signedIn?'true':'false');
  if(adminLink)adminLink.hidden=!(user?.app_metadata?.role==='admin');
  close();
 };
 link.addEventListener('click',event=>{
  if(!signedIn)return;
  event.preventDefault();
  const shouldOpen=menu.hidden;
  close();
  if(shouldOpen){menu.hidden=false;link.setAttribute('aria-expanded','true');}
 });
 document.addEventListener('click',event=>{
  if(!menu.hidden && !menu.contains(event.target) && !link.contains(event.target))close();
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!menu.hidden){close();link.focus();}
 });
 signout?.addEventListener('click',async()=>{
  signout.disabled=true;
  if(menuStatus)menuStatus.textContent='Signing out…';
  try{
   const {error}=await db.auth.signOut();
   if(error){
    if(menuStatus)menuStatus.textContent='Sign out failed. Please try again.';
    signout.disabled=false;
    return;
   }
   close();
   window.location.assign('/account/');
  }catch{
   if(menuStatus)menuStatus.textContent='Sign out failed. Please try again.';
   signout.disabled=false;
  }
 });
 async function update(){
  const current=++request;
  try{
   const {data,error}=await db.auth.getUser();
   if(current!==request)return;
   const user=error?null:data?.user;
   if(!user){setLabel('',null);return;}
   let name=user.user_metadata?.full_name||user.user_metadata?.name||'';
   if(!name){
    const {data:profile}=await db.from('user_profiles').select('display_name').eq('user_id',user.id).maybeSingle();
    if(current!==request)return;
    name=profile?.display_name||'';
   }
   setLabel(name||user.email?.split('@')[0]||'My account',user);
  }catch{if(current===request)setLabel('',null);}
 }
 db.auth.onAuthStateChange(()=>{queueMicrotask(update)});
 document.addEventListener('taskbook:profile-updated',update);
 window.addEventListener('pageshow',update);
 update();
})();