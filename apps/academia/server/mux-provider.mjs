import {createPrivateKey, sign} from 'node:crypto';
import {Buffer} from 'node:buffer';

const idPattern=/^[A-Za-z0-9_-]{8,255}$/;
const encoded=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
// Signing keys stay on the server. Mux returns base64-encoded PEM; raw PEM is also accepted.
export function signMuxToken({playbackId,keyId,privateKey,expiresAt,audience,restrictionId}) {
 if(!idPattern.test(playbackId)||!idPattern.test(keyId)||!['v','t','s'].includes(audience)||!Number.isSafeInteger(expiresAt))throw Error('Invalid signing parameters');
 const pem=privateKey.includes('-----BEGIN')?privateKey:Buffer.from(privateKey,'base64').toString('utf8');
 const key=createPrivateKey(pem);
 if(key.asymmetricKeyType!=='rsa')throw Error('RSA key required');
 const claims={sub:playbackId,aud:audience,exp:expiresAt,kid:keyId};
 if(restrictionId)claims.playback_restriction_id=restrictionId;
 const unsigned=encoded({alg:'RS256',typ:'JWT',kid:keyId})+'.'+encoded(claims);
 return unsigned+'.'+sign('RSA-SHA256',Buffer.from(unsigned),key).toString('base64url');
}

export async function getMuxPlayback({asset,kind,env,allowed,reqJson,now}) {
 const fail=(status,error)=>({status,body:{error}});
 if(env.STREAM_ENABLED!=='true'||!env.MUX_TOKEN_ID||!env.MUX_TOKEN_SECRET)return fail(503,'Mux aguardando conexão.');
 if(!idPattern.test(asset.provider_video_id||'')||!idPattern.test(asset.provider_playback_id||''))return fail(503,'Vínculo Mux inválido.');
 const api='https://api.mux.com';
 const headers={Authorization:'Basic '+Buffer.from(env.MUX_TOKEN_ID+':'+env.MUX_TOKEN_SECRET).toString('base64')};
 const result=await reqJson(api+'/video/v1/assets/'+asset.provider_video_id,{headers});
 const info=result.data;
 if(info?.status!=='ready')return fail(409,'Vídeo ainda está sendo preparado.');
 const playbacks=info.playback_ids;
 const selected=Array.isArray(playbacks)&&playbacks.find(x=>x.id===asset.provider_playback_id&&x.policy===asset.playback_policy);
 if(!selected)return fail(409,'O vínculo do player precisa ser conferido.');
 // Do not silently protect a course while another public playback ID bypasses its login.
 if(kind==='course'&&(selected.policy!=='signed'||playbacks.some(x=>x.policy!=='signed')))return fail(409,'A aula precisa de reprodução privada no Mux.');
 const playbackId=selected.id;
 if(selected.policy==='public') {
  if(kind!=='presentation')return fail(403,'Aula privada.');
  return {status:200,body:{provider:'mux',policy:'public',iframeUrl:'https://player.mux.com/'+playbackId,hlsUrl:'https://stream.mux.com/'+playbackId+'.m3u8',expiresAt:null}};
 }
 if(!env.MUX_SIGNING_KEY_ID||!env.MUX_SIGNING_PRIVATE_KEY||!idPattern.test(env.MUX_PLAYBACK_RESTRICTION_ID||''))return fail(503,'Assinatura Mux aguardando configuração.');
 const restrictionId=env.MUX_PLAYBACK_RESTRICTION_ID;
 const restrictions=await reqJson(api+'/video/v1/playback-restrictions/'+restrictionId,{headers});
 const referrer=restrictions.data?.referrer;
 const domains=[...allowed].map(origin=>new URL(origin).hostname);
 if(!domains.length||referrer?.allow_no_referrer!==false||!Array.isArray(referrer.allowed_domains)||!domains.every(x=>referrer.allowed_domains.includes(x))||referrer.allowed_domains.some(x=>!domains.includes(x)))return fail(503,'Domínios do player ainda não configurados.');
 const duration=Number(info.duration);
 if(!Number.isFinite(duration)||duration<=0)return fail(409,'Duração do vídeo indisponível.');
 // Mux requires expiry beyond the video duration. Allow slower playback and ordinary pauses.
 // A copied token remains reusable until expiry; this is not immediate revocation or DRM.
 const expiresAt=Math.floor(now()/1000)+Math.max(900,Math.ceil(duration*2)+1800);
 const tokens=Object.fromEntries(['v','t','s'].map(audience=>[audience,signMuxToken({playbackId,keyId:env.MUX_SIGNING_KEY_ID,privateKey:env.MUX_SIGNING_PRIVATE_KEY,expiresAt,audience,restrictionId})]));
 const params=new URLSearchParams({'playback-token':tokens.v,'thumbnail-token':tokens.t,'storyboard-token':tokens.s});
 return {status:200,body:{provider:'mux',policy:'signed',iframeUrl:'https://player.mux.com/'+playbackId+'?'+params,hlsUrl:'https://stream.mux.com/'+playbackId+'.m3u8?token='+tokens.v,expiresAt}};
}
