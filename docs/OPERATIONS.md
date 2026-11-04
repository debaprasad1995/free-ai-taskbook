# FreeAITaskbook Operations and Release Gates

## What is currently functional

- Curated static AI/API/professional, job-source and learning directories.
- Search across existing resources and side-by-side AI tool comparisons.
- Anonymous read-only public database resource feed and independently verified job feed.
- Optional passwordless login, if all three build-time variables are set and Supabase Auth redirect URLs match.
- Signed-in personal profiles, saved entries and private moderation submissions (Supabase RLS).
- Admin-only moderation queue and verified resource/job publication. Requires a real account provisioned with `app_metadata.role = "admin"` by a trusted backend administrator.
- Scheduled job ingestion code is present but intentionally inert until approved source IDs and GitHub server secrets are configured.

## Security prerequisites before public account onboarding

1. Complete a real magic-link sign-in using a test account (no passwords or tokens in public issues).
2. In Supabase **Authentication → URL Configuration**, set production Site URL and `/account/` redirect URL.
3. Verify `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `PRIVACY_CONTACT_EMAIL` in Cloudflare Pages **Production** build variables, then redeploy.
4. Review privacy notice, retention policy and deletion-request process. No marketing opt-in is assumed.
5. Assign administrator privileges only after verifying the account belongs to the site operator, using a trusted Supabase admin session. **Never** promote a user based on client-submitted metadata, an email alone, or a front-end checkbox.
6. Test RLS as anon, normal user and administrator, including attempted cross-user reads, writes, moderation and deletion.

## Daily verified-job ingestion (not active by default)

GitHub Actions has a daily scheduled run (02:30 UTC, nominally 08:00 Asia/Kolkata). Configure **Settings → Secrets and variables → Actions**:

- **Repository variable** `GREENHOUSE_BOARD_TOKENS`: comma-separated, explicitly approved employer Greenhouse job-board IDs. Check each employer's official careers page before adding it. Never use guessed board identifiers.
- **Repository secret** `SUPABASE_URL`: exact Supabase project URL.
- **Repository secret** `SUPABASE_SERVICE_ROLE_KEY`: server-only secret key from your Supabase project. This bypasses RLS and must **never** be put in Cloudflare's public JavaScript, your repository, or a chat transcript.

The worker calls the Greenhouse *public GET Job Board API*, checks HTTPS official job-board links, upserts source-attributed jobs and logs each run. Jobs missing from a fully successful board fetch can be closed. The worker does not claim missing salaries, expiration dates, qualification or category eligibility. An upstream failure prevents the missing-job closure process. Until an approved board and secrets exist, it **skips** rather than publishing fabricated jobs. No government websites, LinkedIn, Naukri, or prohibited feeds are scraped.

## Publishing and SEO

- All database `published` resource entries are visible without a GitHub commit at `/resources/`.
- Approved vacancies appear on `/jobs/`; empty feeds remain empty instead of showing old mock data.
- Existing static detail pages are still deployed through GitHub. For **new dynamic SEO detail pages**, an authenticated server-side rendering or periodically regenerated sitemap system is a later phase; database entries alone do not produce their own static HTML detail page.
- Cloudflare Pages remains connected to GitHub `main`; every merged change should pass `npm run check`.

## Incomplete scope

Government official feed integrations, all-India job aggregations, reliable user alerts, user review moderation, production email delivery, bulk admin editing, per-vacancy SEO routes, live API health probes, analytics opt-in, and end-to-end browser security testing are not delivered by this increment. Implement against legitimate sources and monitor cost/rate limits before launch.
