import test from 'node:test';
import assert from 'node:assert/strict';
import {greenhouseJobUrl,supabaseWriteHeaders} from '../scripts/job-sync-helpers.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
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

test('Daily job sync fails visibly instead of reporting success when source list is empty',()=>{
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 const result=spawnSync(process.execPath,['scripts/sync-greenhouse.mjs'],{
  cwd:root,env:{PATH:process.env.PATH,GREENHOUSE_BOARD_TOKENS:'',SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:''},encoding:'utf8'
 });
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/GREENHOUSE_BOARD_TOKENS/);
});
test('Expiry maintenance fails visibly instead of skipping missing credentials',()=>{
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
 const result=spawnSync(process.execPath,['scripts/expire-jobs.mjs'],{
  cwd:root,env:{PATH:process.env.PATH,SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',SUPABASE_SERVICE_ROLE_KEY:''},encoding:'utf8'
 });
 assert.notEqual(result.status,0);
 assert.match(result.stderr,/SUPABASE_URL/);
});
