// The browser uses a publishable key. RLS and column grants enforce authorization.
(() => {
 class AcademyConflict extends Error {constructor(){super('Os dados mudaram em outro acesso. Exporte seu backup e recarregue os dados antes de continuar.');this.name='AcademyConflict';}}
 function create(client) {
  let identity=null;
  const unwrap=result=>{if(result.error)throw result.error;return result.data;};
  async function load(user) {
   let member=unwrap(await client.from('academy_members').select('*').eq('user_id',user.id).maybeSingle());
   if(!member)throw Error('Seu acesso à Academia ainda não foi liberado. Peça ao administrador que cadastre seu e-mail.');
   if(!member?.active)throw Error('Seu acesso à Academia está desativado.');
   const catalog=member.role==='admin'?unwrap(await client.from('academy_catalog').select('*').eq('id','main').single()):unwrap(await client.rpc('academy_my_catalog'));
   if(!catalog||!Array.isArray(catalog.courses))throw Error('Não foi possível carregar seus cursos.');
   let state=unwrap(await client.from('academy_learning_state').select('*').eq('member_id',member.id).maybeSingle());
   if(!state){
    const created=await client.from('academy_learning_state').insert({member_id:member.id,profile:{fullName:member.display_name,email:user.email||'',company:'',role:''}}).select('*').single();
    state=created.error?.code==='23505'?unwrap(await client.from('academy_learning_state').select('*').eq('member_id',member.id).single()):unwrap(created);
   }
   identity={user,member};
   return {user,member,catalog,state};
  }
  async function manage(action,body={}){
   if(identity?.member.role!=='admin'||identity.user.email?.toLowerCase()!=='vinicius.alves@irmen.com.br')throw Error('Acesso restrito ao administrador.');
   const result=await client.functions.invoke('academy-students',{body:{action,...body}});
   if(result.error){const data=await result.error.context?.json?.().catch(()=>null);throw Error(data?.error||'Não foi possível alterar o acesso.');}
   return result.data;
  }
  return {
   async signIn(email,password){const data=unwrap(await client.auth.signInWithPassword({email,password}));try{return await load(data.user);}catch(error){await client.auth.signOut({scope:'local'});throw error;}},
   async restore(){const data=unwrap(await client.auth.getUser());return data.user?load(data.user):null;},
   async reload(){if(!identity)throw Error('Entre novamente.');return load(identity.user);},
   async signOut(){const result=await client.auth.signOut({scope:'local'});if(result.error)throw result.error;identity=null;},
   async createStudent(name,email,password){return manage('create',{name,email,password});},
   async listStudents(){return manage('list');},
   async setCourseAccess(memberId,courseId,enabled){return manage('access',{memberId,courseId,enabled});},
   async setStudentActive(memberId,active){return manage('status',{memberId,active});},
   async writeCatalog(courses,revision){
    if(identity?.member.role!=='admin'||identity.user.email?.toLowerCase()!=='vinicius.alves@irmen.com.br')throw Error('Somente administradores da Academia podem alterar cursos.');
    const row=unwrap(await client.from('academy_catalog').update({courses}).eq('id','main').eq('revision',revision).select('*').maybeSingle());
    if(!row)throw new AcademyConflict();return row;
   },
   async writeState(state,revision){
    if(!identity)throw Error('Entre novamente.');
    const {profile,progress,certificates,activity}=state;
    const row=unwrap(await client.from('academy_learning_state').update({profile,progress,certificates,activity}).eq('member_id',identity.member.id).eq('revision',revision).select('*').maybeSingle());
    if(!row)throw new AcademyConflict();return row;
   }
  };
 }
 window.AcademyCloudService={create,AcademyConflict};
})();
