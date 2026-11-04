# FreeAITaskbook — Product implementation roadmap

**Reviewed:** 2026-11-05  
**Main environment:** `free-ai-taskbook.pages.dev` + GitHub Pages integration + Supabase (Mumbai).

## Product principles

- Preserve all existing routes, Google site verification, published resources, bookmarks and GitHub review workflows.
- No fabricated job postings, free-plan pricing, certifications, user testimonials or claims of automatic synchronization.
- Every published job must link to an authoritative source, include its verification timestamp, and pass publication rules.
- Use `public` read-only access for approved resources; keep submissions, profile information, draft vacancies and synchronization details private by default.
- Never expose account-specific API keys or admin secrets. Supabase publishable key is public by design; backend/service role credentials must not be committed.
- Protect users' privacy and provide account deletion and consent workflows before collecting additional profile details.

## Audited baseline

| Component | Finding |
| --- | --- |
| Build stack | Node.js static HTML generator (`scripts/build.mjs`), CSS and browser JavaScript; not React/TypeScript |
| Host and CI | Existing GitHub `main` → Cloudflare Pages; must keep this connection |
| AI catalog | 51 listings in 12 categories, 18 API listings |
| Supabase | Existing Auth project, previously no `public` application tables |
| Community submissions | GitHub issues, explicit maintainer approval, build-triggered publication |
| Jobs | No authorized live job feed integrated yet |
| Auth | Supabase account UI and magic-link code, live sign-in still needs end-to-end browser testing |

## Delivered in the first additive increment

- Four profession-specific workflows, linking to the existing official-tool pages.
- Indexed `/professions/`, `/jobs/`, `/jobs/sources/` and `/learn/` pages.
- 19 candidate recruitment portal links with no fabricated vacancy dates or postings.
- 12 learning resources, with clear certificate-access classification.
- A job vacancies section wired to the actual Supabase `job_postings` Data API when public auth configuration is available. No verified vacancies are inserted by default; an empty state is truthful.
- Supabase relational schema and Row Level Security for `resource_catalog`, `job_postings`, `user_profiles`, `saved_items`, `community_submissions` and `sync_runs`. Existing Supabase Auth tables and records remain unchanged.
- Core validation, link/slug checks and automated site generation tests.

## Subsequent increments (not delivered yet)

1. **Resource expansion** — verified BA/design/stitch/website/mobile tools, structured per-tool use cases, accessible comparison views, and admin-managed resource migration (without duplicates).
2. **Approved job feeds** — integrate only official APIs, RSS, permitted public feeds or authorized notices with documented provenance. Add immutable source IDs, deduplication keys, timestamp reconciliation, expiry, failure logs and retry/backoff.
3. **Daily job updates** — run a scheduled reconciliation at an explicitly documented UTC time equivalent to a chosen India Standard Time; only verified records publish. Third-party portals without authorization remain source links.
4. **User account dashboard** — test OTP email delivery and Supabase redirects; implement saved resources, saved jobs, preferred roles/locations, application tracking, privacy requests and per-user RLS tests.
5. **Community moderation** — replace public-only GitHub issue submissions with authenticated Supabase submissions, isolated admin-only moderation and direct database publication; preserve issue contribution path as an option.
6. **Admin console** — authenticate and verify admin role from server-issued `app_metadata`; no self-assigned roles, no admin service keys in browser code. Introduce source health, audit logs, error inspection and reporting.
7. **Search and SEO** — database search with pagination, source-aware tool pages, accurate canonical URLs, `JobPosting` markup **only** for genuine published vacancies and an automated sitemap publishing workflow.
8. **Production quality** — E2E mobile, keyboard and security testing; backups, recovery tests, monitoring, privacy, performance and quota management.

## Release gates

- CI `npm run check` is green and Cloudflare indicates the latest commit has deployed successfully.
- Open homepage, search, tool detail, API, all new pages, legal links, Google verification URL, and sitemap.
- Confirm `SELECT` from public resource/job tables does not return drafts or expired jobs; confirm row-level profile isolation using separate test accounts before activating user write functionality.
- Confirm signup, login, logout, email redirect and deletion request channels before claiming user registration is production-ready.
- Never claim live vacancy discovery or scheduled sync without a successful end-to-end integration test and source authorization.

## Known considerations

- `Supabase` security advisor warns that leaked-password protection is disabled. Review at https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection (passwordless sign-in planned).
- User accounts do not automatically grant site administrator privileges. Admin elevation must be carried out in a trusted administrative backend.
- Google search indexing is independent of successful deployment. Site verification and sitemap submission do not guarantee rankings.
