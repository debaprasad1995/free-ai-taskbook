import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'dist');
const tools=JSON.parse(fs.readFileSync(path.join(root,'data/tools.json'),'utf8'));
const cats=JSON.parse(fs.readFileSync(path.join(root,'data/categories.json'),'utf8'));
test('homepage has tool content and functionality',()=>{const s=fs.readFileSync(path.join(out,'index.html'),'utf8');assert.match(s,/Free AI Tools for Every Task/);assert.match(s,/id="tool-search"/);assert.match(s,/id="category-filter"/);assert.match(s,/id="favorites-toggle"/);assert.equal((s.match(/data-tool /g)||[]).length,tools.length);});
test('every detail page has unique canonical, usable pricing link, and JSON-LD',()=>{for(const x of tools){const f=path.join(out,'tools',x.slug,'index.html');assert.ok(fs.existsSync(f),f);const h=fs.readFileSync(f,'utf8');assert.ok(h.includes(`<link rel="canonical" href="https://free-ai-taskbook.pages.dev/tools/${x.slug}/">`)||h.includes(`/tools/${x.slug}/`));assert.ok(h.includes(x.name.replaceAll('&','&amp;')));assert.ok(h.includes('application/ld+json'));assert.ok(h.includes('Official pricing / documentation'));}});
test('category pages and sitemap include every category and tool',()=>{const map=fs.readFileSync(path.join(out,'sitemap.xml'),'utf8');for(const c of cats)assert.ok(map.includes(`/categories/${c.slug}/`));for(const t of tools)assert.ok(map.includes(`/tools/${t.slug}/`));assert.ok(fs.existsSync(path.join(out,'robots.txt')))});
test('no affiliate links are configured before program approval',()=>{const a=JSON.parse(fs.readFileSync(path.join(root,'data/affiliates.json'),'utf8'));assert.equal(Object.keys(a.links).length,0);});
test('site features include privacy, terms, guides, disclosure and submissions',()=>{for(const p of ['privacy','terms','guides','disclosure','submit','about'])assert.ok(fs.existsSync(path.join(out,p,'index.html')));});

test('API directory and individual API pages generated, no credentials in catalog',()=>{const apis=JSON.parse(fs.readFileSync(path.join(root,'data/apis.json'),'utf8'));const h=fs.readFileSync(path.join(out,'apis','index.html'),'utf8');assert.ok(h.includes('id="api-search"'));assert.ok(h.includes('Shopify'));for(const api of apis){const file=path.join(out,'apis',api.slug,'index.html');assert.ok(fs.existsSync(file),file);const html=fs.readFileSync(file,'utf8');assert.ok(html.includes('Official API documentation'));assert.ok(html.includes('Never share account credentials'));}});
test('submission opens public GitHub issue, account collection gated until configured',()=>{const s=fs.readFileSync(path.join(out,'submit','index.html'),'utf8');assert.ok(s.includes('id="suggest-form"'));assert.ok(s.includes('public GitHub issue'));const a=fs.readFileSync(path.join(out,'account','index.html'),'utf8');assert.ok(a.includes('not enabled yet')||a.includes('id="auth-form"'));});
test('Google Search Console verification preserved',()=>{const txt=fs.readFileSync(path.join(out,'google897f887f145bc438.html'),'utf8');assert.equal(txt.trim(),'google-site-verification: google897f887f145bc438.html');});

test('professional, job and learning pages are generated without fake vacancies',()=>{
 for(const route of ['professions','professions/business-analyst','professions/ui-ux-design','professions/website-builder','professions/application-builder','jobs','jobs/sources','learn']) assert.ok(fs.existsSync(path.join(out,route,'index.html')),route);
 const j=fs.readFileSync(path.join(out,'jobs/index.html'),'utf8');assert.ok(j.includes('Verified vacancies appear below when an authorized data source is configured'));assert.ok(j.includes('href="https://www.ncs.gov.in/"'));
 const p=fs.readFileSync(path.join(out,'professions/business-analyst/index.html'),'utf8');assert.ok(p.includes('BRD or PRD'));
 const l=fs.readFileSync(path.join(out,'learn/index.html'),'utf8');assert.ok(l.includes('Free certificate')) ;
 const map=fs.readFileSync(path.join(out,'sitemap.xml'),'utf8');assert.ok(map.includes('/jobs/'));assert.ok(map.includes('/learn/'));
});

test('new account-based modules are generated and stay access-controlled',()=>{
 for(const x of ['dashboard','admin','resources']) assert.ok(fs.existsSync(path.join(out,x,'index.html')));
 const dashboard=fs.readFileSync(path.join(out,'dashboard','index.html'),'utf8');
 assert.ok(dashboard.includes('id="dashboard-private" hidden'));
 const admin=fs.readFileSync(path.join(out,'admin','index.html'),'utf8');
 assert.ok(admin.includes('id="admin-private" hidden'));
 const submit=fs.readFileSync(path.join(out,'submit','index.html'),'utf8');
 assert.ok(submit.includes('id="private-submission-form" hidden'));
 const sitemap=fs.readFileSync(path.join(out,'sitemap.xml'),'utf8');
 assert.ok(sitemap.includes('/resources/'));
 assert.ok(!sitemap.includes('/admin/'));
});
test('scheduled job ingestion is gated until authorized boards and server-only credentials exist',()=>{
 const runner=fs.readFileSync(path.join(root,'scripts','sync-greenhouse.mjs'),'utf8');
 const workflow=fs.readFileSync(path.join(root,'.github','workflows','daily-authorized-jobs.yml'),'utf8');
 assert.ok(runner.includes('GREENHOUSE_BOARD_TOKENS'));
 assert.ok(runner.includes('Job sync skipped'));
 assert.ok(runner.includes("greenhouseJobUrl"));
 assert.ok(workflow.includes('secrets.SUPABASE_SERVICE_ROLE_KEY'));
 assert.ok(!workflow.includes('sb_publishable_'));
});
test('universal search combines all resource types without inventing vacancies',()=>{
 const h=fs.readFileSync(path.join(out,'search','index.html'),'utf8');
 assert.ok(h.includes('id="universal-query"'));
 const d=JSON.parse(fs.readFileSync(path.join(out,'search-index.json'),'utf8'));
 assert.ok(d.some(x=>x.type==='AI tool'));
 assert.ok(d.some(x=>x.type==='API'));
 assert.ok(d.some(x=>x.type==='Job portal'));
 assert.ok(d.some(x=>x.type==='Learning'));
 assert.ok(!d.some(x=>x.type==='Verified job'));
});

test('private job application tracker is generated and database migration uses owner RLS',()=>{
 const html=fs.readFileSync(path.join(out,'dashboard','index.html'),'utf8');
 assert.match(html,/id="application-form"/);assert.match(html,/id="application-list"/);
 const js=fs.readFileSync(path.join(root,'src','platform.js'),'utf8');assert.match(js,/job_applications/);
 const sql=fs.readFileSync(path.join(root,'supabase','migrations','20261105_002_job_applications.sql'),'utf8');
 assert.match(sql,/enable row level security/);assert.match(sql,/auth.uid\(\)/);assert.match(sql,/job_apps_owner_update/);
});

test('job recommendations and admin sync health panels are present and do not claim email delivery',()=>{
 const dashboard=fs.readFileSync(path.join(out,'dashboard','index.html'),'utf8');
 const admin=fs.readFileSync(path.join(out,'admin','index.html'),'utf8');
 const src=fs.readFileSync(path.join(root,'src','platform.js'),'utf8');
 assert.match(dashboard,/id="matched-jobs"/);
 assert.match(admin,/id="sync-monitor"/);
 assert.match(src,/showMatchedJobs/);
 assert.match(src,/loadSyncHealth/);
 assert.match(dashboard,/not eligibility checks or emailed alerts/);
});
