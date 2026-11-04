import test from 'node:test';import assert from 'node:assert/strict';
import {onRequestGet as catalog} from '../functions/catalog/[slug].js';
import {onRequestGet as vacancy} from '../functions/vacancies/[id].js';
import {onRequestGet as sitemap} from '../functions/live-sitemap.xml.js';
const env={SUPABASE_URL:'https://example-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_Test123',SITE_URL:'https://free-ai-taskbook.pages.dev'};
const request={url:'https://free-ai-taskbook.pages.dev/live-sitemap.xml'};
const id='b39f6a00-8c34-4537-a330-a982d537780e';
test('catalog page serves published row with escaped content and canonical',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 globalThis.fetch=async()=>new Response(JSON.stringify([{slug:'tested-tool',title:'Test <Safe>',kind:'ai_tool',category:'test',summary:'Test summary',official_url:'https://example.com',pricing_class:'free',source_url:'https://example.com/pricing'}]),{status:200});
 const r=await catalog({request,env,params:{slug:'tested-tool'}});assert.equal(r.status,200);const html=await r.text();assert.match(html,/Test &lt;Safe&gt;/);assert.match(html,/rel="canonical"/);assert.doesNotMatch(html,/<h1>Test <Safe>/);
});
test('vacancy slug rejects untrusted identifiers',async()=>{const r=await vacancy({request,env,params:{id:'../../secrets'}});assert.equal(r.status,404)});
test('vacancy page does not fabricate missing salary or posting date',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 globalThis.fetch=async()=>new Response(JSON.stringify([{id,title:'Engineer',organization:'Example Employer',official_notification_url:'https://example.com/jobs',job_type:'private',verified_at:'2026-11-05T00:00:00Z'}]));
 const r=await vacancy({request,env,params:{id}});assert.equal(r.status,200);const s=await r.text();assert.doesNotMatch(s,/"@type":"JobPosting"/);assert.doesNotMatch(s,/<dt>Salary<\/dt>/);
});
test('live sitemap lists only returned published records and non-expired jobs',async t=>{
 const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);
 globalThis.fetch=async url=>new Response(JSON.stringify(String(url).includes('resource_catalog')?[{slug:'tested-tool',updated_at:'2026-11-05T00:00:00Z'}]:[{id,updated_at:'2026-11-05T00:00:00Z',application_deadline:'2099-01-01'}]));
 const r=await sitemap({request,env});assert.equal(r.status,200);const s=await r.text();assert.match(s,/\/catalog\/tested-tool/);assert.match(s,new RegExp('/vacancies/'+id));assert.match(r.headers.get('content-type'),/xml/);
});
test('database unavailable never returns invented catalog data',async t=>{const original=globalThis.fetch;t.after(()=>globalThis.fetch=original);globalThis.fetch=async()=>new Response('{}',{status:500});const r=await catalog({request,env,params:{slug:'missing'}});assert.equal(r.status,503)});
