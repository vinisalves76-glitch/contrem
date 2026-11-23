'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'../supabase/functions');
const alias='https://contrem-git-fix-academi-3f153d-vinicius-alves-projects-fdea38e8.vercel.app';
const stable='https://contrem.vercel.app';
const old='https://contrem-git-release-aca-bcdaf7-vinicius-alves-projects-fdea38e8.vercel.app';
const untrusted='https://contrem-git-fix-academi-3f153d-evil.vercel.app';
function source(service){return fs.readFileSync(path.join(base,service,'index.ts'),'utf8')}
function allowed(service){
 const code=source(service),key=service==='academy-students'?'allowed':'permittedOrigin';
 const match=code.match(new RegExp('const '+key+'=\\(origin:string\\)=>([\\s\\S]*?);\\n'));
 assert.ok(match,'origin policy found for '+service);
 return new Function('preview','return (origin)=>'+match[1]+';')(old);
}
for(const service of ['academy-workspace','academy-programs','academy-students']){
 test(service+' permite preview oficial, produção e preview anterior',()=>{
  const origin=allowed(service);
  assert.equal(origin(alias),true,service+' must accept current preview');
  assert.equal(origin(stable),true,service+' must preserve production');
  assert.equal(origin(old),true,service+' must preserve prior preview');
  assert.equal(origin(untrusted),false,service+' must reject untrusted domains');
  assert.equal(origin('https://other.vercel.app'),false,service+' must not use wildcard');
  assert.equal(origin(alias+'.evil.example'),false,'must reject suffix spoofing');
  assert.match(source(service),/if\(origin&&!/);
  assert.match(source(service),/if\(req\.method==='OPTIONS'\)return new Response\(null,\{status:204,headers\}\)/);
 });
}
test('Origin fix does not bypass JWT, membership, or Master-only access',()=>{
 const workspace=source('academy-workspace'),programs=source('academy-programs'),students=source('academy-students');
 assert.match(workspace,/db\.auth\.getUser\(token\)/);
 assert.match(workspace,/if\(!editor\)return reply\(403/);
 assert.match(programs,/db\.auth\.getUser\(token\)/);
 assert.match(programs,/if\(!master\)return reply\(403/);
 assert.match(students,/admin\.auth\.getUser\(token\)/);
 assert.match(students,/\.eq\('active',true\)\.eq\('role','admin'\)/);
});
