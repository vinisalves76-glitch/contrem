import {getMuxPlayback} from './mux-provider.mjs';
// Server-only. No service key or provider credential is returned to the client.
export function createPlaybackHandler({env, fetchImpl=fetch, now=Date.now}) {
 const allowed = new Set((env.STREAM_ALLOWED_ORIGINS || '').split(',').map(x=>x.trim()).filter(Boolean));
 const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 return async request => {
  const origin=request.headers.get('origin');
  const headers={'Content-Type':'application/json','Cache-Control':'private, no-store','Vary':'Origin'};
  if(origin && allowed.has(origin)) Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'});
  const reply=(status,body)=>new Response(JSON.stringify(body),{status,headers});
  if(origin && !allowed.has(origin)) return reply(403,{error:'Origem não permitida.'});
  if(request.method==='OPTIONS') return origin && allowed.has(origin) ? new Response(null,{status:204,headers}) : reply(403,{error:'Origem não permitida.'});
  if(request.method!=='POST') return reply(405,{error:'Método não permitido.'});
  if(!request.headers.get('content-type')?.includes('application/json')) return reply(415,{error:'Envie JSON.'});
  let body;
  try {const raw=await request.text();if(raw.length>2048)return reply(413,{error:'Pedido muito grande.'});body=JSON.parse(raw);}catch{return reply(400,{error:'Pedido inválido.'});}
  if(!body || Array.isArray(body) || !['course','presentation'].includes(body.kind)) return reply(400,{error:'Tipo de vídeo inválido.'});
  if(body.kind==='course' && !uuid.test(body.videoId || '')) return reply(400,{error:'Vídeo inválido.'});
  // Public presentation is intentional; protected lessons never use this branch.
  if(body.kind==='presentation' && (!origin || !allowed.has(origin))) return reply(403,{error:'Origem não permitida.'});
  const base=env.SUPABASE_URL;
  const publicKey=env.SUPABASE_ANON_KEY;
  const service=env.SUPABASE_SERVICE_ROLE_KEY;
  if(!base || !publicKey || !service) return reply(503,{error:'Streaming ainda não configurado.'});
  const reqJson=async(url,options)=>{
   const response=await fetchImpl(url,{...options,signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error('upstream');
   return response.json();
  };
  try {
   if(body.kind==='course') {
    const auth=request.headers.get('authorization') || '';
    if(!/^Bearer \S+$/i.test(auth))return reply(401,{error:'Entre na sua conta.'});
    const userHeaders={apikey:publicKey,Authorization:auth};
    let user;
    try {user=await reqJson(base+'/auth/v1/user',{headers:userHeaders});} catch{return reply(401,{error:'Sessão inválida. Entre novamente.'});}
    if(!uuid.test(user?.id || ''))return reply(401,{error:'Sessão inválida.'});
    const members=await reqJson(base+'/rest/v1/academy_members?select=id,active&user_id=eq.'+user.id,{headers:userHeaders});
    if(!Array.isArray(members)||members.length!==1||members[0].active!==true)return reply(403,{error:'Acesso indisponível.'});
    // User JWT, not service key: RLS checks the current course grant on every issuance.
    const videos=await reqJson(base+'/rest/v1/academy_videos?select=id,status&id=eq.'+body.videoId,{headers:userHeaders});
    if(!Array.isArray(videos)||videos.length!==1||videos[0].status!=='published')return reply(403,{error:'Acesso indisponível.'});
   }
   const mappingHeaders={apikey:service,Authorization:'Bearer '+service};
   const filter=body.kind==='course' ? '&kind=eq.course&video_id=eq.'+body.videoId : '&kind=eq.presentation';
   const assets=await reqJson(base+'/rest/v1/academy_stream_assets?select=provider,provider_video_id,provider_playback_id,playback_policy,state'+filter,{headers:mappingHeaders});
   if(!Array.isArray(assets)||assets.length!==1||assets[0].state!=='ready')return reply(409,{error:'Vídeo ainda não disponível.'});
   const asset=assets[0];
   if(asset.provider==='mux') {
    const playback=await getMuxPlayback({asset,kind:body.kind,env,allowed,reqJson,now});
    return reply(playback.status,playback.body);
   }
   if(asset.provider!=='cloudflare'||!/^[a-f0-9]{32}$/.test(asset.provider_video_id))return reply(503,{error:'Configuração de vídeo inválida.'});
   if(env.STREAM_ENABLED!=='true'||!env.CLOUDFLARE_ACCOUNT_ID||!env.CLOUDFLARE_API_TOKEN||!/^customer-[a-z0-9-]+\.cloudflarestream\.com$/.test(env.CLOUDFLARE_STREAM_HOST || '')) return reply(503,{error:'Streaming aguardando ativação.'});
   const api='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(env.CLOUDFLARE_ACCOUNT_ID)+'/stream/'+asset.provider_video_id;
   const cfHeaders={Authorization:'Bearer '+env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'};
   const info=await reqJson(api,{headers:cfHeaders});
   if(info.success!==true||info.result?.readyToStream!==true||info.result?.requireSignedURLs!==true)return reply(409,{error:'Vídeo ainda não está pronto ou protegido.'});
   const domains=[...allowed].map(x=>new URL(x).hostname);
   if(!Array.isArray(info.result.allowedOrigins)||!domains.every(x=>info.result.allowedOrigins.includes(x))||info.result.allowedOrigins.some(x=>!domains.includes(x)))return reply(503,{error:'Restrição de domínio ainda não configurada.'});
   const expiresAt=Math.floor(now()/1000)+900;
   const signed=await reqJson(api+'/token',{method:'POST',headers:cfHeaders,body:JSON.stringify({exp:expiresAt,downloadable:false})});
   const token=signed.result?.token;
   if(signed.success!==true||typeof token!=='string'||!/^[A-Za-z0-9_.-]+$/.test(token))return reply(502,{error:'Não foi possível abrir o vídeo.'});
   const host='https://'+env.CLOUDFLARE_STREAM_HOST;
   return reply(200,{iframeUrl:host+'/'+token+'/iframe',hlsUrl:host+'/'+token+'/manifest/video.m3u8',expiresAt});
  } catch {return reply(502,{error:'Serviço de vídeo temporariamente indisponível.'});}
 };
}
