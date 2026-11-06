# FreeAITaskbook — release QA evidence (2026-11-06)

Scope: course progress, saved resources, mobile-responsive UI, and administrator publishing.

## Source-backed checks

| Area | Evidence checked | Outcome |
|---|---|---|
| Administrator identity | `src/platform.js` checks server-issued `app_metadata.role === 'admin'`; live RLS policies restrict admin inserts/updates | Pass, design/policy review |
| Community moderation | Pending queue, review/reject buttons, owner/admin RLS | Pass, code/policy review; no live submission was created |
| Resource publication | HTTPS source URL/slug validation, unique catalog slug, published-only public SELECT RLS | Pass, code/schema review; no live publication was created |
| Vacancy publication | HTTPS official URL, unique (source_key, external_id), verified/open public RLS | Pass, code/schema review; no synthetic job was published |
| Course progress | Per-user read/update/delete policies and `ON CONFLICT DO NOTHING` video-start insert, saved → learning-only transition | Pass, code/policy review; actual completed-status persistence still requires a controlled authenticated browser scenario |
| Saved resources | Previously tool stars were localStorage-only while account dashboard queried `saved_items`. This PR adds owner-scoped Supabase reads/writes for signed-in tools and preserves guest local favorites | Fixed in code; production authenticated interaction requires smoke test |
| Mobile | CSS breakpoints and menu/admin grid stacking at ≤600px | Pass, static responsive CSS review; visual device testing remains pending |
| Live job sync | Five recent successful rows in `sync_runs` and 561 jobs in `job_postings`; no duplicate (source_key, external_id) groups found | Pass, read-only production database verification |
| Live account resources | 0 saved_items and 0 course_progress at audit time | No existing data available for before/after persistence test |
| Actual interactive browser runs | Browser connection in this chat is read-only, and this environment cannot reach the Cloudflare host by DNS | **Not executed**; cannot call this full end-to-end QA |

## Controlled release smoke tests remaining

1. Desktop 1440px and mobile 375px: search, toggle saved tool, refresh, sign out and sign back in. Confirm the bookmark remains on the account, and another account cannot see it.
2. Guest mode: favorite a tool, reload same browser, confirm local persistence; verify this guest state is not automatically imported to a different signed-in account.
3. Learning: save a course, play it, set Completed in dashboard, refresh, play it again, confirm Completed remains. Remove the course and confirm removal.
4. Admin resource: use a real authorized resource in a controlled test; verify published record and public page then archive via approved moderation procedure. Do **not** publish synthetic external resources in production.
5. Admin vacancy: verify a genuine official vacancy, publish once, retry same (source_key, external_id) and confirm one record. Verify public listing, then close it through the normal admin lifecycle.
6. Non-admin: confirm /admin content remains hidden and RLS rejects publishing operations.
7. Test mobile header, account menu, forms and video player on Chrome Android, Safari iOS and 320–390px widths.
8. Test YouTube iframe playback, CSP, and Cloudflare Functions with real HTTPS responses.

**Release classification:** Automated build and code/policy checks can pass; full production E2E cannot be certified without browser interaction on test accounts. Never insert fabricated vacancies or alter real users' progress to satisfy QA.
