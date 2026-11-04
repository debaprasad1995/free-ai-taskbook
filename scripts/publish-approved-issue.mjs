import fs from 'node:fs';
import assert from 'node:assert/strict';
// Executed ONLY after a repository maintainer applies the approved-for-publication label.
// No shell evaluation or remote code execution of issue contents.
const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH||'tests/fixtures/approved-issue.json','utf8'));
const issue=event.issue||{};
assert.ok((issue.labels||[]).some(l=>l.name==='approved-for-publication'),'No maintainer approval label present');
const body=issue.body||'';
const match=(name)=>{
 const prefix='### '+name+'\n';
 const start=body.indexOf(prefix);
 if(start===-1)return '';
 return body.slice(start+prefix.length).split(/\r?\n### /)[0].trim();
};
const required=name=>{const v=match(name);assert.ok(v&&v!=='_No response_',`Missing ${name}`);assert.ok(v.length<=1200,`Oversized ${name}`);return v;};
const kind=required('Listing type'), name=required('Tool / API name'), website=required('Official website'), pricing=required('Official pricing, license or free-plan source');
const category=required('Category'), access=required('Access'), description=required('Description / tasks'), limits=required('Free plan / pricing limitations');
assert.match(name,/^[\p{L}\p{N}][\p{L}\p{N} .+&():'-]{1,79}$/u);
assert.ok(!/[<>]/.test(description+limits+name),'HTML elements not allowed');
assert.ok(!/(?:sk-[A-Za-z0-9]{16,}|sb_secret_|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{20,}|xox[baprs]-|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----)/.test(body),'Potential API key or private credential detected');
for(const v of [description,limits])assert.ok(v.length>=12&&v.length<=800,'Description / limits must be 12-800 characters');
for(const url of [website,pricing]){const u=new URL(url);assert.equal(u.protocol,'https:');assert.ok(u.hostname.includes('.')&&!u.username&&!u.password&&!url.includes('@'));assert.ok(!/(?:^|\.)localhost$/.test(u.hostname));}
const slug=name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65).replace(/-$/,'');
assert.match(slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
if(kind==='Tool'){
 const categories=JSON.parse(fs.readFileSync('data/categories.json','utf8'));
 assert.ok(categories.some(c=>c.slug===category),'Unknown tool category');
 assert.ok(['free','free-tier','free-credits','local-open-source','free-software'].includes(access),'Paid services should be listed as APIs, not free AI tools');
 const f='data/tools.json';const rows=JSON.parse(fs.readFileSync(f,'utf8'));
 if(rows.some(r=>r.slug===slug)){console.log('Already published:',slug);process.exit(0);}
 rows.push({slug,name,category,summary:description.slice(0,145),description,access,url:website,pricingUrl:pricing,freeNote:limits,verifiedOn:null,featured:false,tasks:description.toLowerCase().split(/[,;.]+/).map(s=>s.trim()).filter(Boolean).slice(0,5)});
 fs.writeFileSync(f,JSON.stringify(rows,null,2)+'\n');
}else if(kind==='API'){
 const catSet=new Set(['AI','Commerce','Websites','Email','Maps','Database','Payments','Media','Developer']);
 assert.ok(catSet.has(category),'Unknown API category');
 assert.ok(['free-tier','free-credits','paid','platform-included','self-hosted'].includes(access),'Unknown API access type');
 const f='data/apis.json';const rows=JSON.parse(fs.readFileSync(f,'utf8'));
 if(rows.some(r=>r.slug===slug)){console.log('Already published:',slug);process.exit(0);}
 const platforms=match('API Platforms').split(',').map(x=>x.trim()).filter(x=>['shopify','wordpress','custom'].includes(x));
 assert.ok(platforms.length,'Missing approved API integration paths');
 rows.push({slug,name,category,access,platforms,description,docsUrl:website,pricingUrl:pricing,keyInstructions:'Create or authorize credentials in your own account following the provider documentation. Never share private keys.',limitations:limits,verifiedOn:null});
 fs.writeFileSync(f,JSON.stringify(rows,null,2)+'\n');
}else{throw Error('Unsupported listing type');}
console.log(`Added ${kind}: ${slug} (awaiting independent verification label)`);
