// Same-origin transport only. The existing Supabase functions authorize the user's JWT.
// No service key, token minting, cookies or authorization cache.
const FUNCTIONS=new Set(['academy-workspace','academy-students','academy-programs','academy-playback']);
const UPSTREAM='https://vwvesygsudhbaqmayhsz.supabase.co/functions/v1/';
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Vary','Origin');
 const reply=(status,error)=>res.status(status).json({error});
 if(req.method!=='POST')return reply(405,'Método não permitido.');
 const host=req.headers.host,origin=req.headers.origin;
 if(origin&&origin!==`https://${host}`)return reply(403,'Origem não permitida.');
 const fn=req.query?.fn;
 if(typeof fn!=='string'||!FUNCTIONS.has(fn))return reply(404,'Serviço indisponível.');
 const auth=req.headers.authorization,apikey=req.headers.apikey;
 if(typeof auth!=='string'||!/^Bearer [A-Za-z0-9_.-]+$/.test(auth)||typeof apikey!=='string'||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(apikey))return reply(401,'Entre na sua conta da Academia.');
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return reply(415,'Envie dados JSON.');
 const body=typeof req.body==='string'?req.body:JSON.stringify(req.body||{});
 if(Buffer.byteLength(body)>1200000)return reply(413,'Dados excedem o limite.');
 try{const response=await fetch(UPSTREAM+fn,{method:'POST',headers:{Authorization:auth,apikey,'Content-Type':'application/json'},body,signal:AbortSignal.timeout(25000),redirect:'error'});res.setHeader('Content-Type','application/json');return res.status(response.status).send(await response.text());}
 catch{return reply(502,'Não foi possível consultar a Academia. Tente novamente.');}
};
