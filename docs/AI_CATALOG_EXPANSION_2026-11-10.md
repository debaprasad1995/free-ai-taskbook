# AI Catalog Expansion — November 10, 2026

## Scope and operational controls

The original public directory contained 61 curated AI tools across 12 categories. This change adds 24 independent official open-source projects (85 total) after verifying repository availability, active state and open-source license metadata from GitHub. It **does not** mean every project can be used without paying for models, compute, third-party APIs or hosted services.

## External discovery directories

The following are useful **discovery references**, not authorized source datasets to copy and republish without review or permission:

- https://topai.tools/ — large freemium/free/paid directory, with repeated providers and categories
- https://www.opentoolatlas.com/ — repository-focused open-source tool discovery
- https://tools.raisedigital.io/ — free and freemium tool listings
- https://www.curatedai.net/directory — editorial index including paid models and model variants

Catalog counts from these directories cannot be added together: products overlap, some entries are model variants, and many are not free.

## Weekly candidate discovery

`node scripts/discover-ai-candidates.mjs` searches public GitHub repository metadata and writes `tmp/ai-catalog-review.json` with candidate records marked `unverified`. The existing weekly GitHub Action uploads that review queue as an artifact. No candidate is automatically published or used as a pricing claim.

Before promotion to `data/tools.json`, review:
1. Official provider or canonical repository, current activity, and license conditions.
2. Whether a user gets a useful task for free; distinguish trials, subscriptions, free credits, open-source code, compute and BYOK expenses.
3. Canonical company/product duplicates, redirects, abandoned products, impersonators and malicious repositories.
4. Summary and description written independently; do not copy third-party directory text wholesale.
5. URL, pricing evidence or license link, category, tasks and date of verification.
6. `npm run check`, production build and spot-check of tool pages.

## Remaining work

The request to include every listing from all four directories is **not complete**. No authorized bulk export or permission for copying full listings was supplied, and unverified or paid products must not be described as free. The weekly discovery queue supports systematic progress toward a 200+ individually reviewed, deduplicated catalog without sacrificing the live directory's trustworthiness.
