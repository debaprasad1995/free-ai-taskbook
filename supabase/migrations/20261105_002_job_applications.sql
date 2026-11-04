-- Additive, account-owned application tracking. No existing table modified.
create table if not exists public.job_applications (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 job_title text not null check(length(job_title) between 3 and 180),
 organization text not null check(length(organization) between 2 and 180),
 source_url text not null check(source_url ~ '^https://[^[:space:]]+$'),
 status text not null default 'saved' check(status in ('saved','applied','assessment','interview','offer','rejected','withdrawn')),
 applied_on date,
 next_action_on date,
 notes text not null default '' check(length(notes)<=1000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists job_applications_owner_updated_idx on public.job_applications(user_id,updated_at desc);
alter table public.job_applications enable row level security;
revoke all on public.job_applications from anon,authenticated;
grant select,insert,update,delete on public.job_applications to authenticated;
create policy job_apps_owner_select on public.job_applications for select to authenticated using ((select auth.uid())=user_id);
create policy job_apps_owner_insert on public.job_applications for insert to authenticated with check ((select auth.uid())=user_id);
create policy job_apps_owner_update on public.job_applications for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy job_apps_owner_delete on public.job_applications for delete to authenticated using ((select auth.uid())=user_id);
