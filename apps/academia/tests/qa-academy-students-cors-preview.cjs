'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const code=fs.readFileSync(path.resolve(__dirname,'../supabase/functions/academy-students/index.ts'),'utf8');
const match=code.match(/const allowed=\(origin:string\)=>([^\n]+);/);
assert.ok(match,'A função precisa declarar as origens permitidas');
const allowed=new Function('origin','return ('+match[1]+')');
const preview='https://contrem-git-release-aca-bcdaf7-vinicius-alves-projects-fdea38e8.vercel.app';
test('Preview da integração pode consultar alunos, preservando produção',()=>{
 for(const origin of [preview,'https://contrem.vercel.app','https://contrem-academia.vercel.app'])
  assert.equal(allowed(origin),true,origin);
});
test('Não permite variação de endereço nem wildcard de previews',()=>{
 for(const origin of [preview+'.invalid.example','https://qualquer-preview.vercel.app','http://contrem.vercel.app','https://evil.example'])
  assert.equal(allowed(origin),false,origin);
});
test('Preflight CORS passa sem autenticação; listagem real exige JWT e papel ADM',()=>{
 assert.match(code,/if\(origin&&!allowed\(origin\)\)return reply\(403/);
 assert.match(code,/if\(req\.method==='OPTIONS'\)return new Response\(null,\{status:204,headers\}\)/);
 assert.match(code,/headers\['Access-Control-Allow-Origin'\]=origin/);
 assert.match(code,/admin\.auth\.getUser\(token\)/);
 assert.match(code,/\.eq\('role','admin'\)/);
});
