/* Account-owned course progress. Optional, consent-based aggregate analytics. */
(()=>{document.addEventListener('DOMContentLoaded',async()=>{
 const config=window.TASKBOOK_CONFIG||{};
 const banner=document.getElementById('learning-account-banner');
 const cards=[...document.querySelectorAll('[data-video-course]')];
 if(!banner||!cards.length)return;
 if(!config.url||!config.key||!window.supabase?.createClient){return;}
 const db=window.supabase.createClient(config.url,config.key,{auth:{flowType:'pkce',detectSessionInUrl:true}});
 const {data,error}=await db.auth.getUser();const user=error?null:data?.user;
 if(!user)return;
 banner.replaceChildren();
 const heading=document.createElement('strong');heading.textContent='Your learning space';
 const desc=document.createElement('span');desc.textContent='Save courses, track progress and resume from your dashboard.';
 const a=document.createElement('a');a.href='/dashboard/';a.textContent='My dashboard ↗';
 banner.append(heading,desc,a);
 const {data:rows}=await db.from('course_progress').select('course_id,status').eq('user_id',user.id).limit(500);
 const saved=new Map((rows||[]).map(row=>[row.course_id,row.status]));
 const {data:profile}=await db.from('user_profiles').select('preferences').eq('user_id',user.id).maybeSingle();
 const sharing=profile?.preferences?.share_learning_activity===true;
 function notify(card,message){
  let notice=card.querySelector('.course-save-status');
  if(!notice){notice=document.createElement('p');notice.className='course-save-status';notice.setAttribute('role','status');card.querySelector('.video-info')?.append(notice);}
  notice.textContent=message;
 }
 function info(card){
  const slug=card.dataset.courseSlug||'',title=card.querySelector('h3')?.textContent||'';
  return {user_id:user.id,course_id:slug,course_title:title.slice(0,220),topic:card.dataset.topic||'',level:card.dataset.level||'Beginner'};
 }
 for(const card of cards){
  if(!/^[a-z0-9][a-z0-9-]{1,99}$/.test(card.dataset.courseSlug||''))continue;
  const btn=document.createElement('button');btn.type='button';btn.className='course-save-button';
  const refresh=()=>{btn.textContent=saved.has(card.dataset.courseSlug)?'✓ Saved to account':'☆ Save course';};
  refresh();
  card.querySelector('.video-info')?.append(btn);
  btn.addEventListener('click',async()=>{
   btn.disabled=true;const course=info(card);
   if(saved.has(course.course_id)){
    const {error}=await db.from('course_progress').delete().eq('user_id',user.id).eq('course_id',course.course_id);
    if(!error){saved.delete(course.course_id);notify(card,'Removed from your learning library.');}
    else notify(card,'Could not remove course.');
   }else{
    const {error}=await db.from('course_progress').upsert({...course,status:'saved',updated_at:new Date().toISOString()},{onConflict:'user_id,course_id'});
    if(!error){saved.set(course.course_id,'saved');notify(card,'Saved. Open your dashboard to track progress.');}
    else notify(card,'Could not save course. Please try again.');
   }
   btn.disabled=false;refresh();
  });
 }
 document.addEventListener('taskbook:course-started',async event=>{
  const card=event.detail?.card;if(!card||!card.dataset.courseSlug)return;
  const course=info(card);
  // Insert a new learning record only when absent. Never overwrite an existing
  // record (especially "completed") when a video is played again.
  const {error:insertError}=await db.from('course_progress').upsert(
   {...course,status:'learning',updated_at:new Date().toISOString()},
   {onConflict:'user_id,course_id',ignoreDuplicates:true}
  );
  if(!insertError){
   // Only advance "saved" to "learning". A completed course stays completed
   // even when another browser tab starts playback concurrently.
   const {data:advanced,error:updateError}=await db.from('course_progress')
    .update({status:'learning',updated_at:new Date().toISOString()})
    .eq('user_id',user.id).eq('course_id',course.course_id).eq('status','saved')
    .select('course_id');
   if(!updateError){
    const {data:current}=await db.from('course_progress').select('status')
     .eq('user_id',user.id).eq('course_id',course.course_id).maybeSingle();
    if(current)saved.set(course.course_id,current.status);
   }
  }
  if(!sharing)return;
  // Counting a user-initiated play, not YouTube viewing duration.
  await db.from('course_activity_events').insert({user_id:user.id,course_id:course.course_id,topic:course.topic,action:'video_started'});
 });
});})();
