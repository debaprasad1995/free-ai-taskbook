import assert from 'node:assert/strict';
import fs from 'node:fs';
const t=JSON.parse(fs.readFileSync('data/tools.json','utf8'));
const c=JSON.parse(fs.readFileSync('data/categories.json','utf8'));
const a=JSON.parse(fs.readFileSync('data/affiliates.json','utf8'));
const cats=new Set(c.map(x=>x.slug));const slugs=new Set();
for(const x of t){
 assert.match(x.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
 assert.ok(!slugs.has(x.slug),`duplicate slug ${x.slug}`);slugs.add(x.slug);
 assert.ok(cats.has(x.category),`unknown category ${x.category}`);
 assert.ok(['free','free-tier','free-credits','local-open-source','free-software'].includes(x.access),`unexpected access ${x.access}`);
 assert.ok(x.name&&x.summary&&x.description&&x.freeNote);
 for(const field of ['url','pricingUrl']){assert.ok(x[field].startsWith('https://'));const u=new URL(x[field]);assert.ok(u.hostname.includes('.'),`invalid ${field} ${x.name}`);}
 if(x.verifiedOn){assert.match(x.verifiedOn,/^\d{4}-\d{2}-\d{2}$/);}
 assert.ok(Array.isArray(x.tasks)&&x.tasks.length>0,`missing tasks ${x.name}`);
}
for(const [slug,url] of Object.entries(a.links||{})){assert.ok(slugs.has(slug),`unknown affiliate slug ${slug}`);assert.ok(url.startsWith('https://'))}
console.log(`VALID: ${t.length} unique tool entries, ${c.length} categories, ${Object.keys(a.links||{}).length} affiliate links.`);
