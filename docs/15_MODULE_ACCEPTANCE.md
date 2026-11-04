# FreeAITaskbook — 15-Module Delivery Gates

Status reviewed: 2026-11-05. The source of truth is verified GitHub deployments, database policies, workflow logs and live browser tests.

| Module | Verified delivery position | Remaining production gate |
|---|---|---|
| 1 AI directory | 56 catalog entries and categories | Broader sourced coverage; official free-plan rechecks |
| 2 Universal search | Combined static search, comparisons | Live DB search, pagination and accessibility testing |
| 3 API directory | 18 curated listings | API examples, quota freshness and monitoring |
| 4 Jobs portal | Live verified-job feed + portal directory | Authorized employer and official government feed configurations |
| 5 Job sources | 19 source links | Expand nationally and verify link changes |
| 6 Job seeker dashboard | Private profile, saves, application tracker | Live account flow validation and alerts |
| 7 Learning hub | 12 categorized resources | More learning paths and evidence-backed certificate labels |
| 8 Tool discovery | Weekly audit workflow | Operator review and documented refresh coverage |
| 9 Community submissions | Public GitHub and signed-in private submissions | Full moderation-to-publication lifecycle tests |
| 10 Admin console | RLS-bound moderation and content creation | Trusted admin provisioning, audit log UI and live browser QA |
| 11 UI/UX | Responsive pages and sections | Screen reader, keyboard, contrast and mobile audit |
| 12 Architecture | Existing Cloudflare + GitHub + Supabase preserved | Staging, monitoring, recovery drills and secure key management |
| 13 SEO | Static canonical pages, XML sitemap | Dynamic database item URLs/sitemap and Google reporting |
| 14 Implementation | Incremental changes, CI checks | Complete operational integrations and QA |
| 15 Acceptance | Build/unit checks exist | Full cross-role production UAT and verified source freshness |

## Non-negotiable launch gates
1. No fabricated vacancy; only official or explicitly approved feed sources.
2. Keep publication review and RLS; never place service-role credentials in browser bundles or public Git.
3. Users must expressly opt in before receiving alerts or marketing communications.
4. Back up critical data before changing existing tables, then run cross-user and public/anon RLS tests.
5. Site keeps working without enabled job sync or optional services. Do not label unconfigured sources as active.
6. Do not count successful GitHub CI as proof of end-to-end authentication or Cloudflare UX.
