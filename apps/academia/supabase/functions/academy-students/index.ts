import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const url=Deno.env.get('SUPABASE_URL')||'';
const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const allowed=(origin:string)=>origin==='https://contrem-git-feature-aca-d862b0-vinicius-alves-projects-fdea38e8.vercel.app'||origin==='https://contrem-git-feature-aca-7b7922-vinicius-alves-projects-fdea38e8.vercel.app'||origin==='https://contrem-git-release-aca-bcdaf7-vinicius-alves-projects-fdea38e8.vercel.app'||origin==='https://contrem.vercel.app'||origin==='https://contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app'||origin==='https://contrem-academia.vercel.app'||origin==='https://contrem-academia-preview.vercel.app'||origin==='https://va-academia.vercel.app'||/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers:Record<string,string>={'Content-Type':'application/json','Vary':'Origin'};
 if(origin&&allowed(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';headers['Access-Control-Allow-Methods']='POST, OPTIONS';}
 const reply=(status:number,payload:unknown)=>new Response(JSON.stringify(payload),{status,headers});
 if(origin&&!allowed(origin))return reply(403,{error:'Origem não autorizada.'});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'Método não permitido.'});
 try{
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if(!token)return reply(401,{error:'Entre na sua conta de administrador.'});
  const {data:{user},error:userError}=await admin.auth.getUser(token);
  if(userError||!user||user.email?.toLowerCase()!=='vinicius.alves@irmen.com.br')return reply(403,{error:'Acesso restrito ao administrador da Academia.'});
  const {data:member,error:memberError}=await admin.from('academy_members').select('id').eq('user_id',user.id).eq('active',true).eq('role','admin').maybeSingle();
  if(memberError||!member)return reply(403,{error:'Acesso restrito ao administrador da Academia.'});
  const payload=await req.json();
  if(payload.action==='list'){
   const {data:members,error:e}=await admin.from('academy_members').select('id,display_name,active,created_at').eq('role','student').order('created_at',{ascending:false});
   if(e)return reply(500,{error:'Não foi possível carregar alunos.'});
   const {data:grants,error:g}=await admin.from('academy_course_access').select('member_id,course_id');
   if(g)return reply(500,{error:'Não foi possível carregar liberações.'});
   return reply(200,{members,grants});
  }
  if(payload.action==='access'){
   const memberId=String(payload.memberId||''),courseId=String(payload.courseId||'');
   if(!/^[a-f0-9-]{36}$/.test(memberId)||!/^[A-Za-z0-9_-]+$/.test(courseId)||typeof payload.enabled!=='boolean')return reply(400,{error:'Dados de acesso inválidos.'});
   const {data:student}=await admin.from('academy_members').select('id').eq('id',memberId).eq('role','student').eq('active',true).maybeSingle();
   if(!student)return reply(404,{error:'Aluno ativo não encontrado.'});
   const {data:catalog,error:cError}=await admin.from('academy_catalog').select('courses').eq('id','main').single();
   if(cError||!Array.isArray(catalog?.courses)||!catalog.courses.some((c:{id?:string})=>c.id===courseId))return reply(404,{error:'Curso não encontrado.'});
   const result=payload.enabled?await admin.from('academy_course_access').upsert({member_id:memberId,course_id:courseId,granted_by:member.id},{onConflict:'member_id,course_id'}):await admin.from('academy_course_access').delete().eq('member_id',memberId).eq('course_id',courseId);
   if(result.error)return reply(500,{error:'Não foi possível atualizar o acesso.'});
   return reply(200,{memberId,courseId,enabled:payload.enabled});
  }
  if(payload.action==='status'){
   const memberId=String(payload.memberId||'');
   if(!/^[a-f0-9-]{36}$/.test(memberId))return reply(400,{error:'Aluno inválido.'});
   const {data:student}=await admin.from('academy_members').select('id').eq('id',memberId).eq('role','student').maybeSingle();
   if(!student)return reply(404,{error:'Aluno não encontrado.'});
   const {error:e}=await admin.from('academy_members').update({active:payload.active===true}).eq('id',memberId);
   if(e)return reply(500,{error:'Não foi possível alterar o acesso.'});
   return reply(200,{memberId,active:payload.active===true});
  }
  if(payload.action!=='create')return reply(400,{error:'Ação inválida.'});
  const email=String(payload.email||'').trim().toLowerCase(),name=String(payload.name||'').trim(),password=String(payload.password||'');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||name.length<2||name.length>100||password.length<8||password.length>128)return reply(400,{error:'Informe nome, e-mail válido e senha inicial de 8 a 128 caracteres.'});
  if(email==='vinicius.alves@irmen.com.br')return reply(400,{error:'Este e-mail já é do administrador.'});
  const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name}});
  if(createError||!created.user)return reply(409,{error:'Não foi possível criar a conta. Se o e-mail já existe no sistema, use outro ou entre em contato com o suporte.'});
  const {data:memberCreated,error:insertError}=await admin.from('academy_members').insert({user_id:created.user.id,display_name:name,role:'student',active:true}).select('id').single();
  if(insertError||!memberCreated?.id){await admin.auth.admin.deleteUser(created.user.id);return reply(500,{error:'Não foi possível liberar o acesso do aluno. Tente novamente.'});}
  const {error:learningError}=await admin.from('academy_learning_state').insert({member_id:memberCreated.id,profile:{fullName:name,email,company:'',role:''},progress:{},activity:{},certificates:[]});
  if(learningError){
   await admin.from('academy_members').delete().eq('id',memberCreated.id);
   await admin.auth.admin.deleteUser(created.user.id);
   return reply(500,{error:'Não foi possível iniciar o histórico do aluno. Nenhuma conta incompleta foi liberada.'});
  }
  return reply(201,{id:created.user.id,name,email});
 }catch{return reply(500,{error:'Falha ao cadastrar aluno. Tente novamente.'});}
});
