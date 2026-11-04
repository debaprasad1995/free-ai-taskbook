# FreeAITaskbook — Zero-Cost Launch Checklist

**Project owner GitHub account:** `debaprasad1995` (confirmed through the connected account during preparation).

## Step A — Create your public GitHub repository

1. Open https://github.com/new in your signed-in browser.
2. Repository name: `free-ai-taskbook`.
3. Description: `Discover free AI tools for every task — compare real free plans, credits, and local alternatives.`
4. Visibility: **Public**.
5. Do not tick any options to initialize with README, licence, or .gitignore; these already exist in the source files.
6. Click **Create repository**.

Expected repository address after creation: `https://github.com/debaprasad1995/free-ai-taskbook`.

## Step B — Upload source code

Download `free-ai-taskbook-source.zip`, extract it on your computer, and open the extracted `free-ai-taskbook` folder in a terminal/PowerShell with Git installed.

```powershell
git init
git add .
git commit -m "Launch FreeAITaskbook directory"
git branch -M main
git remote add origin https://github.com/debaprasad1995/free-ai-taskbook.git
git push -u origin main
```

Sign in to GitHub via its official login flow if prompted. Do not paste an access token in this repository. The `.github` folder contains issue templates and a test workflow that runs automatically after pushing.

## Step C — Connect the same GitHub repo to Cloudflare Pages

1. Open https://dash.cloudflare.com/.
2. Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**. Menu wording may differ as Cloudflare changes the dashboard.
3. Authorize the GitHub integration and select `debaprasad1995/free-ai-taskbook`.
4. Use the following configuration:

| Setting | Value |
| --- | --- |
| Framework | None / No framework |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node runtime | 22, if configurable |

5. Choose the Pages project name `free-ai-taskbook` if available.
6. Add build-time environment variables:
   - `GITHUB_REPO_URL` = `https://github.com/debaprasad1995/free-ai-taskbook`
   - `SITE_URL` = the **actual** Pages URL assigned by Cloudflare, e.g. `https://free-ai-taskbook.pages.dev` only if this hostname is yours.
7. Deploy. If the assigned project hostname differs, update `SITE_URL` and redeploy; otherwise canonical tags and sitemap will reference the wrong host.

**Important:** This is a static website. It does not use or alter data from any of your other apps, GitHub repositories or Firebase projects.

## Step D — Submit to Google

1. Open https://search.google.com/search-console/.
2. Add your deployed hostname using the offered verification method.
3. Submit `https://YOUR_ACTUAL_HOSTNAME/sitemap.xml`.
4. Check the homepage and a tool page using the URL inspection tool.
5. Publish new, original category explanations and comparison articles over time. Search rankings are not guaranteed.

## Step E — Prepare earnings (not active by default)

1. Publish and review tool listings.
2. Apply directly to affiliate programs from relevant official vendors.
3. Only after you are approved, add the approved referral URL against the relevant tool slug in `data/affiliates.json` and push the update.
4. Check the visible disclosure page and link behavior. This site automatically labels configured affiliate links.
5. Consider a custom domain, an AdSense application, sponsored placements, or consulting only as the site gains traffic; adhere to tax and advertising disclosure rules.

## Optional: publish a preview before connecting GitHub

You can directly upload the pre-built **deploy ZIP** to an eligible Cloudflare Pages direct-upload project. This is separate from Git-connected deployment and is best for a quick preview; to keep automatic GitHub deployments as the primary workflow, follow Steps A–C.

## What is complete and what still needs you?

| Status | Work |
| --- | --- |
| Ready | Source code, page design, static search/filter/bookmarks, 73 indexable pages |
| Ready | Source URL links, sitemap, canonical logic, social preview, JSON-LD |
| Ready | Open-source workflow, GitHub Actions tests, contribution templates |
| Ready | Affiliate-link integration (no affiliate URLs installed yet) |
| Needs action | Create the public repository under your GitHub account |
| Needs action | Connect and authorize GitHub in your Cloudflare account |
| Needs action | Confirm actual public site URL and set environment variables |
| Needs action | Verify remaining free-tier details and pursue SEO / affiliate approvals |

**Do not share password, GitHub token, Firebase key, or Cloudflare API token to complete these steps.**
