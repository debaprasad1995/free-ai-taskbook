/* Passwordless auth with separate new-account and returning-user flows. */
(async()=>{
 const panel=document.getElementById('auth-panel');
 if(!panel||!panel.dataset.authUrl)return;
 const message=document.getElementById('auth-message');
 const report=t=>{if(message)message.textContent=t;};
 if(!window.supabase?.createClient){report('Sign-in services are temporarily unavailable.');return;}
 const db=window.supabase.createClient(panel.dataset.authUrl,panel.dataset.authKey,{auth:{flowType:'pkce',detectSessionInUrl:true}});
 const form=document.getElementById('auth-form'),profile=document.getElementById('auth-profile'),emailLabel=document.getElementById('auth-user-email');
 const registerBtn=document.getElementById('auth-mode-register'),loginBtn=document.getElementById('auth-mode-login');
 const nameRow=document.getElementById('auth-name-row'),name=document.getElementById('auth-name');
 const consentRow=document.getElementById('auth-consent-row'),consent=document.getElementById('auth-consent');
 const submit=document.getElementById('auth-submit'),heading=document.getElementById('auth-form-heading'),desc=document.getElementById('auth-form-description');
 const displayName=document.getElementById('auth-display-name');
 let mode='login';
 function switchMode(next){
  mode=next;
  const creating=mode==='register';
  if(nameRow)nameRow.hidden=!creating;
  if(consentRow)consentRow.hidden=!creating;
  if(name)name.required=creating;
  if(consent)consent.required=creating;
  if(loginBtn)loginBtn.setAttribute('aria-pressed',String(!creating));
  if(registerBtn)registerBtn.setAttribute('aria-pressed',String(creating));
  if(heading)heading.textContent=creating?'Create your free account':'Log in to your account';
  if(desc)desc.textContent=creating?'Enter your name and email. We will send a secure verification link.':'Already registered? Enter your email to receive a sign-in link.';
  if(submit)submit.textContent=creating?'Create account with email ↗':'Send login link ↗';
  report('');
 }
 loginBtn?.addEventListener('click',()=>switchMode('login'));
 registerBtn?.addEventListener('click',()=>switchMode('register'));
 async function show(){
  const {data,error}=await db.auth.getUser();
  if(error&&error.name!=='AuthSessionMissingError')report('Could not read your session.');
  const user=data?.user;
  if(form)form.hidden=!!user;
  if(profile)profile.hidden=!user;
  document.getElementById('auth-choice')?.setAttribute('hidden',String(!!user));
  // The choice uses a class, not a hidden attribute on an adjacent container.
  for(const b of [registerBtn,loginBtn])if(b)b.hidden=!!user;
  if(heading)heading.hidden=!!user;
  if(desc)desc.hidden=!!user;
  if(emailLabel)emailLabel.textContent=user?.email||'Signed-in user';
  if(displayName)displayName.value=user?.user_metadata?.full_name||'';
  if(user&&user.user_metadata?.full_name){
   // Inserting only a display name does not erase existing interests or saved items.
   await db.from('user_profiles').upsert({user_id:user.id,display_name:user.user_metadata.full_name.slice(0,100)},{onConflict:'user_id',ignoreDuplicates:true});
  }
 }
 form?.addEventListener('submit',async event=>{
  event.preventDefault();
  const email=document.getElementById('auth-email')?.value?.trim().toLowerCase();
  if(!email)return;
  const creating=mode==='register';
  const fullName=name?.value?.trim().replace(/\s+/g,' ')||'';
  if(creating&&(fullName.length<2||fullName.length>100||!consent?.checked)){
   report('Enter your name and accept the privacy notice to register.');return;
  }
  if(submit)submit.disabled=true;
  report('Preparing your secure email link…');
  try{
   const options={emailRedirectTo:location.origin+'/account/',shouldCreateUser:creating};
   if(creating)options.data={full_name:fullName};
   const {error}=await db.auth.signInWithOtp({email,options});
   if(error)throw error;
   report('Check your inbox for the secure link. If the address is eligible, an email will arrive shortly.');
  }catch{report('Could not request your link. Check your email or try again later.');}
  finally{if(submit)submit.disabled=false;}
 });
 document.getElementById('auth-save-name')?.addEventListener('click',async()=>{
  const fullName=displayName?.value?.trim().replace(/\s+/g,' ')||'';
  if(fullName.length<2||fullName.length>100){report('Enter a name between 2 and 100 characters.');return;}
  const {data}=await db.auth.getUser();
  if(!data?.user){report('Sign in again to update your name.');return;}
  const update=await db.auth.updateUser({data:{full_name:fullName}});
  if(update.error){report('Could not update your name.');return;}
  const save=await db.from('user_profiles').upsert({user_id:data.user.id,display_name:fullName},{onConflict:'user_id'});
  report(save.error?'Account name updated; profile sync needs another attempt.':'Your name was saved.');
 });
 document.getElementById('auth-signout')?.addEventListener('click',async()=>{
  const {error}=await db.auth.signOut();
  report(error?'Sign-out failed. Please try again.':'You are signed out.');
  if(!error)await show();
 });
 db.auth.onAuthStateChange(()=>{setTimeout(show,0);});
 switchMode('login');
 await show();
})();