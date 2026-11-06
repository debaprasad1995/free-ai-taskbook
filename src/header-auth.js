/* Shared authenticated header across every public and account page. */
(()=>{
 const link=document.querySelector('[data-account-link]');
 const cfg=window.TASKBOOK_CONFIG;
 if(!link||!cfg?.url||!cfg?.key||!window.supabase?.createClient)return;
 const db=window.supabase.createClient(cfg.url,cfg.key,{auth:{flowType:'pkce',detectSessionInUrl:false}});
 let request=0;
 const setLabel=name=>{
  const label=String(name||'').trim().replace(/\s+/g,' ').slice(0,100);
  link.textContent=label?'👤 '+label:'Log in / Join';
  link.setAttribute('aria-label',label?'Open account for '+label:'Log in or create an account');
  link.title=label?'My account: '+label:'Log in or create an account';
  link.classList.toggle('signed-in-account',!!label);
 };
 async function update(){
  const current=++request;
  try{
   const {data,error}=await db.auth.getUser();
   if(current!==request)return;
   const user=error?null:data?.user;
   if(!user){setLabel('');return;}
   let name=user.user_metadata?.full_name||user.user_metadata?.name||'';
   if(!name){
    const {data:profile}=await db.from('user_profiles').select('display_name').eq('user_id',user.id).maybeSingle();
    if(current!==request)return;
    name=profile?.display_name||'';
   }
   setLabel(name||user.email?.split('@')[0]||'My account');
  }catch{if(current===request)setLabel('');}
 }
 db.auth.onAuthStateChange(()=>{queueMicrotask(update)});
 document.addEventListener('taskbook:profile-updated',update);
 window.addEventListener('pageshow',update);
 update();
})();