// Only public connection settings are emitted into the static browser bundle.
export function createAcademiaConfig(env = process.env) {
 const mode=env.ACADEMY_MODE || 'preview';
 if(!['preview','connected'].includes(mode))throw Error('ACADEMY_MODE deve ser preview ou connected.');
 if(mode==='preview'){
  if(env.VERCEL_ENV==='production')throw Error('A produção não pode usar o sandbox ADM da homologação. Configure o modo conectado.');
  return {preview:true};
 }
 let url;
 try{url=new URL(env.SUPABASE_URL);}catch{throw Error('Configure SUPABASE_URL pública do projeto da Academia.');}
 if(url.protocol!=='https:'||!url.hostname.endsWith('.supabase.co')||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash)throw Error('SUPABASE_URL deve ser a origem HTTPS do projeto Supabase.');
 const key=env.SUPABASE_PUBLISHABLE_KEY || '';
 let publicKey=/^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
 if(!publicKey&&key.split('.').length===3){
  try{const payload=JSON.parse(Buffer.from(key.split('.')[1],'base64url'));publicKey=payload.role==='anon'&&payload.ref===url.hostname.split('.')[0];}catch{}
 }
 if(!publicKey)throw Error('Configure SUPABASE_PUBLISHABLE_KEY; chaves administrativas nunca podem entrar no navegador.');
 const playbackFunction=env.ACADEMY_PLAYBACK_FUNCTION || 'academy-playback';
 if(!/^[a-z][a-z0-9-]{0,62}$/.test(playbackFunction))throw Error('Nome de função de playback inválido.');
 return {mode:'connected',preview:false,url:url.origin,publishableKey:key,playbackFunction};
}
