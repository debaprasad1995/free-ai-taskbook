/* FreeAITaskbook database-backed features. Public key only; RLS enforces authorization. */
(()=>{
 const config=window.TASKBOOK_CONFIG||{};
 const panel=document.querySelector('[data-platform]');
 if(!panel)return;
 const status=document.querySelector('#platform-status');
 const tell=(msg)=>{if(status)status.textContent=msg;};
 if(!config.url||!config.key||!window.supabase?.createClient){tell('Account services are not configured. The public directory remains available.');return;}
 const client=window.supabase.createClient(config.url,config.key,{auth:{flowType:'pkce',detectSessionInUrl:true}});
 const url=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}};
 const text=(parent,tag,value)=>{const el=document.createElement(tag);el.textContent=String(value||'');parent.append(el);return el;};
 const link=(parent,href,title)=>{const safe=url(href);if(!safe)return;const a=text(parent,'a',title+' ↗');a.href=safe;a.target='_blank';a.rel='noopener noreferrer';};
 const formValue=(form,name)=>String(new FormData(form).get(name)||'').trim();
 const display=(id,visible)=>{const el=document.getElementById(id);if(el)el.hidden=!visible;};
 async function session(){const {data,error}=await client.auth.getUser();if(error)return null;return data?.user||null;}
 async function query(table,fields='*'){const {data,error}=await client.from(table).select(fields);if(error)throw error;return data||[];}
 const userMessage='Sign in through the Account page to use saved resources and private submissions.';
 async function dashboard(){
   const user=await session();if(!user){tell(userMessage);return;}
   display('dashboard-private',true);tell('Your account data is private to your signed-in account.');
   const profile=document.querySelector('#profile-form');
   const saved=document.querySelector('#saved-items');
   const submissions=document.querySelector('#my-submissions');
   async function load(){
    try{
     const {data:p,error:pe}=await client.from('user_profiles').select('display_name,preferred_roles,preferred_locations').eq('user_id',user.id).maybeSingle();if(pe)throw pe;
     if(p&&profile){profile.elements.display_name.value=p.display_name||'';profile.elements.preferred_roles.value=(p.preferred_roles||[]).join(', ');profile.elements.preferred_locations.value=(p.preferred_locations||[]).join(', ');}
     const marks=await query('saved_items','item_kind,item_id,saved_at');saved.replaceChildren();
     if(!marks.length)text(saved,'p','You have no saved items yet.');
     for(const item of marks){const section=document.createElement('div');section.className='guide-card';text(section,'strong',item.item_kind+' · '+item.item_id);const b=text(section,'button','Remove');b.type='button';b.onclick=async()=>{const {error}=await client.from('saved_items').delete().eq('user_id',user.id).eq('item_kind',item.item_kind).eq('item_id',item.item_id);if(error)tell('Unable to remove saved item.');else load();};saved.append(section);}
     const rows=await query('community_submissions','id,title,kind,status,submitted_at');submissions.replaceChildren();if(!rows.length)text(submissions,'p','No private submissions yet.');for(const s of rows){const el=document.createElement('p');text(el,'strong',s.title);text(el,'span',' · '+s.status);submissions.append(el);}
    }catch(e){tell('Could not load your account data. Please check the connection and try again.');}
   }
   profile?.addEventListener('submit',async e=>{e.preventDefault();const clean=v=>v.split(',').map(x=>x.trim()).filter(Boolean).slice(0,12);const d={user_id:user.id,display_name:formValue(profile,'display_name').slice(0,120)||null,preferred_roles:clean(formValue(profile,'preferred_roles')),preferred_locations:clean(formValue(profile,'preferred_locations'))};const {error}=await client.from('user_profiles').upsert(d,{onConflict:'user_id'});tell(error?'Profile could not be saved.':'Profile saved.');});
   document.querySelector('#saved-form')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget;const kind=formValue(f,'item_kind'),id=formValue(f,'item_id');if(!/^[a-z0-9-]{2,150}$/.test(id))return tell('Enter a valid tool or job identifier.');const {error}=await client.from('saved_items').upsert({user_id:user.id,item_kind:kind,item_id:id},{onConflict:'user_id,item_kind,item_id'});if(error)tell('Could not save item.');else{tell('Saved.');f.reset();load();}});
   await load();
 }
 async function submission(){
   const user=await session();if(!user){tell(userMessage);return;}
   display('private-submission-form',true);tell('You can send a private suggestion for moderation.');
   const form=document.getElementById('private-submission-form');form?.addEventListener('submit',async e=>{
    e.preventDefault();const kind=formValue(form,'kind'),title=formValue(form,'title'),official_url=url(formValue(form,'official_url')),description=formValue(form,'description');
    if(!official_url||title.length<3||description.length<15)return tell('Enter an HTTPS official URL and enough information to verify the resource.');
    const button=form.querySelector('button');button.disabled=true;
    const {error}=await client.from('community_submissions').insert({submitted_by:user.id,kind,title,official_url,description});
    button.disabled=false;tell(error?'Submission was not saved. Please try again.':'Submission saved for administrator review.');if(!error)form.reset();
   });
 }
 async function admin(){
   const user=await session();if(!user){tell(userMessage);return;}
   // Authorization must come from server-managed app_metadata, NEVER user_metadata or a UI flag.
   if(user.app_metadata?.role!=='admin'){tell('Administrator privileges are required.');return;}
   display('admin-private',true);tell('Administrator access confirmed by Supabase Auth.');
   const queue=document.getElementById('moderation-queue'),jobForm=document.getElementById('admin-job-form');
   async function load(){
    try{const entries=await query('community_submissions','id,kind,title,official_url,description,status,submitted_at');queue.replaceChildren();
     const pending=entries.filter(s=>s.status==='pending'||s.status==='in_review');if(!pending.length)text(queue,'p','No pending submissions.');
     for(const s of pending){const card=document.createElement('div');card.className='guide-card';text(card,'h3',s.title+' · '+s.kind);text(card,'p',s.description);link(card,s.official_url,'Official source');const reject=text(card,'button','Reject');reject.type='button';reject.onclick=async()=>{const {error}=await client.from('community_submissions').update({status:'rejected',reviewed_at:new Date().toISOString()}).eq('id',s.id);tell(error?'Could not reject submission.':'Submission rejected.');if(!error)load();};
      // Approval is a review decision, not automatic catalog publication: details need verified classification.
      const approve=text(card,'button','Mark reviewed');approve.type='button';approve.onclick=async()=>{const {error}=await client.from('community_submissions').update({status:'in_review'}).eq('id',s.id);tell(error?'Could not update submission.':'Submission moved to review. Create a verified resource in the catalog before marking approved.');if(!error)load();};queue.append(card);}
    }catch{tell('Unable to load administrator queue.');}
   }
   document.getElementById('admin-resource-form')?.addEventListener('submit',async e=>{
    e.preventDefault();const f=e.currentTarget;const title=formValue(f,'title'),slug=formValue(f,'slug'),official_url=url(formValue(f,'official_url')),source_url=url(formValue(f,'source_url'));
    if(!official_url||!source_url||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return tell('Use a valid slug and HTTPS official/source URLs.');
    const {error}=await client.from('resource_catalog').insert({kind:formValue(f,'kind'),title,slug,official_url,source_url,summary:formValue(f,'summary'),category:formValue(f,'category'),pricing_class:formValue(f,'pricing_class'),review_status:'published',last_verified_at:new Date().toISOString()});
    tell(error?'Publishing failed; check duplicates, authorization and required values.':'Verified resource published to database. It will appear in the live database feed.');if(!error)f.reset();
   });
   jobForm?.addEventListener('submit',async e=>{
    e.preventDefault();const f=e.currentTarget,official_notification_url=url(formValue(f,'official_notification_url'));
    if(!official_notification_url)return tell('Use an HTTPS notification link from the employer or recruiting agency.');
    const values={source_key:formValue(f,'source_key'),external_id:formValue(f,'external_id'),title:formValue(f,'title'),organization:formValue(f,'organization'),location:formValue(f,'location')||null,job_type:formValue(f,'job_type'),official_notification_url,application_url:url(formValue(f,'application_url')),review_status:'verified',status:'open',verified_at:new Date().toISOString(),application_deadline:formValue(f,'application_deadline')||null};
    if(values.application_deadline&&values.application_deadline<new Date().toISOString().slice(0,10))return tell('This application deadline has already passed.');
    const {error}=await client.from('job_postings').upsert(values,{onConflict:'source_key,external_id'});tell(error?'Job publication failed. Verify permissions and fields.':'Verified job published to the live job feed.');if(!error)f.reset();
   });
   await load();
 }
 async function resources(){
   const root=document.querySelector('#live-resource-feed');if(!root)return;
   if(!config.url||!config.key)return text(root,'p','Live database resources are not configured.');
   try{const items=(await query('resource_catalog','kind,title,summary,category,official_url,pricing_class,last_verified_at')).slice(0,30);root.replaceChildren();
    if(!items.length)return text(root,'p','No additional database-verified resources have been published yet. Explore the existing curated directory above.');
    for(const r of items){const card=document.createElement('article');card.className='guide-card';text(card,'span',r.category+' · '+r.pricing_class);text(card,'h3',r.title);text(card,'p',r.summary);link(card,r.official_url,'Visit official provider');text(card,'small',r.last_verified_at?'Last verified: '+new Date(r.last_verified_at).toLocaleDateString():'Verification not dated');root.append(card);}
   }catch{text(root,'p','The live resource feed could not be loaded.');}
 }
 if(panel.dataset.platform==='dashboard')dashboard();
 if(panel.dataset.platform==='submit')submission();
 if(panel.dataset.platform==='admin')admin();
 if(panel.dataset.platform==='resources')resources();
})();
