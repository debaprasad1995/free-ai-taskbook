# FreeAITaskbook ✳

**Great ideas. Zero barriers.** A beautiful, task-first, SEO-ready directory of free and free-to-start AI tools.

[![Validate and build website](https://img.shields.io/badge/build-zero%20dependencies-c6fa61)](#run-locally) · [Free AI tools](#catalog) · [Deploy to Cloudflare](#deploy-to-cloudflare-pages) · [Contribute](CONTRIBUTING.md)

## What's included

- 51 starter listings, 12 categories, unique SEO pages per tool and category
- Client-side instant search, category/access filters, browser-only bookmarks
- Distinct labels for fully free, recurring free plan, limited credits, local/open-source and other free software
- Provider documentation links; **12 entries checked on 2026-11-04**, remaining entries visibly marked **independent review pending**
- Two original how-to guides, privacy/terms/affiliate disclosure, submission policy
- Static HTML, clean URLs, sitemap.xml, robots.txt, JSON-LD, canonical and social-sharing metadata
- GitHub issue and PR templates, CI build checks, MIT license, no JS tracking or API keys
- Optional affiliate link map — **empty by default** until partnerships are approved
- No paid services or third-party npm dependencies required

## Run locally

Install Node 20+ and run:

```bash
npm run check
npx --yes serve dist -l 4173
```

To avoid needing `npx` to preview, also works with `python3 -m http.server 4173 --directory dist`.

Open http://localhost:4173. `npm run check` validates the listings, builds the site and runs tests.

## Catalog

Edit `data/tools.json` to add more tools. Each record includes `slug`, `name`, `category`, `summary`, `description`, `access`, `url`, `pricingUrl`, `freeNote`, `verifiedOn`, `featured` and `tasks`. Use `verifiedOn: null` for entries awaiting a new official-source check.

**Do not assert every AI tool is fully free.** Provider plans can change without notice, regional availability varies, and local models require hardware. The visible UI separates verified and review-pending entries.

## Publish to GitHub (free)

1. Visit https://github.com/new while signed in.
2. Repository name: `free-ai-taskbook` (provided it is available). Choose **Public** and **do not initialize** with another README or .gitignore.
3. Extract the source ZIP on your computer, then in that folder run:

```bash
git init
git add .
git commit -m "Launch FreeAITaskbook directory"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/free-ai-taskbook.git
git push -u origin main
```

GitHub authentication may be required. Never paste GitHub passwords, personal access tokens, or API keys into chats or repository files.

You can alternatively upload the extracted files through GitHub's web interface; retain the `.github` directory and its workflow templates. This project ZIP includes source files, **not** the generated `dist` folder, because deployment builds it automatically.

## Deploy to Cloudflare Pages (free)

1. In Cloudflare dashboard open **Workers & Pages → Create → Pages → Connect to Git** (the exact menu wording may differ).
2. Connect your GitHub account and choose `free-ai-taskbook`.
3. Framework preset: **None**. Build command: `npm run build`. Output directory: `dist`. Root directory: `/`.
4. Add environment variables **for Production and Preview**:
   - `SITE_URL` = **your actual site hostname** such as `https://free-ai-taskbook.pages.dev` *only if it was assigned to you*. If Cloudflare gives another hostname, use that one instead.
   - `GITHUB_REPO_URL` = `https://github.com/YOUR_USERNAME/free-ai-taskbook` (your actual published repository).
5. Deploy. Open the issued site URL and verify search, navigation and tool detail pages.
6. In Google Search Console, verify your site and submit `https://YOUR-REAL-HOSTNAME/sitemap.xml`.

Cloudflare currently also supports Workers Builds, but this repository targets **Pages static-site hosting** for simple Git-connected deployment. No Firebase, Supabase, payment gateway or AI API is needed for this MVP.

### SEO checks before public launch

- The default canonical URL is an **assumption**, not a reserved domain. Update `SITE_URL` to match your real Cloudflare hostname to prevent incorrect canonical URLs and sitemap entries.
- Check robots.txt and sitemap.xml at the deployed hostname.
- Replace all remaining review-pending classifications after checking provider official pages.
- Add original tutorials and comparisons over time. SEO rankings are not guaranteed.
- Add a legally suitable privacy/terms contact channel and review local compliance before commercial operation.

## Monetization — built safely

`data/affiliates.json` starts with an empty `links` object. Apply directly to relevant affiliate programs. Once approved, map a tool slug to **your approved HTTPS link**, for example:

```json
{
  "_instructions": "Approved referral URLs only",
  "links": {
    "example-tool": "https://approved-affiliate-provider.example/referral"
  }
}
```

`example-tool` is a placeholder and will fail validation until replaced with a real listed tool slug.

The website will then show a visible affiliate disclosure and add `rel="sponsored nofollow"` to that link. Sponsorship placements, newsletter, analytics, and advertising are **not active** in this build — do not imply revenue is already being generated. Google AdSense generally requires a qualifying custom domain and approval, so consider it only after the site is established.

## Operating plan

- **Week 1:** Create repo and deploy, validate real URL, review 12 source-checked entries and ensure the 39 review-pending entries are accurate.
- **Weeks 2–4:** Add 3–5 original guides, make unique category pages genuinely helpful, add correction process.
- **Month 2:** Grow organic audience; apply to programs genuinely relevant to the audience.
- **Month 3:** Measure useful search queries and actual conversions before expanding sponsored offerings.

## Limits of this starter

It does **not** auto-scrape the entire AI market, guarantee 100% free products, take payments, send newsletters, operate a live recommendation model or provide an administration dashboard. These require separate architecture, legal/commercial configuration and possible future operational costs. All data changes are made via GitHub pull requests.

## License

MIT for original project source and data descriptions. Names and brands of listed AI services belong to their owners.

## Community submissions, API catalog and user accounts (v1.1)

- `/submit/` prepares a public GitHub issue. The visitor must submit it on GitHub (GitHub login is required). The acknowledgement bot posts a reply.
- The owner must verify official documentation and apply **`approved-for-publication`** to a valid submission. The `publish-approved` workflow then validates the JSON, checks the build, commits to `main`, and lets Cloudflare deploy. Approval is not automatic.
- `/apis/` provides a curated free-tier / paid API reference, including Shopify, WordPress and custom integrations. **There are no reusable private API keys**; each visitor gets their own credentials at the vendor.
- Weekly GitHub Actions audit runs Mondays and opens a review issue containing signals and unverified leads; no unattended scraping or automatic publication of unverified providers.
- `/account/` is disabled until a secure authentication provider is configured. All browsing works without an account.

### Optional Supabase Auth activation (account email-link login)

Create a Supabase project in your own account and review [Supabase security](https://supabase.com/docs/guides/getting-started/api-keys) first. Configure email Auth, redirect allowlist `https://free-ai-taskbook.pages.dev/account/`, branded sending limits and an account deletion/privacy support process. Add the following **build-time Cloudflare Pages variables** for production (do not commit secrets):

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
PRIVACY_CONTACT_EMAIL=privacy@YOUR_DOMAIN
```

Only a Supabase publishable client key is eligible for frontend use, protected by Supabase's access rules. **Never** put a `service_role`, `sb_secret_...`, or other private credential in Cloudflare's public static build. User emails are managed in the Supabase Auth dashboard; this version does not create a marketing database or track browsing activity. The `/account/` page is intentionally inert without all three settings.

### Publishing safeguards

The approval label is restricted to authorized repository collaborators. Publication validates listing categories, allowed access types, URL schemes, field lengths and duplicate slugs; builds and tests run before pushing. Review the source links carefully before approving. Scheduled discovery creates **review issues only**. `GITHUB_TOKEN`-authored commits may not trigger the usual GitHub Actions push CI; the publication workflow runs `npm run check` itself. Check Cloudflare deployment after each approved issue.
