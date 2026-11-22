// Exercise the actual Deno handler with SDK/env replaced; no external credentials or requests.
import {test as nodeTest} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as nodeModule from 'node:module';
import vm from 'node:vm';
const ts=readFileSync(new URL('../server/students/index.ts',import.meta.url),'utf8').replace(/^import[^\n]+\n/,'');
const js=nodeModule.stripTypeScriptTypes?.(ts);
const test=(name,fn)=>nodeTest(name,{skip:!js&&'Node >=22.13 is required to execute the TypeScript handler without importing its SDK'},fn);
function fixture(){
 let handler,authCalls=0;
 const admin={auth:{getUser:async()=>{authCalls++;return {data:{user:null},error:null};}}};
 const context={Response,Request,console,createClient:()=>admin,Deno:{env:{get:()=>''},serve:fn=>handler=fn}};vm.runInNewContext(js,context);
 return {call:(method,origin)=>handler(new Request('https://contract.invalid/students',{method,headers:origin?{origin}:{}})),get authCalls(){return authCalls;}};
}
for(const origin of ['https://contrem.vercel.app','https://contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app','https://contrem-academia.vercel.app'])test('OPTIONS permits exact trusted origin '+origin,async()=>{const f=fixture(),r=await f.call('OPTIONS',origin);assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),origin);assert.match(r.headers.get('access-control-allow-headers'),/authorization/);assert.match(r.headers.get('access-control-allow-methods'),/POST/);assert.equal(r.headers.get('vary'),'Origin');assert.equal(f.authCalls,0);});
for(const origin of ['https://contrem.vercel.app.attacker.invalid','https://attacker.invalid','null'])test('OPTIONS rejects untrusted origin '+origin,async()=>{const f=fixture(),r=await f.call('OPTIONS',origin);assert.equal(r.status,403);assert.equal(r.headers.get('access-control-allow-origin'),null);assert.equal(f.authCalls,0);});
test('allowed CORS does not authorize an unauthenticated admin request',async()=>{const f=fixture(),r=await f.call('POST','https://contrem.vercel.app');assert.equal(r.status,401);assert.equal(f.authCalls,0);});
