drop policy if exists course_activity_admin_consented on public.course_activity_events;
create or replace function public.admin_learning_interest_report()
returns table(topic text,video_starts bigint,learners bigint)
language sql stable security definer set search_path=''
as $$
 select e.topic,count(*)::bigint,count(distinct e.user_id)::bigint
 from public.course_activity_events e
 join public.user_profiles p on p.user_id=e.user_id
 where (select auth.jwt()->'app_metadata'->>'role')='admin'
   and p.preferences->>'share_learning_activity'='true'
   and e.occurred_at >= now() - interval '90 days'
 group by e.topic
 order by count(*) desc
 limit 30
$$;
revoke all on function public.admin_learning_interest_report() from public,anon;
grant execute on function public.admin_learning_interest_report() to authenticated;
