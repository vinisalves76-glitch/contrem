'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../supabase/functions/academy-workspace/index.ts'),'utf8');
const expression=source.match(/const permittedOrigin=\(origin:string\)=>([^\n]+);/);
assert.ok(expression,'Origin checker must exist');
const permittedOrigin=new Function('origin','return ('+expression[1]+')');
const preview='https://contrem-git-release-aca-bcdaf7-vinicius-alves-projects-fdea38e8.vercel.app';
test('Permitir produção, Academia histórica e SOMENTE a preview aprovada',()=>{
 for(const origin of ['https://contrem.vercel.app','https://contrem-academia.vercel.app',preview,'http://localhost:3000','http://127.0.0.1:5173'])
  assert.equal(permittedOrigin(origin),true,origin);
});
test('Rejeitar domínios aleatórios, parecidos ou subdomínios não autorizados',()=>{
 for(const origin of ['https://contrem-git-feature-aca-7c1631-vinicius-alves-projects-fdea38e8.vercel.app',preview+'.evil.example',
 'https://evil.example','https://contrem.vercel.app.evil.example','http://contrem.vercel.app','https://contrem-git-release-aca-bcdaf7-vinicius-alves-projects-fdea38e8.vercel.app:443'])
  assert.equal(permittedOrigin(origin),false,origin);
});
test('OPTIONS permanece sem corpo e exige origin permitido antes de autenticar',()=>{
 assert.match(source,/if\(origin&&!permittedOrigin\(origin\)\)return reply\(403/);
 assert.match(source,/if\(req\.method==='OPTIONS'\)return new Response\(null,\{status:204,headers\}\)/);
 assert.match(source,/headers\['Access-Control-Allow-Origin'\]=origin/);
 assert.match(source,/if\(req\.method!=='POST'\)return reply\(405/);
 assert.match(source,/if\(!token\)return reply\(401/);
});
