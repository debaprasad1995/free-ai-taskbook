/* Optional Supabase Auth: browser receives only the publishable key. */
(async()=>{
 const panel=document.querySelector('#auth-panel');if(!panel||!panel.dataset.authUrl)return;
 const message=document.querySelector('#auth-message');const setMessage=t=>{if(message)message.textContent=t;};
 if(!window.supabase?.createClient){setMessage('Sign-in library unavailable. Please try again later.');return;}
 const supabase=window.supabase.createClient(panel.dataset.authUrl,panel.dataset.authKey,{auth:{flowType:'pkce',detectSessionInUrl:true}});
 const form=document.querySelector('#auth-form');const profile=document.querySelector('#auth-profile');const userEmail=document.querySelector('#auth-user-email');
 async function show(){const {data,error}=await supabase.auth.getUser();if(error&&error.name!=='AuthSessionMissingError'){setMessage('Could not read your session.');}const user=data?.user;form.hidden=!!user;profile.hidden=!user;if(userEmail)userEmail.textContent=user?.email||'Signed-in user';}
 form?.addEventListener('submit',async e=>{e.preventDefault();const input=document.querySelector('#auth-email');const email=input?.value?.trim();if(!email||!document.querySelector('#auth-consent').checked)return;
 const button=form.querySelector('button');button.disabled=true;setMessage('Sending a one-time sign-in link…');
 try{const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+'/account/'}});if(error)throw error;setMessage('Check your inbox. Follow the sign-in link to return here.');}
 catch{setMessage('Sign-in email could not be sent. Check your address or try later.');}finally{button.disabled=false;}
 });
 document.querySelector('#auth-signout')?.addEventListener('click',async()=>{await supabase.auth.signOut();setMessage('You are signed out.');await show();});
 supabase.auth.onAuthStateChange(()=>{setTimeout(show,0);});await show();
})();
