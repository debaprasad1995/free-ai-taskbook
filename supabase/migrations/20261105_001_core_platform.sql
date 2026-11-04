-- FreeAITaskbook vNext foundation. Additive only; existing auth users and GitHub catalogs remain untouched.
-- Administrative authorization uses Supabase Auth app_metadata.role, never user_metadata.

create table if not exists public.resource_catalog (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('ai_tool','api','design','developer','learning','job_portal')),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check(length(title) between 2 and 180),
  summary text not null default '',
  category text not null,
  official_url text not null check (official_url ~ '^https://[^[:space:]]+$'),
  pricing_class text not null default 'unverified' check(pricing_class in ('free','free_tier','free_credits','open_source','paid','platform_included','unverified')),
  source_url text check(source_url is null or source_url ~ '^https://[^[:space:]]+$'),
  details jsonb not null default '{}'::jsonb,
  review_status text not null default 'draft' check(review_status in ('draft','review','published','archived')),
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resource_catalog_published_idx on public.resource_catalog(review_status,kind,category);

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  source_key text not null,
  external_id text not null,
  title text not null,
  organization text not null,
  region text,
  location text,
  employment_mode text,
  job_type text not null check(job_type in ('government','private','internship','remote','other')),
  official_notification_url text not null check(official_notification_url ~ '^https://[^[:space:]]+$'),
  application_url text check(application_url is null or application_url ~ '^https://[^[:space:]]+$'),
  qualifications text,
  salary_note text,
  vacancy_count integer check(vacancy_count is null or vacancy_count >= 0),
  posted_on date,
  application_deadline date,
  verified_at timestamptz,
  review_status text not null default 'pending' check(review_status in ('pending','verified','rejected')),
  status text not null default 'draft' check(status in ('draft','open','closed')),
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_key,external_id)
);
create index if not exists job_postings_public_idx on public.job_postings(status,review_status,application_deadline);
create index if not exists job_postings_location_idx on public.job_postings(location,job_type);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check(display_name is null or length(display_name) <= 120),
  preferred_roles text[] not null default '{}',
  preferred_locations text[] not null default '{}',
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_kind text not null check(item_kind in ('ai_tool','api','learning','job')),
  item_id text not null check(length(item_id) between 1 and 200),
  saved_at timestamptz not null default now(),
  primary key(user_id,item_kind,item_id)
);

create table if not exists public.community_submissions (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('ai_tool','api','course','job_portal','job','design','developer')),
  title text not null check(length(title) between 3 and 180),
  official_url text not null check(official_url ~ '^https://[^[:space:]]+$'),
  description text not null check(length(description) between 15 and 4000),
  status text not null default 'pending' check(status in ('pending','in_review','approved','rejected')),
  admin_notes text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists community_submissions_owner_idx on public.community_submissions(submitted_by,submitted_at desc);

create table if not exists public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  integration text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running' check(status in ('running','success','partial','failure')),
  fetched integer not null default 0,
  inserted integer not null default 0,
  rejected integer not null default 0,
  details jsonb not null default '{}'::jsonb
);

alter table public.resource_catalog enable row level security;
alter table public.job_postings enable row level security;
alter table public.user_profiles enable row level security;
alter table public.saved_items enable row level security;
alter table public.community_submissions enable row level security;
alter table public.sync_runs enable row level security;

-- Privilege grants are explicit. RLS filters each operation.
revoke all on public.resource_catalog,public.job_postings,public.user_profiles,public.saved_items,public.community_submissions,public.sync_runs from anon,authenticated;
grant select on public.resource_catalog,public.job_postings to anon,authenticated;
grant insert,update,delete on public.resource_catalog,public.job_postings to authenticated;
grant select,insert,update,delete on public.user_profiles,public.saved_items to authenticated;
grant select,insert,update on public.community_submissions to authenticated;
grant select,insert,update on public.sync_runs to authenticated;

create policy catalog_public_view on public.resource_catalog for select to anon,authenticated
 using(review_status='published');
create policy catalog_admin_view on public.resource_catalog for select to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy catalog_admin_insert on public.resource_catalog for insert to authenticated
 with check((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy catalog_admin_update on public.resource_catalog for update to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy catalog_admin_delete on public.resource_catalog for delete to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin');

create policy jobs_public_view on public.job_postings for select to anon,authenticated
 using(review_status='verified' and status='open' and verified_at is not null and (application_deadline is null or application_deadline>=current_date));
create policy jobs_admin_view on public.job_postings for select to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy jobs_admin_insert on public.job_postings for insert to authenticated
 with check((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy jobs_admin_update on public.job_postings for update to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy jobs_admin_delete on public.job_postings for delete to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin');

create policy profile_own_read on public.user_profiles for select to authenticated
 using((select auth.uid())=user_id);
create policy profile_own_insert on public.user_profiles for insert to authenticated
 with check((select auth.uid())=user_id);
create policy profile_own_update on public.user_profiles for update to authenticated
 using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy profile_own_delete on public.user_profiles for delete to authenticated
 using((select auth.uid())=user_id);

create policy saves_own_read on public.saved_items for select to authenticated
 using((select auth.uid())=user_id);
create policy saves_own_insert on public.saved_items for insert to authenticated
 with check((select auth.uid())=user_id);
create policy saves_own_delete on public.saved_items for delete to authenticated
 using((select auth.uid())=user_id);

create policy submissions_owner_read on public.community_submissions for select to authenticated
 using((select auth.uid())=submitted_by);
create policy submissions_admin_read on public.community_submissions for select to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy submissions_owner_insert on public.community_submissions for insert to authenticated
 with check((select auth.uid())=submitted_by and status='pending' and admin_notes is null and reviewed_at is null);
create policy submissions_admin_update on public.community_submissions for update to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin')
 with check((select auth.jwt()->'app_metadata'->>'role')='admin');

create policy sync_admin_read on public.sync_runs for select to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy sync_admin_insert on public.sync_runs for insert to authenticated
 with check((select auth.jwt()->'app_metadata'->>'role')='admin');
create policy sync_admin_update on public.sync_runs for update to authenticated
 using((select auth.jwt()->'app_metadata'->>'role')='admin') with check((select auth.jwt()->'app_metadata'->>'role')='admin');
