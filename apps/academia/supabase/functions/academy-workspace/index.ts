// CONTREM Academia: server-authorized staff, drafts and explicit publication.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const url=Deno.env.get('SUPABASE_URL')||'';
const serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
const permittedOrigin=(origin:string)=>origin==='https://contrem.vercel.app'||origin==='https://contrem-academia.vercel.app'||/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COURSE_ID=/^[A-Za-z0-9_-]{1,160}$/;
type Course={id:string;status?:string;lessons?:Array<{id:string;[key:string]:unknown}>;[key:string]:unknown};
type Member={id:string;user_id:string;role:string;active:boolean;display_name:string};
const fail=(status:number,message:string)=>({status,error:message});
const getRow=async(table:string,columns='*')=>{
 const {data,error}=await db.from(table).select(columns).eq('id','main').single();
 if(error||!data)throw Error('Não foi possível consultar o catálogo.');
 return data;
};
const saveRow=async(table:string,revision:number,courses:Course[],memberId:string)=>{
 const {data,error}=await db.from(table).update({courses,revision:revision+1,updated_by:memberId,updated_at:new Date().toISOString()}).eq('id','main').eq('revision',revision).select('revision,courses').maybeSingle();
 if(error)throw Error('Não foi possível salvar as alterações. Tente novamente.');
 if(!data)throw Object.assign(Error('O catálogo mudou em outra sessão. Recarregue antes de salvar.'),{status:409});
 return data;
};
const validCourses=(x:unknown):x is Course[]=>{
 if(!Array.isArray(x)||x.length>400)return false;
 const ids=new Set<string>();
 for(const c of x){
  if(!c||typeof c!=='object'||!COURSE_ID.test(c.id)||ids.has(c.id)||!['draft','published'].includes(c.status||'draft')||!Array.isArray(c.lessons)||c.lessons.length>500)return false;
  ids.add(c.id);
  const lessons=new Set<string>();
  for(const l of c.lessons)if(!l||typeof l!=='object'||typeof l.id!=='string'||!COURSE_ID.test(l.id)||lessons.has(l.id))return false;else lessons.add(l.id);
 }
 return true;
};
const safeStaffChanges=(before:Course[],after:Course[]):string|null=>{
 const next=new Map(after.map(c=>[c.id,c]));
 for(const old of before){
  const changed=next.get(old.id);
  if(!changed)return 'O ADM de Conteúdo não pode excluir cursos.';
  for(const lesson of old.lessons||[])if(!(changed.lessons||[]).some(l=>l.id===lesson.id))return 'O ADM de Conteúdo não pode excluir aulas.';
  if(changed.status==='published'&&JSON.stringify(changed)!==JSON.stringify(old))return 'Somente o ADM Master pode publicar ou atualizar diretamente um curso publicado.';
 }
 for(const course of after)if(!before.some(c=>c.id===course.id)&&course.status==='published')return 'Somente o ADM Master pode publicar cursos.';
 return null;
};
Deno.serve(async req=>{
 const origin=req.headers.get('origin')||'';
 const headers:Record<string,string>={'Content-Type':'application/json','Vary':'Origin'};
 if(origin&&permittedOrigin(origin)){
  headers['Access-Control-Allow-Origin']=origin;
  headers['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';
  headers['Access-Control-Allow-Methods']='POST,OPTIONS';
 }
 const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!permittedOrigin(origin))return reply(403,{error:'Origem não permitida.'});
 if(req.method==='OPTIONS')return reply(204,{ok:true});
 if(req.method!=='POST')return reply(405,{error:'Método não permitido.'});
 const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
 if(!token)return reply(401,{error:'Entre na sua conta da CONTREM Academia.'});
 if(Number(req.headers.get('content-length')||'0')>1_200_000)return reply(413,{error:'Dados excedem o limite.'});
 try{
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user)return reply(401,{error:'Sessão inválida. Entre novamente.'});
  const {data:member,error:memberError}=await db.from('academy_members').select('id,user_id,role,active,display_name').eq('user_id',user.id).maybeSingle();
  if(memberError||!member||!member.active)return reply(403,{error:'Usuário não autorizado ou inativo.'});
  const master=member.role==='admin'&&user.email?.toLowerCase()==='vinicius.alves@irmen.com.br';
  const editor=master||member.role==='content_admin';
  if(!editor)return reply(403,{error:'Acesso restrito à equipe administrativa da Academia.'});
  const payload=await req.json().catch(()=>null);
  if(!payload||typeof payload!=='object'||typeof payload.action!=='string')return reply(400,{error:'Dados inválidos.'});
  const action=payload.action;
  if(action==='catalog'){
   const row=await getRow('academy_editor_catalog','id,courses,revision');
   return reply(200,{id:'main',courses:row.courses,revision:row.revision});
  }
  if(action==='save'){
   const courses=payload.courses,revision=payload.revision;
   if(!Number.isSafeInteger(revision)||revision<0||!validCourses(courses))return reply(400,{error:'Catálogo ou revisão inválidos.'});
   const row=await getRow('academy_editor_catalog','id,courses,revision');
   if(row.revision!==revision)return reply(409,{error:'O catálogo mudou em outra sessão. Recarregue os dados.'});
   if(!master){
    const denied=safeStaffChanges(row.courses,courses);
    if(denied)return reply(403,{error:denied});
   }
   const changed=await saveRow('academy_editor_catalog',revision,courses,member.id);
   if(master){
    // Deletion by Master removes that course from the student-facing catalog.
    const removed=new Set((row.courses as Course[]).map(c=>c.id).filter((id:string)=>!courses.some((c:Course)=>c.id===id)));
    if(removed.size){
     const live=await getRow('academy_catalog','id,courses,revision');
     const kept=(live.courses as Course[]).filter(c=>!removed.has(c.id));
     if(kept.length!==live.courses.length)await saveRow('academy_catalog',live.revision,kept,member.id);
    }
   }
   return reply(200,{id:'main',revision:changed.revision,courses:changed.courses});
  }
  if(action==='publish'||action==='unpublish'){
   if(!master)return reply(403,{error:'Somente o ADM Master pode publicar ou retirar cursos do ar.'});
   const courseId=String(payload.courseId||'');
   if(!COURSE_ID.test(courseId))return reply(400,{error:'Curso inválido.'});
   const [draft,live]=await Promise.all([getRow('academy_editor_catalog','id,courses,revision'),getRow('academy_catalog','id,courses,revision')]);
   const course=(draft.courses as Course[]).find(c=>c.id===courseId);
   if(!course)return reply(404,{error:'Curso não encontrado.'});
   if(action==='publish'&&course.status!=='published')return reply(409,{error:'Salve a revisão como publicada antes de confirmar.'});
   const liveCourses=(live.courses as Course[]).filter(c=>c.id!==courseId);
   const previous=(live.courses as Course[]).find(c=>c.id===courseId);
   const next=action==='publish'?{...course,status:'published'}:previous?{...previous,status:'draft'}:{...course,status:'draft'};
   const order=(live.courses as Course[]).findIndex(c=>c.id===courseId);
   liveCourses.splice(order<0?liveCourses.length:order,0,next);
   const result=await saveRow('academy_catalog',live.revision,liveCourses,member.id);
   return reply(200,{courseId,status:next.status,revision:result.revision});
  }
  if(action==='list_staff'){
   if(!master)return reply(403,{error:'Somente o ADM Master gerencia funcionários.'});
   const {data:staff,error}=await db.from('academy_members').select('id,user_id,display_name,active,created_at').eq('role','content_admin').order('created_at',{ascending:false}).limit(100);
   if(error)return reply(500,{error:'Não foi possível listar funcionários.'});
   const members=await Promise.all((staff||[]).map(async (m:{id:string;user_id:string;display_name:string;active:boolean})=>{
    const {data}=await db.auth.admin.getUserById(m.user_id);
    return {id:m.id,name:m.display_name,email:data.user?.email||'',active:m.active};
   }));
   return reply(200,members);
  }
  if(action==='create_staff'){
   if(!master)return reply(403,{error:'Somente o ADM Master cria logins de funcionários.'});
   const name=String(payload.name||'').trim(),email=String(payload.email||'').trim().toLowerCase(),password=payload.password;
   if(name.length<2||name.length>100||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof password!=='string'||password.length<8||password.length>128)return reply(400,{error:'Preencha nome, e-mail válido e senha entre 8 e 128 caracteres.'});
   if(email==='vinicius.alves@irmen.com.br')return reply(409,{error:'Este e-mail está reservado ao ADM Master.'});
   const {data:created,error:e}=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{name}});
   if(e||!created.user)return reply(409,{error:'E-mail já cadastrado ou conta não pôde ser criada.'});
   const {data:staff,error:insertError}=await db.from('academy_members').insert({user_id:created.user.id,display_name:name,role:'content_admin',active:true}).select('id').single();
   if(insertError||!staff?.id){await db.auth.admin.deleteUser(created.user.id);return reply(500,{error:'Não foi possível liberar a conta. Nenhum login incompleto foi mantido.'});}
   const {error:stateError}=await db.from('academy_learning_state').insert({member_id:staff.id,profile:{fullName:name,email,company:'',role:''},progress:{},activity:{},certificates:[]});
   if(stateError){
    await db.from('academy_members').delete().eq('id',staff.id);
    await db.auth.admin.deleteUser(created.user.id);
    return reply(500,{error:'Não foi possível completar o cadastro. Tente novamente.'});
   }
   return reply(201,{id:staff.id,name,email,active:true});
  }
  if(action==='staff_status'){
   if(!master)return reply(403,{error:'Somente o ADM Master gerencia funcionários.'});
   const id=String(payload.memberId||'');
   if(!UUID.test(id)||typeof payload.active!=='boolean')return reply(400,{error:'Dados inválidos.'});
   const {data:staff}=await db.from('academy_members').select('id').eq('id',id).eq('role','content_admin').maybeSingle();
   if(!staff)return reply(404,{error:'Funcionário não encontrado.'});
   const {error}=await db.from('academy_members').update({active:payload.active}).eq('id',id).eq('role','content_admin');
   if(error)return reply(500,{error:'Não foi possível atualizar o funcionário.'});
   return reply(200,{id,active:payload.active});
  }
  if(action==='list_students'){
   const {data:students,error:e}=await db.from('academy_members').select('id,display_name,active,created_at').eq('role','student').order('created_at',{ascending:false});
   if(e)return reply(500,{error:'Não foi possível carregar alunos.'});
   const {data:grants,error:g}=await db.from('academy_course_access').select('member_id,course_id');
   if(g)return reply(500,{error:'Não foi possível carregar matrículas.'});
   return reply(200,{members:students||[],grants:grants||[]});
  }
  if(action==='access'){
   const memberId=String(payload.memberId||''),courseId=String(payload.courseId||'');
   if(!UUID.test(memberId)||!COURSE_ID.test(courseId)||typeof payload.enabled!=='boolean')return reply(400,{error:'Dados inválidos.'});
   const {data:student}=await db.from('academy_members').select('id').eq('id',memberId).eq('role','student').eq('active',true).maybeSingle();
   if(!student)return reply(404,{error:'Aluno ativo não encontrado.'});
   const live=await getRow('academy_catalog','id,courses');
   const course=(live.courses as Course[]).find(c=>c.id===courseId);
   if(!course||(!master&&course.status!=='published'))return reply(404,{error:'Somente cursos publicados podem receber matrículas pelo ADM de Conteúdo.'});
   const result=payload.enabled?await db.from('academy_course_access').upsert({member_id:memberId,course_id:courseId,granted_by:member.id},{onConflict:'member_id,course_id'}):await db.from('academy_course_access').delete().eq('member_id',memberId).eq('course_id',courseId);
   if(result.error)return reply(500,{error:'Não foi possível alterar matrícula.'});
   return reply(200,{memberId,courseId,enabled:payload.enabled});
  }
  return reply(400,{error:'Ação não disponível.'});
 }catch(e){
  const error=e as Error & {status?:number};
  return reply(error.status||500,{error:error.status===409?error.message:'Não foi possível concluir a operação.'});
 }
});
