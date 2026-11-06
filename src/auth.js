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
 let pending=false;
 let cooldownUntil=0;
 let cooldownTimer=null;
 const loginLabel='Send login link ↗';
 const registerLabel='Create account with email ↗';
 const errorDetails=error=>{
  const code=String(error?.code||'').toLowerCase();
  const status=Number(error?.status||0);
  if(code==='over_email_send_rate_limit'||status===429){
   return {message:'Email delivery is temporarily rate-limited by our authentication provider. No link was sent. Please try again later. Site administrators need to configure production SMTP for reliable login.',cooldown:300000};
  }
  if(code==='email_address_not_authorized'){
   return {message:'Our email provider is not yet configured to send to this address. Please contact the site administrator to enable production email delivery.',cooldown:0};
  }
  if(code==='otp_disabled'){
   return {message:'This email login or registration request is blocked by the current authentication settings. Please contact the site administrator.',cooldown:0};
  }
  if(code==='over_request_rate_limit'){
   return {message:'Too many requests. Please try again later.',cooldown:60000};
  }
  if(status>=500)return {message:'The authentication service is temporarily unavailable. Please try again later.',cooldown:0};
  return {message:'Unable to request an email link. Check your connection and email address, or try again later.',cooldown:0};
 };
 const buttonText=()=>mode==='register'?registerLabel:loginLabel;
 function syncButton(){
  if(!submit)return;
  const remaining=Math.max(0,Math.ceil((cooldownUntil-Date.now())/1000));
  submit.disabled=pending||remaining>0;
  submit.textContent=pending?'Sending…':remaining>0?'Try again later ('+remaining+'s)':buttonText();
  if(!remaining&&cooldownTimer){clearInterval(cooldownTimer);cooldownTimer=null;}
 }
 function cooldown(ms){
  cooldownUntil=Date.now()+ms;
  if(cooldownTimer)clearInterval(cooldownTimer);
  cooldownTimer=setInterval(syncButton,1000);
  syncButton();
 }

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
  syncButton();
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
  const authChoice=document.getElementById('auth-choice');if(authChoice)authChoice.hidden=!!user;
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
  if(pending)return;
  if(Date.now()<cooldownUntil){
   report('Please avoid repeated requests. The email provider may still be rate-limited.');
   syncButton();return;
  }
  const email=document.getElementById('auth-email')?.value?.trim().toLowerCase();
  if(!email)return;
  const creating=mode==='register';
  const fullName=name?.value?.trim().replace(/\s+/g,' ')||'';
  if(creating&&(fullName.length<2||fullName.length>100||!consent?.checked)){
   report('Enter your name and accept the privacy notice to register.');return;
  }
  pending=true;syncButton();
  report('Requesting a secure sign-in email…');
  try{
   const options={emailRedirectTo:location.origin+'/account/',shouldCreateUser:creating};
   if(creating)options.data={full_name:fullName};
   const {error}=await db.auth.signInWithOtp({email,options});
   if(error)throw error;
   report('If this email can receive sign-in links, please check your inbox and spam folder. Avoid requesting another link immediately.');
   cooldown(60000);
  }catch(error){
   const detail=errorDetails(error);
   report(detail.message);
   if(detail.cooldown)cooldown(detail.cooldown);
  }finally{
   pending=false;syncButton();
  }
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
  document.dispatchEvent(new Event('taskbook:profile-updated'));
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