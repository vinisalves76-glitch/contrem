import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPlaybackHandler} from '../server/playback.mjs';
const videoId='d8e7309a-85cf-4189-b031-5f097739448c';
const origin='https://contrem-academia.vercel.app';
const env={SUPABASE_URL:'https://project.supabase.co',SUPABASE_ANON_KEY:'public-test',SUPABASE_SERVICE_ROLE_KEY:'server-secret-test',STREAM_ENABLED:'true',STREAM_ALLOWED_ORIGINS:origin,CLOUDFLARE_ACCOUNT_ID:'test-account',CLOUDFLARE_API_TOKEN:'provider-secret-test',CLOUDFLARE_STREAM_HOST:'customer-test.cloudflarestream.com'};
function fixture(change={}){
 const calls=[];
 const fetchImpl=async (url,opts)=>{
  calls.push({url,opts});
  if(change.networkFailure)throw Error('secret internal failure');
  let data;
  if(url.endsWith('/auth/v1/user')) {if(change.invalidAuth)return new Response('{}',{status:401});data={id:videoId};}
  else if(url.includes('/academy_members?'))data=change.noMember?[]:[{id:videoId,active:!change.inactive}];
  else if(url.includes('/academy_videos?'))data=change.denied?[]:[{id:videoId,status:change.draft?'draft':'published'}];
  else if(url.includes('/academy_stream_assets?'))data=change.noAsset?[]:[{provider:'cloudflare',provider_video_id:'a'.repeat(32),state:change.processing?'processing':'ready'}];
  else if(url.endsWith('/token'))data=change.signingFails?{success:false}:{success:true,result:{token:'signed.playback.token'}};
  else data={success:true,result:{readyToStream:!change.notReady,requireSignedURLs:!change.unprotected,allowedOrigins:change.wrongDomain?['*']:['contrem-academia.vercel.app']}};
  return Response.json(data);
 };
 return {calls,handler:createPlaybackHandler({env:{...env,...change.env},fetchImpl,now:()=>1000000})};
}
function request(body={kind:'course',videoId},extra={}){
 const headers={origin,'content-type':'application/json',authorization:'Bearer user-session-test',...extra.headers};
 return new Request('https://api.test/playback',{method:extra.method||'POST',headers,body:extra.method==='GET'||extra.method==='OPTIONS'?undefined:JSON.stringify(body)});
}
test('authorized course returns expiring playback and no server credentials',async()=>{
 const {handler,calls}=fixture();const r=await handler(request());assert.equal(r.status,200);const data=await r.json();
 assert.equal(data.expiresAt,1900);assert.equal(r.headers.get('cache-control'),'private, no-store');assert.match(data.iframeUrl,/signed.playback.token\/iframe$/);
 assert(!JSON.stringify(data).includes('secret'));const check=calls.find(c=>c.url.includes('/academy_videos?'));assert.equal(check.opts.headers.Authorization,'Bearer user-session-test');
 assert.deepEqual(JSON.parse(calls.at(-1).opts.body),{exp:1900,downloadable:false});
});
for(const [name,change,status] of [
 ['invalid session',{invalidAuth:true},401],['missing academy member',{noMember:true},403],['inactive member',{inactive:true},403],['ungranted course',{denied:true},403],['unpublished course video',{draft:true},403],['missing asset',{noAsset:true},409],['processing asset',{processing:true},409],['provider video still processing',{notReady:true},409],['public provider video rejected',{unprotected:true},409],['wildcard provider origin rejected',{wrongDomain:true},503],['provider not enabled',{env:{STREAM_ENABLED:'false'}},503],['provider signing failure',{signingFails:true},502],['upstream errors do not leak',{networkFailure:true},401]
])test(name,async()=>{const {handler,calls}=fixture(change);const r=await handler(request());assert.equal(r.status,status);assert(!calls.some(c=>c.url.endsWith('/token'))||change.signingFails);assert(!(await r.text()).includes('secret'));});
test('denied course never loads provider mapping or uses provider API',async()=>{const {handler,calls}=fixture({denied:true});await handler(request());assert(!calls.some(c=>c.url.includes('academy_stream_assets')||c.url.includes('cloudflare.com')));});
test('missing bearer rejected before any upstream request',async()=>{const {handler,calls}=fixture();const r=await handler(request(undefined,{headers:{authorization:''}}));assert.equal(r.status,401);assert.equal(calls.length,0);});
test('disallowed origin rejected before any upstream request',async()=>{const {handler,calls}=fixture();const r=await handler(request(undefined,{headers:{origin:'https://attacker.test'}}));assert.equal(r.status,403);assert.equal(calls.length,0);});
test('presentation public flow does not query course authorization',async()=>{const {handler,calls}=fixture();const r=await handler(request({kind:'presentation'},{headers:{authorization:''}}));assert.equal(r.status,200);assert(!calls.some(c=>c.url.includes('/auth/')||c.url.includes('/academy_videos?')));assert(calls.some(c=>c.url.includes('kind=eq.presentation')));});
test('presentation rejects absent origin',async()=>{const {handler}=fixture();const req=request({kind:'presentation'});req.headers.delete('origin');assert.equal((await handler(req)).status,403);});
test('malformed id cannot alter the database filter',async()=>{const {handler,calls}=fixture();assert.equal((await handler(request({kind:'course',videoId:'x&status=eq.published'}))).status,400);assert.equal(calls.length,0);});
test('request method is restricted',async()=>{const {handler}=fixture();assert.equal((await handler(request(undefined,{method:'GET'}))).status,405);});
test('oversized request rejected without accessing providers',async()=>{const {handler,calls}=fixture();assert.equal((await handler(request({kind:'course',videoId,x:'x'.repeat(3000)}))).status,413);assert.equal(calls.length,0);});
