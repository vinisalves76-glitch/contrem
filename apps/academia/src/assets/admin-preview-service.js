// Browser-only ADM workflow sandbox. This is deliberately not production authentication.
(() => {
 'use strict';
 const DB='contrem-adm-preview-db-v1', SESSION='contrem-adm-preview-session-v1';
 const ADMIN='00000000-0000-4000-8000-000000000001';
 const TEST_STUDENT='00000000-0000-4000-8000-000000000002';
 const TEST_COURSES=new Set(['qa-academia-single-v1','qa-academia-series-v1','qa-assessments-dynamic-v1']);
 const copy=x=>JSON.parse(JSON.stringify(x));
 const load=()=>{
  const db=JSON.parse(localStorage.getItem(DB)||'null')||{catalog:{courses:[],revision:0},students:[],states:{}};
  db.staff??=[];db.workspace??=copy(db.catalog);return db;
 };
 const commit=db=>localStorage.setItem(DB,JSON.stringify(db));
 const emailOf=x=>String(x||'').trim().toLowerCase();
 const emptyState=name=>({profile:{fullName:name,email:'',company:'',role:''},progress:{},certificates:[],activity:{},revision:0});
 function conflict(){const e=new Error('Os dados mudaram em outro acesso. Recarregue os dados antes de continuar.');e.name='AcademyConflict';throw e;}
 async function digest(password,salt){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:210000,salt:new TextEncoder().encode(salt)},key,256);
  return Array.from(new Uint8Array(bits),v=>v.toString(16).padStart(2,'0')).join('');
 }
 // Public sample used by the existing playback tests; repeated for workflow demonstration.
 const SAMPLE_PLAYBACK='hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500';
 function buildTestCourses(playback=SAMPLE_PLAYBACK){
  const definitions=[
   {id:'qa-academia-single-v1',name:'TESTE · Primeiro acesso',format:'single',hours:0.25,lessons:[['Conhecendo a sala de aula','Reproduza o vídeo, pause e retome. Marque esta aula como concluída e responda à prova abaixo.']]},
   {id:'qa-academia-series-v1',name:'TESTE · Jornada completa',format:'series',hours:0.75,lessons:[['Navegação entre aulas','Reproduza o vídeo e use Próxima aula. Confira se o título e a seleção acompanham a navegação.'],['Progresso e retorno','Marque esta aula como concluída. Saia, entre novamente e confira se o progresso permanece.'],['Prova e certificado','Conclua todas as aulas, responda à prova e confira os certificados demonstrativos de participação e aprovação.']]}
  ];
  const questionData=[
   ['Como registrar uma aula concluída?',['Fechar a aba','Marcar como concluída','Sair da conta','Recarregar a página'],1],
   ['Qual botão abre a aula seguinte?',['Próxima aula','Sair','Salvar perfil','Meus certificados'],0],
   ['Qual é a nota mínima desta prova de teste?',['25%','50%','100%','75%'],3],
   ['O que exige o certificado de aprovação?',['Somente entrar','Somente assistir uma aula','Concluir todas as aulas e ser aprovado na prova','Somente preencher o perfil'],2]
  ];
  return definitions.map(d=>({...d,category:'Validação do sistema',description:'Conteúdo fictício para testar a plataforma. Vídeo público de exemplo Mux repetido nas aulas; não constitui treinamento técnico validado.',icon:'🧪',status:'published',passScore:75,lessons:d.lessons.map(([name,description],i)=>({id:d.id+'-lesson-'+(i+1),name,description,minutes:15,url:'https://player.mux.com/'+playback,materialTitle:'',materialUrl:''})),questions:questionData.map(([text,choices,correct],i)=>({id:d.id+'-q-'+i,text,choices:[...choices],correct}))}));
 }
 function create(){
  let current=null;
  function admin(){if(current!==ADMIN)throw Error('Acesso restrito ao ADM Master da prévia.');}
  function editor(){const db=load();if(current!==ADMIN&&!db.staff.some(s=>s.id===current&&s.active&&!s.inviteHash))throw Error('Acesso restrito ao editor de conteúdo.');}
  function enrollment(){editor();}
  function data(id){
   const db=load(),isAdmin=id===ADMIN,staff=db.staff.find(s=>s.id===id),student=db.students.find(s=>s.id===id),isEditor=isAdmin||!!staff;
   if(!isAdmin&&(!(staff||student)||(staff||student).active!==true))throw Error('Seu acesso à Academia está desativado.');
   const name=isAdmin?'Administrador · prévia':(staff||student).name;
   const allowed=new Set(isEditor?db.workspace.courses.map(c=>c.id):student.courses);
   const catalog=isEditor?db.workspace.courses:db.catalog.courses.filter(c=>allowed.has(c.id)&&c.status==='published');
   const state=copy(db.states[id]||emptyState(name));
   const visible=new Set(catalog.map(c=>c.id));
   state.progress=Object.fromEntries(Object.entries(state.progress).filter(([k])=>visible.has(k.replace(/^assessment:/,''))));
   state.activity=Object.fromEntries(Object.entries(state.activity).filter(([k])=>visible.has(k)));
   state.certificates=state.certificates.filter(c=>visible.has(c.courseId));
   current=id;sessionStorage.setItem(SESSION,id);
   return {user:{id,email:isAdmin?'vinicius.alves@irmen.com.br':(staff||student).email},member:{id,role:isAdmin?'admin':isEditor?'content_admin':'student',display_name:name,active:true},catalog:{courses:copy(catalog),revision:isEditor?db.workspace.revision:db.catalog.revision},state};
  }
  return {
   async startAdmin(){return data(ADMIN);},
   async startTestStudent(){
    // Explicit entry into a fictitious local account; never calls production Auth.
    const salt=crypto.randomUUID(),passwordHash=await digest(crypto.randomUUID(),salt),db=load();
    const additions=[...buildTestCourses(),...(window.AcademyAssessmentDemo?[window.AcademyAssessmentDemo.build()]:[])].filter(c=>!db.catalog.courses.some(existing=>existing.id===c.id));
    if(additions.length){
     db.catalog.courses.push(...additions);db.catalog.revision+=1;
     const missing=additions.filter(c=>!db.workspace.courses.some(existing=>existing.id===c.id));
     if(missing.length){db.workspace.courses.push(...missing);db.workspace.revision+=1;}
    }
    let student=db.students.find(s=>s.id===TEST_STUDENT);
    if(!student){student={id:TEST_STUDENT,name:'Aluno de teste',email:'aluno-teste@academia.example.invalid',active:true,courses:[],salt,passwordHash};db.students.push(student);}
    student.active=true;
    student.courses=db.catalog.courses.filter(c=>TEST_COURSES.has(c.id)&&c.status==='published').map(c=>c.id);
    commit(db);return data(TEST_STUDENT);
   },
   async signIn(email,password){
    const db=load(),person=[...db.students,...db.staff].find(s=>s.email===emailOf(email));
    if(!person||!person.passwordHash||await digest(password,person.salt)!==person.passwordHash){const e=new Error('Confira o e-mail e a senha de teste.');e.code='invalid_credentials';throw e;}
    return data(person.id);
   },
   async inviteContentAdmin(name,email){
    admin();name=String(name||'').trim();email=emailOf(email);
    if(name.length<2||name.length>100||!/^\S+@\S+\.\S+$/.test(email)||email.length>254)throw Error('Informe nome e e-mail válidos.');
    const db=load();if(db.staff.some(s=>s.email===email)||db.students.some(s=>s.email===email)||email==='vinicius.alves@irmen.com.br')throw Error('Já existe um cadastro com este e-mail.');
    const token=crypto.randomUUID()+crypto.randomUUID(),salt=crypto.randomUUID();
    db.staff.push({id:crypto.randomUUID(),name,email,salt,inviteHash:await digest(token,salt),expiresAt:Date.now()+7*86400000,passwordHash:null,active:false});
    commit(db);return {name,email,token,expiresInDays:7};
   },
   async acceptContentInvite(token,password){
    if(typeof token!=='string'||!/^[0-9a-f-]{72}$/i.test(token)||typeof password!=='string'||password.length<8||password.length>128)throw Error('Convite ou senha inválidos.');
    const db=load(),invited=db.staff.filter(s=>s.inviteHash&&s.expiresAt>Date.now());
    for(const person of invited){
     if(await digest(token,person.salt)!==person.inviteHash)continue;
     person.passwordHash=await digest(password,person.salt);person.inviteHash=null;person.active=true;delete person.expiresAt;commit(db);return data(person.id);
    }
    throw Error('Convite expirado, já utilizado ou inválido.');
   },
   async listStaff(){admin();return load().staff.map(s=>({id:s.id,name:s.name,email:s.email,active:s.active,invited:!!s.inviteHash}));},
   async setStaffActive(id,active){admin();const db=load(),s=db.staff.find(s=>s.id===id);if(!s)throw Error('Funcionário não encontrado.');s.active=active===true&&!s.inviteHash;commit(db);return {id,active:s.active};},
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
    enrollment();const db=load();
    return {members:db.students.map(s=>({id:s.id,display_name:s.name,email:s.email,active:s.active})),grants:db.students.flatMap(s=>s.courses.map(id=>({member_id:s.id,course_id:id})))};
   },
   async setCourseAccess(memberId,courseId,enabled){
    enrollment();const db=load(),s=db.students.find(s=>s.id===memberId);
    if(!s||!s.active||!db.catalog.courses.some(c=>c.id===courseId))throw Error('Aluno ou curso indisponível.');
    if(current!==ADMIN&&!db.catalog.courses.some(c=>c.id===courseId&&c.status==='published'))throw Error('O ADM de Conteúdo só pode liberar matrículas de cursos publicados.');
    s.courses=enabled?[...new Set([...s.courses,courseId])]:s.courses.filter(id=>id!==courseId);commit(db);
   },
   async setStudentActive(id,active){admin();const db=load(),s=db.students.find(s=>s.id===id);if(!s)throw Error('Aluno não encontrado.');s.active=active;commit(db);},
   async writeCatalog(courses,revision){
    editor();const db=load();if(db.workspace.revision!==revision)conflict();
    if(!Array.isArray(courses))throw Error('Catálogo inválido.');
    const ids=new Set(courses.map(c=>c.id));if(ids.size!==courses.length)throw Error('Curso duplicado.');
    if(current!==ADMIN){
     for(const before of db.workspace.courses){
      const after=courses.find(c=>c.id===before.id);
      if(!after)throw Error('O ADM de Conteúdo não pode excluir cursos.');
      for(const lesson of before.lessons||[])if(!(after.lessons||[]).some(l=>l.id===lesson.id))throw Error('O ADM de Conteúdo não pode excluir aulas.');
      if(after.status==='published'&&JSON.stringify(after)!==JSON.stringify(before))throw Error('Alterações de cursos publicados precisam ser salvas como rascunho para aprovação do ADM Master.');
     }
     for(const course of courses)if(!db.workspace.courses.some(c=>c.id===course.id)&&course.status==='published')throw Error('Somente o ADM Master publica cursos.');
    }
    db.workspace={courses:copy(courses),revision:revision+1};
    if(current===ADMIN)db.catalog={courses:copy(courses),revision:db.catalog.revision+1};
    commit(db);return copy(db.workspace);
   },
   async writeState(value,revision){
    if(!current)throw Error('Entre novamente.');
    const db=load(),previous=db.states[current]||emptyState('');
    if(current!==ADMIN&&![...db.students,...db.staff].some(s=>s.id===current&&s.active))throw Error('Seu acesso à Academia está desativado.');
    if(previous.revision!==revision)conflict();
    db.states[current]={profile:copy(value.profile),progress:{...previous.progress,...copy(value.progress)},certificates:copy(value.certificates),activity:{...previous.activity,...copy(value.activity)},revision:revision+1};
    commit(db);return copy(db.states[current]);
   }
  };
 }
 window.AcademyAdminPreviewService={create,buildTestCourses};
})();
