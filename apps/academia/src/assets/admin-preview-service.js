// Browser-only ADM workflow sandbox. This is deliberately not production authentication.
(() => {
 'use strict';
 const DB='contrem-adm-preview-db-v1', SESSION='contrem-adm-preview-session-v1';
 const ADMIN='00000000-0000-4000-8000-000000000001';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const load=()=>JSON.parse(localStorage.getItem(DB)||'null')||{catalog:{courses:[],revision:0},students:[],states:{}};
 const commit=db=>localStorage.setItem(DB,JSON.stringify(db));
 const emailOf=x=>String(x||'').trim().toLowerCase();
 const emptyState=name=>({profile:{fullName:name,email:'',company:'',role:''},progress:{},certificates:[],activity:{},revision:0});
 function conflict(){const e=new Error('Os dados mudaram em outro acesso. Recarregue os dados antes de continuar.');e.name='AcademyConflict';throw e;}
 async function digest(password,salt){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:210000,salt:new TextEncoder().encode(salt)},key,256);
  return Array.from(new Uint8Array(bits),v=>v.toString(16).padStart(2,'0')).join('');
 }
 function create(){
  let current=null;
  function admin(){if(current!==ADMIN)throw Error('Acesso restrito ao administrador da prévia.');}
  function data(id){
   const db=load(),isAdmin=id===ADMIN,student=db.students.find(s=>s.id===id);
   if(!isAdmin&&(!student||!student.active))throw Error('Seu acesso à Academia está desativado.');
   const name=isAdmin?'Administrador · prévia':student.name;
   const allowed=new Set(isAdmin?db.catalog.courses.map(c=>c.id):student.courses);
   const catalog=isAdmin?db.catalog.courses:db.catalog.courses.filter(c=>allowed.has(c.id)&&c.status==='published');
   const state=copy(db.states[id]||emptyState(name));
   const visible=new Set(catalog.map(c=>c.id));
   state.progress=Object.fromEntries(Object.entries(state.progress).filter(([k])=>visible.has(k.replace(/^assessment:/,''))));
   state.activity=Object.fromEntries(Object.entries(state.activity).filter(([k])=>visible.has(k)));
   state.certificates=state.certificates.filter(c=>visible.has(c.courseId));
   current=id;sessionStorage.setItem(SESSION,id);
   return {user:{id,email:isAdmin?'vinicius.alves@irmen.com.br':student.email},member:{id,role:isAdmin?'admin':'student',display_name:name,active:true},catalog:{courses:copy(catalog),revision:db.catalog.revision},state};
  }
  return {
   async startAdmin(){return data(ADMIN);},
   async signIn(email,password){
    const student=load().students.find(s=>s.email===emailOf(email));
    if(!student||await digest(password,student.salt)!==student.passwordHash){const e=new Error('Confira o e-mail e a senha de teste.');e.code='invalid_credentials';throw e;}
    return data(student.id);
   },
   async restore(){const id=sessionStorage.getItem(SESSION);return id?data(id):null;},
   async reload(){if(!current)throw Error('Entre novamente.');return data(current);},
   async signOut(){current=null;sessionStorage.removeItem(SESSION);},
   async createStudent(name,email,password){
    admin();email=emailOf(email);name=String(name).trim();
    if(name.length<2||name.length>100||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<8)throw Error('Informe nome, e-mail válido e senha com pelo menos 8 caracteres.');
    if(email==='vinicius.alves@irmen.com.br')throw Error('Use um e-mail fictício diferente da conta administrativa.');
    const salt=crypto.randomUUID(),passwordHash=await digest(password,salt),db=load();
    admin();if(db.students.some(s=>s.email===email))throw Error('Já existe um aluno de teste com esse e-mail.');
    db.students.push({id:crypto.randomUUID(),name,email,active:true,courses:[],salt,passwordHash});commit(db);return {name};
   },
   async listStudents(){
    admin();const db=load();
    return {members:db.students.map(s=>({id:s.id,display_name:s.name,email:s.email,active:s.active})),grants:db.students.flatMap(s=>s.courses.map(id=>({member_id:s.id,course_id:id})))};
   },
   async setCourseAccess(memberId,courseId,enabled){
    admin();const db=load(),s=db.students.find(s=>s.id===memberId);
    if(!s||!s.active||!db.catalog.courses.some(c=>c.id===courseId))throw Error('Aluno ou curso indisponível.');
    s.courses=enabled?[...new Set([...s.courses,courseId])]:s.courses.filter(id=>id!==courseId);commit(db);
   },
   async setStudentActive(id,active){admin();const db=load(),s=db.students.find(s=>s.id===id);if(!s)throw Error('Aluno não encontrado.');s.active=active;commit(db);},
   async writeCatalog(courses,revision){
    admin();const db=load();if(db.catalog.revision!==revision)conflict();
    db.catalog={courses:copy(courses),revision:revision+1};commit(db);return copy(db.catalog);
   },
   async writeState(value,revision){
    if(!current)throw Error('Entre novamente.');
    const db=load(),previous=db.states[current]||emptyState('');
    if(current!==ADMIN&&!db.students.some(s=>s.id===current&&s.active))throw Error('Seu acesso à Academia está desativado.');
    if(previous.revision!==revision)conflict();
    db.states[current]={profile:copy(value.profile),progress:{...previous.progress,...copy(value.progress)},certificates:copy(value.certificates),activity:{...previous.activity,...copy(value.activity)},revision:revision+1};
    commit(db);return copy(db.states[current]);
   }
  };
 }
 window.AcademyAdminPreviewService={create};
})();
