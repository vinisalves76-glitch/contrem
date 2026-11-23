// CONTREM Academia · Formação modular, sem alterar cursos avulsos.
// API administrativa + projeção restrita por matrícula. JWT validado no servidor.
import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const url=Deno.env.get('SUPABASE_URL')||'';
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const preview='https://contrem-git-release-aca-bcdaf7-vinicius-alves-projects-fdea38e8.vercel.app';
const permittedOrigin=(origin:string)=>origin==='https://contrem.vercel.app'||
  origin==='https://contrem-academia.vercel.app'||origin===preview||
  /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(origin);
const idPattern=/^academy-[a-z0-9-]{3,150}$/;
const modulePattern=/^[a-z0-9][a-z0-9_-]{2,159}$/i;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const short=(v:unknown,max=200)=>String(v??'').trim().slice(0,max);
const error=(status:number,message:string)=>({status,error:message});
type Json=Record<string,unknown>;
type Member={id:string;user_id:string;role:string;active:boolean;display_name:string};
const asObject=(v:unknown):Json=>v&&typeof v==='object'&&!Array.isArray(v)?v as Json:{};
function clean(data:unknown){
 const a=asObject(data),stageRows=Array.isArray(a.stages)?a.stages:[],
  moduleRows=Array.isArray(a.modules)?a.modules:[];
 if(stageRows.length>15||moduleRows.length>90)return null;
 const ids=new Set<string>(),stages=[];
 for(const stageData of stageRows){
  const s=asObject(stageData),id=short(s.id,160);
  if(!modulePattern.test(id)||ids.has(id))return null;ids.add(id);
  const moduleIds=Array.isArray(s.moduleIds)?s.moduleIds.map(x=>short(x,160)):[];
  if(moduleIds.length>90||moduleIds.some(x=>!modulePattern.test(x)))return null;
  stages.push({id,title:short(s.title,120),cardTitle:short(s.cardTitle,150),cardDescription:short(s.cardDescription,320),moduleIds});
 }
 ids.clear();
 const modules=[];
 for(const row of moduleRows){
  const m=asObject(row),id=short(m.id,160),lessons=Array.isArray(m.lessons)?m.lessons:[];
  if(!modulePattern.test(id)||ids.has(id)||lessons.length>150)return null;ids.add(id);
  const lessonIds=new Set<string>(),cleanLessons=[];
  for(const l of lessons){
   const val=asObject(l),lessonId=short(val.id,160);
   if(!modulePattern.test(lessonId)||lessonIds.has(lessonId))return null;
   lessonIds.add(lessonId);
   const videoId=short(val.videoId,36);
   if(videoId&&!uuid.test(videoId))return null;
   cleanLessons.push({id:lessonId,name:short(val.name,180),description:short(val.description,1200),
     videoId,minutes:Math.min(600,Math.max(0,Number(val.minutes)||0))});
  }
  modules.push({id,name:short(m.name,180),description:short(m.description,1200),
   hours:Math.min(1000,Math.max(0,Number(m.hours)||0)),moduleEnabled:m.moduleEnabled===true,
   lessons:cleanLessons,questions:[],passScore:Math.min(100,Math.max(0,Number(m.passScore)||75))});
 }
 const seen=new Set<string>();
 for(const stage of stages)for(const id of stage.moduleIds){
  if(!ids.has(id)||seen.has(id))return null;seen.add(id);
 }
 if(seen.size!==ids.size)return null;
 const cover=short(a.cover,1200000);
 if(cover&&!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(cover)&&
  !/^https:\/\//i.test(cover))return null;
 if(cover.length>900000)return null;
 return {title:short(a.title,180),description:short(a.description,4000),
  heroKicker:short(a.heroKicker,160),heroTitle:short(a.heroTitle,180),
  heroHighlight:short(a.heroHighlight,80),heroDescription:short(a.heroDescription,700),
  stageHeading:short(a.stageHeading,150),audience:short(a.audience,600),
  objectives:short(a.objectives,2000),cover,certificateEnabled:a.certificateEnabled===true,
  stages,modules};
}
function studentProjection(program:Json,enrollment:Json,studentName:string){
 const data=asObject(program.definition),modules=Array.isArray(data.modules)?data.modules as Json[]:[],
  stages=Array.isArray(data.stages)?data.stages as Json[]:[],
  ordered=stages.flatMap(s=>Array.isArray(s.moduleIds)?s.moduleIds:[]).map(String);
 const byId=new Map(modules.map(m=>[String(m.id),m]));
 const validUntil=typeof enrollment.expires_on==='string'?enrollment.expires_on:null,
  valid=enrollment.active===true&&(!validUntil||validUntil>=new Date().toISOString().slice(0,10));
 // Until server-authoritative completion is implemented, do NOT automatically unlock later stages.
 const items=ordered.map((id,index)=>{
  const m=byId.get(id);
  const enabled=m?.moduleEnabled===true,canOpen=valid&&enabled&&index===0;
  const lessons=Array.isArray(m?.lessons)?m.lessons as Json[]:[];
  const hasVideo=lessons.length>0&&!!lessons[0].videoId;
  return {id,index,name:short(m?.name,180)||'Módulo em preparação',hours:Number(m?.hours)||0,
   lessons:lessons.length,passed:false,done:false,attempts:0,canOpen,hasVideo,enabled,
   status:!valid?'expired':index>0?'blocked':!enabled?'inactive':!hasVideo?'preparing':'available'};
 });
 const visibleCourses=items.filter(m=>m.canOpen).map(m=>{
  const src=byId.get(m.id)!;
  return {id:m.id,name:m.name,description:short(src.description,1200),
   lessons:(src.lessons as Json[]).map(l=>({id:short(l.id,160),name:short(l.name,180)}))};
 });
 const first=items.find(m=>m.canOpen)||null;
 const nextLesson=first?visibleCourses.find(c=>c.id===first.id)?.lessons[0]:null;
 return {academy:{id:String(program.id),title:String(program.title),
   description:short(data.description,4000),heroKicker:short(data.heroKicker,160),
   heroTitle:short(data.heroTitle,180),heroHighlight:short(data.heroHighlight,80),
   heroDescription:short(data.heroDescription,700),stageHeading:short(data.stageHeading,150),
   cover:short(data.cover,900000),audience:short(data.audience,600),
   objectives:short(data.objectives,2000),certificateEnabled:data.certificateEnabled===true,
   stages:stages.map(s=>({id:s.id,title:s.title,cardTitle:s.cardTitle,
    cardDescription:s.cardDescription,moduleIds:s.moduleIds}))},
   map:{active:valid,approved:0,total:ordered.length,completed:false,items},
   enrollment:{active:valid,validUntil},
   courses:visibleCourses,resume:first?{moduleId:first.id,name:nextLesson?.name||first.name,
    description:'Módulo: '+first.name,started:false}:{status:'blocked',
    name:'Acompanhe sua trilha de aprendizagem',description:'Os módulos serão liberados pelo ADM conforme a formação avançar.'},
   studentName};
}
Deno.serve(async(req)=>{
 const origin=req.headers.get('origin')||'';
 const headers:Record<string,string>={'Content-Type':'application/json','Vary':'Origin'};
 if(origin&&permittedOrigin(origin)){
  headers['Access-Control-Allow-Origin']=origin;
  headers['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';
  headers['Access-Control-Allow-Methods']='POST,OPTIONS';
 }
 const reply=(status:number,value:unknown)=>new Response(JSON.stringify(value),{status,headers});
 if(origin&&!permittedOrigin(origin))return reply(403,error(403,'Origem não permitida.'));
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,error(405,'Método não permitido.'));
 const token=req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
 if(!token)return reply(401,error(401,'Entre na sua conta CONTREM Academia.'));
 try{
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user)return reply(401,error(401,'Sua sessão expirou. Entre novamente.'));
  const {data:member,error:memberError}=await db.from('academy_members')
   .select('id,user_id,role,active,display_name').eq('user_id',user.id).maybeSingle();
  if(memberError||!member||!member.active)return reply(403,error(403,'Conta sem acesso ativo à Academia.'));
  const m=member as Member,master=m.role==='admin'&&user.email?.toLowerCase()==='vinicius.alves@irmen.com.br';
  const editor=master||m.role==='content_admin';
  const input=asObject(await req.json().catch(()=>null)),action=short(input.action,50);
  if(action==='list'){
   if(!editor)return reply(403,error(403,'Somente a equipe administrativa pode consultar todas as Academias.'));
   const {data,e}=await (async()=>{const {data,error:e}=await db.from('academy_programs')
     .select('id,title,status,definition,revision,updated_at').order('updated_at',{ascending:false}).limit(60);return {data,e};})();
   if(e)return reply(500,error(500,'Falha ao consultar Academias.'));
   return reply(200,{programs:data||[],master});
  }
  if(action==='save'){
   if(!editor)return reply(403,error(403,'Você não tem permissão para editar Academias.'));
   const id=short(input.id,160),revision=input.revision,definition=clean(input.definition);
   if(!idPattern.test(id)||!definition||definition.title.length<3)return reply(400,error(400,'Verifique os campos da Academia.'));
   const {data:existing,error:readError}=await db.from('academy_programs')
    .select('id,status,revision').eq('id',id).maybeSingle();
   if(readError)return reply(500,error(500,'Erro ao consultar a formação.'));
   if(existing){
    if(!master&&existing.status!=='draft')return reply(403,error(403,'Somente ADM Master edita formações publicadas.'));
    if(!Number.isSafeInteger(revision)||revision!==existing.revision)return reply(409,error(409,'A formação foi alterada em outro acesso. Atualize o painel.'));
    const {data,error:saveError}=await db.from('academy_programs').update({
      title:definition.title,definition,revision:existing.revision+1,updated_by:m.id,updated_at:new Date().toISOString()
     }).eq('id',id).eq('revision',existing.revision).select('id,revision,status').maybeSingle();
    if(saveError||!data)return reply(409,error(409,'Alterações simultâneas. Recarregue os dados.'));
    return reply(200,{program:data});
   }
   const {data,error:createError}=await db.from('academy_programs').insert({
     id,title:definition.title,definition,created_by:m.id,updated_by:m.id
   }).select('id,revision,status').single();
   if(createError||!data)return reply(409,error(409,'Não foi possível cadastrar a formação. Confirme se ela já existe.'));
   return reply(201,{program:data});
  }
  if(action==='publish'||action==='toggle'){
   if(!master)return reply(403,error(403,'Somente o ADM Master pode publicar e liberar módulos.'));
   const id=short(input.id,160);
   if(!idPattern.test(id))return reply(400,error(400,'Identificador de Academia inválido.'));
   const {data:program,error:readError}=await db.from('academy_programs')
    .select('id,status,revision,title,definition').eq('id',id).maybeSingle();
   if(readError||!program)return reply(404,error(404,'Academia não encontrada.'));
   let nextStatus=program.status,definition=asObject(program.definition);
   if(action==='publish'){
    const stages=Array.isArray(definition.stages)?definition.stages as Json[]:[];
    if(!stages.length)return reply(400,error(400,'Adicione uma etapa em Etapas do aprendizado e salve a Academia.'));
    if(!stages.some(stage=>Array.isArray(stage.moduleIds)&&stage.moduleIds.length>0))
     return reply(400,error(400,'Adicione pelo menos um módulo na etapa e salve a Academia. Vídeos não são obrigatórios.'));
    nextStatus='published'; // The formation can be published without videos or uploaded lessons.
   }else{
    const moduleId=short(input.moduleId,160);
    if(!modulePattern.test(moduleId)||typeof input.enabled!=='boolean')return reply(400,error(400,'Selecione o módulo e a situação.'));
    const modules=Array.isArray(definition.modules)?definition.modules as Json[]:[];
    if(!modules.some(module=>module.id===moduleId))return reply(404,error(404,'Módulo não encontrado.'));
    definition={...definition,modules:modules.map(module=>module.id===moduleId?
      {...module,moduleEnabled:input.enabled}:module)};
   }
   const {data:saved,error:saveError}=await db.from('academy_programs')
    .update({status:nextStatus,definition,revision:program.revision+1,updated_at:new Date().toISOString(),updated_by:m.id})
    .eq('id',id).eq('revision',program.revision).select('id,status,revision').maybeSingle();
   if(saveError||!saved)return reply(409,error(409,'A formação mudou em outra sessão. Recarregue.'));
   return reply(200,{program:saved});
  }
  if(action==='students'){
   if(!master)return reply(403,error(403,'Apenas o ADM Master gerencia matrículas.'));
   const {data,error:queryError}=await db.from('academy_members').select('id,display_name,active')
    .eq('role','student').order('display_name').limit(300);
   if(queryError)return reply(500,error(500,'Não foi possível listar alunos.'));
   const {data:enrollments,error:enrollmentError}=await db.from('academy_program_enrollments')
    .select('program_id,member_id,active,expires_on').limit(1500);
   if(enrollmentError)return reply(500,error(500,'Não foi possível listar matrículas.'));
   return reply(200,{students:data||[],enrollments:enrollments||[]});
  }
  if(action==='enroll'){
   if(!master)return reply(403,error(403,'Apenas o ADM Master gerencia matrículas.'));
   const id=short(input.id,160),memberId=short(input.memberId,36),
    active=typeof input.active==='boolean'?input.active:true,until=short(input.expiresOn,10);
   if(!idPattern.test(id)||!uuid.test(memberId)||
      (until&&!/^\d{4}-\d\d-\d\d$/.test(until)))return reply(400,error(400,'Dados da matrícula inválidos.'));
   const [{data:program},{data:student}]=await Promise.all([
    db.from('academy_programs').select('id,status').eq('id',id).single(),
    db.from('academy_members').select('id,role,active').eq('id',memberId).single()
   ]);
   if(!program||program.status!=='published'||!student||student.role!=='student')
    return reply(409,error(409,'Academia ou aluno indisponível para matrícula.'));
   const {error:grantError}=await db.from('academy_program_enrollments').upsert({
    program_id:id,member_id:memberId,active,expires_on:until||null,granted_by:m.id,updated_at:new Date().toISOString()
   },{onConflict:'program_id,member_id'});
   if(grantError)return reply(500,error(500,'Não foi possível registrar a matrícula.'));
   return reply(200,{id,memberId,active,expiresOn:until||null});
  }
  if(action==='my'){
   const {data:enrollments,error:enrollmentError}=await db.from('academy_program_enrollments')
    .select('program_id,active,expires_on').eq('member_id',m.id);
   if(enrollmentError)return reply(500,error(500,'Não foi possível consultar suas matrículas.'));
   const ids=(enrollments||[]).map(x=>x.program_id);
   if(!ids.length)return reply(200,{academies:[]});
   const {data:programs,error:queryError}=await db.from('academy_programs')
    .select('id,title,status,definition').in('id',ids).eq('status','published');
   if(queryError)return reply(500,error(500,'Não foi possível consultar suas Academias.'));
   const byId=new Map((enrollments||[]).map(x=>[x.program_id,x]));
   return reply(200,{academies:(programs||[]).map(p=>studentProjection(p,byId.get(p.id) as Json,m.display_name))});
  }
  return reply(400,error(400,'Operação não reconhecida.'));
 }catch(ex){
  console.error('academy-programs error',String(ex));
  return reply(500,error(500,'Não foi possível consultar as Academias. Tente novamente.'));
 }
});
