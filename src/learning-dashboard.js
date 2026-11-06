/* Separate account-only learning dashboard and administrator aggregate. */
(()=>{document.addEventListener('DOMContentLoaded',async()=>{
 const dashboard=document.getElementById('dashboard-course-progress');
 const admin=document.getElementById('admin-learning-insights');
 if(!dashboard&&!admin)return;
 const config=window.TASKBOOK_CONFIG||{};
 if(!config.url||!config.key||!window.supabase?.createClient){if(dashboard)dashboard.textContent='Account features are not configured.';return;}
 const client=window.supabase.createClient(config.url,config.key,{auth:{flowType:'pkce',detectSessionInUrl:true}});
 const {data,error}=await client.auth.getUser();const user=error?null:data?.user;
 if(!user){if(dashboard)dashboard.textContent='Sign in to see your saved courses.';return;}
 function message(node,text){if(node)node.textContent=text;}
 function node(parent,tag,value){const e=document.createElement(tag);if(value!==undefined)e.textContent=String(value);parent.append(e);return e;}
 if(dashboard){
  const checkbox=document.getElementById('learning-analytics-consent'),note=document.getElementById('learning-privacy-status');
  let preferences={};
  const {data:profile}=await client.from('user_profiles').select('preferences').eq('user_id',user.id).maybeSingle();
  preferences=profile?.preferences||{};
  if(checkbox)checkbox.checked=preferences.share_learning_activity===true;
  const setPref=async enabled=>{
    const {error}=await client.from('user_profiles').upsert({user_id:user.id,preferences:{...preferences,share_learning_activity:enabled}},{onConflict:'user_id'});
    if(error){message(note,'Could not update your preference.');return;}
    preferences={...preferences,share_learning_activity:enabled};
    if(!enabled){
      const {error:deleteError}=await client.from('course_activity_events').delete().eq('user_id',user.id);
      message(note,deleteError?'Sharing is disabled, but history deletion failed. Please retry deletion.':'Sharing is disabled. Your recorded course-start events were deleted.');
    }else message(note,'You opted in to aggregate learning analytics.');
  };
  document.getElementById('learning-analytics-save')?.addEventListener('click',()=>setPref(!!checkbox?.checked));
  document.getElementById('learning-analytics-delete')?.addEventListener('click',async()=>{
    const {error}=await client.from('course_activity_events').delete().eq('user_id',user.id);
    message(note,error?'History deletion failed. Please retry.':'Your recorded course-start events were deleted.');
  });
  async function loadCourses(){
   const {data,error}=await client.from('course_progress').select('course_id,course_title,topic,level,status,updated_at').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(150);
   dashboard.replaceChildren();
   if(error){message(dashboard,'Could not load saved courses.');return;}
   if(!data?.length){const empty=node(dashboard,'p','No courses saved yet. Explore the Learning Hub and choose Save course.');const a=node(dashboard,'a','Explore courses ↗');a.href='/learn/';return;}
   for(const c of data){
    const card=node(dashboard,'article');card.className='guide-card course-progress-card';
    node(card,'h3',c.course_title);
    node(card,'p',c.topic+' · '+c.level);
    const label=node(card,'label','Progress ');
    const select=node(label,'select');
    for(const status of ['saved','learning','completed']){
     const opt=node(select,'option',status==='saved'?'Saved':status==='learning'?'In progress':'Completed');
     opt.value=status;opt.selected=c.status===status;
    }
    const update=node(card,'button','Update progress');update.type='button';update.className='course-save-button';
    update.addEventListener('click',async()=>{
     const {error}=await client.from('course_progress').update({status:select.value,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('course_id',c.course_id);
     if(error)update.textContent='Retry update';else {update.textContent='Updated ✓';loadCourses();}
    });
    const a=node(card,'a','Find this course ↗');a.href='/learn/?course='+encodeURIComponent(c.course_title)+'#video-course-grid';
    const remove=node(card,'button','Remove course');remove.type='button';remove.className='compare-secondary';
    remove.addEventListener('click',async()=>{
     const {error}=await client.from('course_progress').delete().eq('user_id',user.id).eq('course_id',c.course_id);
     if(!error)loadCourses();else remove.textContent='Could not remove';
    });
   }
  }
  await loadCourses();
 }
 if(admin){
  if(user.app_metadata?.role!=='admin'){message(admin,'Administrator role required.');return;}
  const {data,error}=await client.rpc('admin_learning_interest_report');
  admin.replaceChildren();
  if(error){message(admin,'Could not load analytics; verify database migration and permissions.');return;}
  if(!data?.length){message(admin,'No opted-in course starts recorded in the last 90 days.');return;}
  for(const row of data){
   const card=node(admin,'article');card.className='guide-card analytics-card';
   node(card,'h3',row.topic);
   node(card,'strong',row.video_starts+' video starts');
   node(card,'p',row.learners+' opted-in learners');
  }
 }
});})();