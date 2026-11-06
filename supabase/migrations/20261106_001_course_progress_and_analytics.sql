-- FreeAITaskbook account-owned learning progress, optional consented events, and private admin report.
-- Applied to Supabase production on 2026-11-06. Safe additive migration.
create table if not exists public.course_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 course_id text not null check(course_id ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
 course_title text not null check(length(course_title) between 3 and 220),
 topic text not null check(length(topic) between 2 and 100),
 level text not null check(level in ('Beginner','Intermediate','Advanced')),
 status text not null default 'saved' check(status in ('saved','learning','completed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 primary key(user_id,course_id)
);
create index if not exists course_progress_recent_idx on public.course_progress(user_id,updated_at desc);
alter table public.course_progress enable row level security;
revoke all on public.course_progress from anon,authenticated;
grant select,insert,update,delete on public.course_progress to authenticated;
drop policy if exists course_progress_own_select on public.course_progress;
drop policy if exists course_progress_own_insert on public.course_progress;
drop policy if exists course_progress_own_update on public.course_progress;
drop policy if exists course_progress_own_delete on public.course_progress;
create policy course_progress_own_select on public.course_progress for select to authenticated using ((select auth.uid())=user_id);
create policy course_progress_own_insert on public.course_progress for insert to authenticated with check ((select auth.uid())=user_id);
create policy course_progress_own_update on public.course_progress for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy course_progress_own_delete on public.course_progress for delete to authenticated using ((select auth.uid())=user_id);

create table if not exists public.course_activity_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 course_id text not null check(course_id ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
 topic text not null check(length(topic) between 2 and 100),
 action text not null check(action in ('video_started')),
 occurred_at timestamptz not null default now()
);
create index if not exists course_activity_user_recent on public.course_activity_events(user_id,occurred_at desc);
create index if not exists course_activity_topic_recent on public.course_activity_events(topic,occurred_at desc);
alter table public.course_activity_events enable row level security;
revoke all on public.course_activity_events from anon,authenticated;
grant select,insert,delete on public.course_activity_events to authenticated;
drop policy if exists course_activity_owner_read on public.course_activity_events;
drop policy if exists course_activity_owner_insert on public.course_activity_events;
drop policy if exists course_activity_owner_delete on public.course_activity_events;
drop policy if exists course_activity_admin_consented on public.course_activity_events;
create policy course_activity_owner_read on public.course_activity_events for select to authenticated using ((select auth.uid())=user_id);
create policy course_activity_owner_delete on public.course_activity_events for delete to authenticated using ((select auth.uid())=user_id);
create policy course_activity_owner_insert on public.course_activity_events for insert to authenticated with check (
 (select auth.uid())=user_id and exists (
 select 1 from public.user_profiles p where p.user_id=(select auth.uid())
 and p.preferences->>'share_learning_activity'='true'
 )
);
-- Admin sees aggregate counts, not individual user histories. Browser never gets server secrets.
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
