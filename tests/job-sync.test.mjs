import test from 'node:test';
import assert from 'node:assert/strict';
import {greenhouseJobUrl,supabaseWriteHeaders} from '../scripts/job-sync-helpers.mjs';
test('Modern Supabase secret key never appears in a JWT Authorization header',()=>{
 const h=supabaseWriteHeaders('sb_secret_testing_placeholder');
 assert.equal(h.apikey,'sb_secret_testing_placeholder');
 assert.equal(h.Authorization,undefined);
});
test('Legacy service_role JWT remains backward compatible',()=>{
 const h=supabaseWriteHeaders('eyJtestingplaceholder');
 assert.equal(h.Authorization,'Bearer eyJtestingplaceholder');
});
test('Greenhouse API provider custom HTTPS job URLs are allowed but unsafe endpoints rejected',()=>{
 assert.equal(greenhouseJobUrl('https://jobs.example.com/openings/123'),'https://jobs.example.com/openings/123');
 assert.equal(greenhouseJobUrl('https://job-boards.greenhouse.io/sample/jobs/123'),'https://job-boards.greenhouse.io/sample/jobs/123');
 for(const x of ['http://jobs.example.com','https://localhost/job','https://127.0.0.1/job','https://user:password@jobs.example.com/','javascript:alert(1)','https://jobs.example.com:8443/'])assert.equal(greenhouseJobUrl(x),null,x);
});
