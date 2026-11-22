// The browser uses a publishable key. RLS and column grants enforce authorization.
(() => {
 'use strict';
 class AcademyConflict extends Error {constructor(){super('Os dados mudaram em outro acesso. Exporte seu backup e recarregue os dados antes de continuar.');this.name='AcademyConflict';}}
 function create(client,config=window.CONTREM_ACADEMY_CONFIG) {
  const connected=config?.mode==='connected';
  let identity=null,catalogCourses=[],generation=0;
  function clearIdentity(){generation++;identity=null;catalogCourses=[];return generation;}
  function current(version){if(version!==generation)throw Error('A sessão mudou. Entre novamente.');}
  const unwrap=result=>{if(result.error)throw result.error;return result.data;};
  const admin=()=>identity?.member.active===true&&identity.member.role==='admin'&&identity.user.email?.toLowerCase()==='vinicius.alves@irmen.com.br';
  // Client progress is self-reported learning history, never an exam result or certificate.
  function learningState(value){
   const profile=Object.fromEntries(['fullName','email','company','role'].map(key=>[key,String(value.profile?.[key]||'').slice(0,key==='email'?320:200)]));
   const progress={},activity={};
   for(const course of catalogCourses){
    const ids=new Set(course.lessons.map(lesson=>lesson.id));
    progress[course.id]=[...new Set((Array.isArray(value.progress?.[course.id])?value.progress[course.id]:[]).filter(id=>ids.has(id)))];
    const item=value.activity?.[course.id];
    if(item&&typeof item.lastOpenedAt==='string'&&Number.isFinite(Date.parse(item.lastOpenedAt)))activity[course.id]={lastOpenedAt:new Date(item.lastOpenedAt).toISOString(),lastLessonId:ids.has(item.lastLessonId)?item.lastLessonId:null};
   }
   return {profile,progress,activity};
  }
  async function load(user,version) {
   current(version);
   if(!user?.id)throw Error('Entre novamente.');
   const member=unwrap(await client.from('academy_members').select('*').eq('user_id',user.id).maybeSingle());
   current(version);
   if(!member)throw Error('Seu acesso à Academia ainda não foi liberado. Peça ao administrador que cadastre seu e-mail.');
   if(member.active!==true)throw Error('Seu acesso à Academia está desativado.');
   if(member.user_id!==user.id||!['admin','student'].includes(member.role)||(member.role==='admin'&&user.email?.toLowerCase()!=='vinicius.alves@irmen.com.br'))throw Error('Perfil de acesso inválido.');
   const catalog=member.role==='admin'?unwrap(await client.from('academy_catalog').select('*').eq('id','main').single()):unwrap(await client.rpc('academy_my_catalog'));
   current(version);
   if(!catalog||!Array.isArray(catalog.courses))throw Error('Não foi possível carregar seus cursos.');
   if(connected){
    catalog.courses=catalog.courses.filter(course=>course?.status==='published');
    if(catalog.courses.some(course=>!course||!Array.isArray(course.lessons)))throw Error('Catálogo indisponível.');
   }
   let state=unwrap(await client.from('academy_learning_state').select('*').eq('member_id',member.id).maybeSingle());
   if(!state){
    const created=await client.from('academy_learning_state').insert({member_id:member.id,profile:{fullName:member.display_name,email:user.email||'',company:'',role:''}}).select('*').single();
    state=created.error?.code==='23505'?unwrap(await client.from('academy_learning_state').select('*').eq('member_id',member.id).single()):unwrap(created);
   }
   current(version);
   if(state?.member_id!==member.id)throw Error('Estado de aprendizagem indisponível.');
   catalogCourses=catalog.courses;identity={user,member};
   return {user,member,catalog,state:connected?{...state,...learningState(state),certificates:[]}:state};
  }
  async function manage(action,body={}){
   if(!admin())throw Error('Acesso restrito ao administrador.');
   const result=await client.functions.invoke('academy-students',{body:{action,...body}});
   if(result.error){const data=await result.error.context?.json?.().catch(()=>null);throw Error(data?.error||'Não foi possível alterar o acesso.');}
   return result.data;
  }
  return {
   clearIdentity,
   async signIn(email,password){const version=clearIdentity();unwrap(await client.auth.signInWithPassword({email,password}));try{current(version);const verified=unwrap(await client.auth.getUser());return await load(verified.user,version);}catch(error){if(version===generation)await client.auth.signOut({scope:'local'});throw error;}},
   async restore(){const version=clearIdentity(),data=unwrap(await client.auth.getUser());current(version);return data.user?load(data.user,version):null;},
   async reload(){if(!identity)throw Error('Entre novamente.');const version=clearIdentity(),data=unwrap(await client.auth.getUser());return load(data.user,version);},
   async signOut(){clearIdentity();const result=await client.auth.signOut({scope:'local'});if(result.error)throw result.error;},
   async createStudent(name,email,password){return manage('create',{name,email,password});},
   async listStudents(){return manage('list');},
   async setCourseAccess(memberId,courseId,enabled){return manage('access',{memberId,courseId,enabled});},
   async setStudentActive(memberId,active){return manage('status',{memberId,active});},
   async writeCatalog(courses,revision){
    if(connected)throw Error('A autoria conectada aguarda integração segura. O catálogo não foi alterado.');
    if(!admin())throw Error('Somente administradores da Academia podem alterar cursos.');
    const row=unwrap(await client.from('academy_catalog').update({courses}).eq('id','main').eq('revision',revision).select('*').maybeSingle());
    if(!row)throw new AcademyConflict();return row;
   },
   async writeState(state,revision){
    if(!identity)throw Error('Entre novamente.');
    const {profile,progress,certificates,activity}=state;
    const value=connected?learningState(state):{profile,progress,certificates,activity};
    // The server merges only currently granted courses and preserves hidden history.
    const row=connected?unwrap(await client.rpc('academy_save_learning',{p_profile:value.profile,p_progress:value.progress,p_activity:value.activity,p_revision:revision})):unwrap(await client.from('academy_learning_state').update(value).eq('member_id',identity.member.id).eq('revision',revision).select('*').maybeSingle());
    if(!row)throw new AcademyConflict();return row;
   },
   async playback(videoId){
    if(!connected||!identity||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId||'')||!/^academy-[a-z0-9-]+$/.test(config.playbackFunction||''))throw Error('Vídeo indisponível.');
    const data=unwrap(await client.functions.invoke(config.playbackFunction,{body:{kind:'course',videoId}}));
    let url;try{url=new URL(data?.iframeUrl);}catch{throw Error('Resposta de vídeo inválida.');}
    if(data.provider!=='mux'||data.policy!=='signed'||url.protocol!=='https:'||url.hostname!=='player.mux.com'||url.port||url.username||url.password||url.hash||!/^\/[A-Za-z0-9_-]{8,255}$/.test(url.pathname)||!['playback-token','thumbnail-token','storyboard-token'].every(key=>/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(url.searchParams.get(key)||''))||!Number.isSafeInteger(data.expiresAt)||data.expiresAt*1000<=Date.now())throw Error('Vídeo privado indisponível.');
    return {iframeUrl:url.href,expiresAt:data.expiresAt};
   }
  };
 }
 window.AcademyCloudService={create,AcademyConflict};
})();
