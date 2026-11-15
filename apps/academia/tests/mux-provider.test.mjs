import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,verify} from 'node:crypto';
import {getMuxPlayback,signMuxToken} from '../server/mux-provider.mjs';
import {createPlaybackHandler} from '../server/playback.mjs';
const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
const keyId='SigningKeyIdTest';
const asset={provider:'mux',provider_video_id:'AssetIdTest0001',provider_playback_id:'PlaybackIdTest0001',playback_policy:'signed',state:'ready'};
const origin='https://contrem-academia.vercel.app';
const baseEnv={STREAM_ENABLED:'true',MUX_TOKEN_ID:'api-token-id',MUX_TOKEN_SECRET:'api-server-secret',MUX_SIGNING_KEY_ID:keyId,MUX_SIGNING_PRIVATE_KEY:privateKey.export({type:'pkcs8',format:'pem'}),MUX_PLAYBACK_RESTRICTION_ID:'RestrictionIdTest'};
const allowed=new Set([origin]);
function tokenClaims(token){return JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());}
function validSignature(token){const [h,p,s]=token.split('.');return verify('RSA-SHA256',Buffer.from(h+'.'+p),publicKey,Buffer.from(s,'base64url'));}
function fixture(change={}){
 const calls=[];
 const reqJson=async(url,options)=>{
  calls.push({url,options});
  if(url.includes('/playback-restrictions/'))return {data:{referrer:{allow_no_referrer:change.noReferrer??false,allowed_domains:change.domains||['contrem-academia.vercel.app']}}};
  return {data:{status:change.processing?'preparing':'ready',duration:change.duration??7200,playback_ids:change.playbacks||[{id:asset.provider_playback_id,policy:'signed'}]}};
 };
 return {calls,args:{asset:{...asset,...change.asset},kind:change.kind||'course',env:{...baseEnv,...change.env},allowed,reqJson,now:()=>1_000_000}};
}
for(const type of ['pkcs1','pkcs8'])for(const base64 of [false,true])test('real RS256 signature from '+type+' PEM, base64='+base64,()=>{
 let pem=privateKey.export({type,format:'pem'});if(base64)pem=Buffer.from(pem).toString('base64');
 const token=signMuxToken({playbackId:asset.provider_playback_id,keyId,privateKey:pem,expiresAt:9999,audience:'v',restrictionId:'RestrictionIdTest'});
 assert(validSignature(token));assert.deepEqual(tokenClaims(token),{sub:asset.provider_playback_id,aud:'v',exp:9999,kid:keyId,playback_restriction_id:'RestrictionIdTest'});
});
test('long lesson tokens exceed video duration and all media audiences are signed',async()=>{
 const {args}=fixture();const result=await getMuxPlayback(args);assert.equal(result.status,200);assert.equal(result.body.expiresAt,17200);
 const u=new URL(result.body.iframeUrl);
 for(const [param,aud] of [['playback-token','v'],['thumbnail-token','t'],['storyboard-token','s']]){const token=u.searchParams.get(param);assert(validSignature(token));assert.equal(tokenClaims(token).aud,aud);assert.equal(tokenClaims(token).exp,17200);}
 assert(!JSON.stringify(result.body).includes('api-server-secret'));assert(!JSON.stringify(result.body).includes('PRIVATE KEY'));
});
for(const [name,change,status] of [
 ['processing video',{processing:true},409],['foreign playback ID',{playbacks:[{id:'ForeignPlaybackId',policy:'signed'}]},409],
 ['course with public playback',{asset:{playback_policy:'public'},playbacks:[{id:asset.provider_playback_id,policy:'public'}]},409],
 ['course with mixed signed and public IDs',{playbacks:[{id:asset.provider_playback_id,policy:'signed'},{id:'PublicPlaybackId',policy:'public'}]},409],
 ['wildcard referrer restriction',{domains:['*']},503],['extra domain restriction',{domains:['contrem-academia.vercel.app','attacker.test']},503],
 ['no-referrer playback permitted',{noReferrer:true},503],['missing signing key',{env:{MUX_SIGNING_PRIVATE_KEY:''}},503],
 ['missing duration',{duration:0},409],['non-finite duration',{duration:Infinity},409],['disabled integration',{env:{STREAM_ENABLED:'false'}},503],
 ['missing account API credentials',{env:{MUX_TOKEN_SECRET:''}},503],['malformed asset ID',{asset:{provider_video_id:'x/../assets'}},503]
])test('rejects '+name,async()=>{const {args}=fixture(change);assert.equal((await getMuxPlayback(args)).status,status);});
test('public presentation uses public playback URL without key or JWT',async()=>{
 const {args,calls}=fixture({kind:'presentation',asset:{playback_policy:'public'},playbacks:[{id:asset.provider_playback_id,policy:'public'}],env:{MUX_SIGNING_PRIVATE_KEY:''}});
 const result=await getMuxPlayback(args);assert.equal(result.status,200);assert.equal(result.body.expiresAt,null);assert(!result.body.iframeUrl.includes('token'));assert.equal(calls.length,1);
});
test('course signed authorization happens before Mux mapping or signing',async()=>{
 const calls=[];
 const handler=createPlaybackHandler({env:{...baseEnv,SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'private',STREAM_ALLOWED_ORIGINS:origin},fetchImpl:async(url)=>{
  calls.push(url);
  if(url.includes('/auth/'))return Response.json({id:'d8e7309a-85cf-4189-b031-5f097739448c'});
  if(url.includes('/academy_members'))return Response.json([{active:true}]);
  if(url.includes('/academy_videos'))return Response.json([]);
  throw Error('must not query provider');
 }});
 const response=await handler(new Request('https://api.test/playback',{method:'POST',headers:{origin,'content-type':'application/json',authorization:'Bearer fake-test'},body:JSON.stringify({kind:'course',videoId:'d8e7309a-85cf-4189-b031-5f097739448c'})}));
 assert.equal(response.status,403);assert(!calls.some(x=>x.includes('academy_stream_assets')||x.includes('mux.com')));
});
