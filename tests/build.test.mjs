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


test('homepage is compact while retaining the entire searchable catalog',()=>{
 const html=fs.readFileSync(path.join(out,'index.html'),'utf8');
 const script=fs.readFileSync(path.join(root,'src','app.js'),'utf8');
 assert.match(html,/id="show-more-tools"/);
 assert.match(html,/See more categories/);
 assert.equal((html.match(/data-tool /g)||[]).length,tools.length);
 assert.match(script,/visibleLimit=6/);
 assert.match(script,/visibleLimit\+=6/);
});
test('learning includes verified video IDs, a topic filter and click-to-play behavior',()=>{
 const courses=JSON.parse(fs.readFileSync(path.join(root,'data/youtube-courses.json'),'utf8'));
 const html=fs.readFileSync(path.join(out,'learn','index.html'),'utf8');
 const script=fs.readFileSync(path.join(root,'src','learning.js'),'utf8');
 assert.ok(courses.length>=6);
 assert.ok(courses.every(c=>/^[A-Za-z0-9_-]{11}$/.test(c.id)));
 assert.ok(courses.every(c=>html.includes('data-video-id="'+c.id+'"')));
 assert.match(html,/id="video-topic"/);assert.match(html,/id="video-player"/);
 assert.match(script,/youtube-nocookie.com/);
 assert.ok(fs.existsSync(path.join(out,'assets','learning.js')));
});


test('universal comparison has an explicit action, accessible panel and three-tool cap',()=>{
 const html=fs.readFileSync(path.join(out,'search','index.html'),'utf8');
 const script=fs.readFileSync(path.join(out,'assets','search.js'),'utf8');
 for(const id of ['compare-tray','compare-run','compare-clear','compare-names','tool-compare','search-more'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/aria-label="Selected AI tools"/);
 assert.match(script,/selection\.size<2/);
 assert.match(script,/selection\.size<3/);
 assert.match(script,/openCompare/);
 assert.match(script,/compare-table/);
 assert.match(script,/selection\.clear\(\)/);
});
test('beginner through advanced videos have real IDs and skill pathways',()=>{
 const courses=JSON.parse(fs.readFileSync(path.join(root,'data/youtube-courses.json'),'utf8'));
 const levels=new Set(courses.map(x=>x.level));
 for(const level of ['Beginner','Intermediate','Advanced'])assert.ok(levels.has(level),'missing '+level);
 assert.ok(courses.length>=15);
 assert.equal(new Set(courses.map(x=>x.id)).size,courses.length);
 const html=fs.readFileSync(path.join(out,'learn','index.html'),'utf8');
 for(const id of ['video-search','video-topic','video-level','video-more','video-count','learning-resources'])assert.ok(html.includes('id="'+id+'"'),id);
 const script=fs.readFileSync(path.join(out,'assets','learning.js'),'utf8');
 assert.match(script,/limit=6/);
 assert.match(script,/youtube-nocookie/);
 assert.match(script,/frame\.src=/);
});
test('core page navigation, metadata and internal page generation remain intact',()=>{
 const paths=['/','search','categories','professions','apis','learn','jobs','submit','resources','dashboard','admin','account','guides','privacy','terms','about','disclosure'];
 for(const page of paths){
  const file=path.join(out,page==='/'?'index.html':page+'/index.html');
  assert.ok(fs.existsSync(file),'missing '+page);
  const html=fs.readFileSync(file,'utf8');
  assert.match(html,/<main\b/,'missing main in '+page);
  assert.match(html,/<link rel="canonical"/,'missing canonical in '+page);
  assert.match(html,/<meta name="viewport"/,'missing viewport in '+page);
  assert.match(html,/href="\/search\/"/,'missing search navigation in '+page);
 }
});


test('every generated HTML page has valid local navigation destinations',()=>{
 const htmlFiles=[];
 const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())walk(full);else if(entry.name.endsWith('.html'))htmlFiles.push(full);
 }};
 walk(out);
 assert.ok(htmlFiles.length>=100,'unexpected page count');
 const missing=new Set();
 for(const file of htmlFiles){
  // Google Search Console ownership token is intentionally a plain text HTML-named file.
  if(/^google[a-z0-9]+\.html$/.test(path.basename(file)))continue;
  const html=fs.readFileSync(file,'utf8');
  assert.match(html,/<html\b/i,'missing document root in '+file);
  assert.match(html,/<title>[^<]+<\/title>/i,'missing page title in '+file);
  for(const match of html.matchAll(/\bhref="(\/[^"]*)"/g)){
   const href=match[1].split(/[?#]/)[0];
   if(!href||href==='/')continue;
   const candidate=path.join(out,href.replace(/^\/+/,'')); 
   const target=href.endsWith('/')?path.join(candidate,'index.html'):candidate;
   if(!fs.existsSync(target))missing.add(path.relative(out,file)+' → '+href);
  }
 }
 assert.deepEqual([...missing],[],[...missing].join('\n'));
});


test('account-enabled learning scripts, private course dashboard and task finder are generated',()=>{
 const build=fs.readFileSync(path.join(root,'scripts','build.mjs'),'utf8');
 const course=fs.readFileSync(path.join(out,'learn','index.html'),'utf8');
 const dashboard=fs.readFileSync(path.join(out,'dashboard','index.html'),'utf8');
 const admin=fs.readFileSync(path.join(out,'admin','index.html'),'utf8');
 const search=fs.readFileSync(path.join(out,'search','index.html'),'utf8');
 for(const id of ['learning-account-banner'])assert.match(course,new RegExp('id="'+id+'"'));
 for(const id of ['dashboard-course-progress','learning-analytics-consent','learning-analytics-save','learning-analytics-delete'])assert.match(dashboard,new RegExp('id="'+id+'"'));
 assert.match(admin,/id="admin-learning-insights"/);
 assert.match(search,/id="tool-finder-form"/);
 assert.match(search,/id="tool-finder-results"/);
 for(const asset of ['learning-account','learning-dashboard','tool-finder'])assert.ok(fs.existsSync(path.join(out,'assets',asset+'.js')),'missing '+asset);
 assert.match(build,/platform-config\.js/);
});
test('course analytics are opt-in, never measure watch duration, and keep admin data aggregate-only',()=>{
 const course=fs.readFileSync(path.join(root,'src','learning-account.js'),'utf8');
 const dashboard=fs.readFileSync(path.join(root,'src','learning-dashboard.js'),'utf8');
 const sql=fs.readFileSync(path.join(root,'supabase','migrations','20261106_001_course_progress_and_analytics.sql'),'utf8');
 assert.match(course,/share_learning_activity===true/);
 assert.match(course,/taskbook:course-started/);
 assert.match(dashboard,/course_progress/);
 assert.match(dashboard,/admin_learning_interest_report/);
 assert.match(dashboard,/course_activity_events/);
 assert.match(sql,/enable row level security/g);
 assert.match(sql,/security definer/);
 assert.match(sql,/revoke all on function public\.admin_learning_interest_report/);
 assert.match(sql,/preferences->>'share_learning_activity'='true'/);
 const privacy=fs.readFileSync(path.join(out,'privacy','index.html'),'utf8');
 assert.match(privacy,/opt in/);
});
test('tool finder is explicitly local and avoids third-party prompt transmission',()=>{
 const src=fs.readFileSync(path.join(root,'src','tool-finder.js'),'utf8');
 assert.match(src,/search-index\.json/);
 assert.match(src,/keyword/);
 assert.ok(!/api\.openai\.com|generativelanguage\.googleapis\.com|https:\/\/[a-z]+\.supabase\.co/.test(src));
});


test('account offers separate registration and returning-user login with a required name',()=>{
 const html=fs.readFileSync(path.join(out,'account','index.html'),'utf8');
 const script=fs.readFileSync(path.join(root,'src','auth.js'),'utf8');
 assert.match(html,/id="auth-mode-login"/);
 assert.match(html,/id="auth-mode-register"/);
 assert.match(html,/id="auth-name"/);
 assert.match(html,/id="auth-consent"/);
 assert.match(html,/id="auth-save-name"/);
 assert.match(script,/shouldCreateUser:creating/);
 assert.match(script,/full_name:fullName/);
 assert.match(script,/switchMode/);
 assert.match(script,/signInWithOtp/);
 assert.match(script,/db\.auth\.updateUser/);
});
test('About is an independent founder story and the original submission page is preserved',()=>{
 const about=fs.readFileSync(path.join(out,'about','index.html'),'utf8');
 const submit=fs.readFileSync(path.join(out,'submit','index.html'),'utf8');
 assert.match(about,/Debaprasad/);
 assert.match(about,/EduLocate/);
 assert.match(about,/FreeAITaskbook/);
 assert.match(about,/founder-portrait/);
 assert.match(about,/independent project/i);
 assert.match(submit,/id="suggest-form"/);
 assert.match(submit,/issues\/new\/choose/);
});
test('homepage immersive art has CSS-only motion with reduced-motion fallback and functional search',()=>{
 const home=fs.readFileSync(path.join(out,'index.html'),'utf8');
 const css=fs.readFileSync(path.join(out,'assets','styles.css'),'utf8');
 const app=fs.readFileSync(path.join(out,'assets','app.js'),'utf8');
 assert.match(home,/class="hero-art"/);
 assert.match(home,/id="hero-query"/);
 assert.match(css,/@keyframes taskbookOrbit/);
 assert.match(css,/@keyframes taskbookBreath/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(app,/visibleLimit=6;applyFilters\(\);search\.scrollIntoView/);
});
