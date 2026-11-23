/* Browser-only program registry for the isolated CONTREM preview.
   Do NOT use this module as an authentication, payment or certificate server. */
(() => {
 'use strict';
 if(window.CONTREM_ACADEMY_CONFIG?.preview!==true)return;
 const KEY='contrem-academia-programs-preview-v1',COURSES='contrem-adm-preview-db-v1';
 const core=window.CONTREM_PROGRAM_CORE;
 const blank=()=>({version:1,academies:[],enrollments:[],requests:[],certificates:[],audit:[]});
 const load=()=>{try{const value=JSON.parse(localStorage.getItem(KEY)||'null');return value&&Array.isArray(value.academies)?value:blank();}catch{return blank();}};
 const write=data=>localStorage.setItem(KEY,JSON.stringify(data));
 const courseDb=()=>{try{return JSON.parse(localStorage.getItem(COURSES)||'null')||{catalog:{courses:[]},students:[],states:{}};}catch{return {catalog:{courses:[]},students:[],states:{}};}};
 const user=()=>window.AcademySession;
 const admin=()=>{if(user()?.role!=='admin'||!user().preview)throw Error('Apenas o ADM Master de teste pode alterar acessos e publicações.');};
 const student=()=>{if(user()?.role!=='student'||!user().preview)throw Error('Entre como aluno de teste.');return user().userId;};
 const log=(data,verb,record)=>data.audit.push({verb,record,at:new Date().toISOString(),actor:user()?.userId||'none'});
 const students=()=>courseDb().students.map(s=>({id:s.id,name:s.name,email:s.email,active:s.active}));
 const courses=()=>user()?.role==='admin'&&typeof window.CONTREM_PROGRAM_COURSE_ACCESS==='function'?window.CONTREM_PROGRAM_COURSE_ACCESS():courseDb().catalog.courses||[];
 const uniqueId=prefix=>prefix+'-'+crypto.randomUUID();
 const learningState=(id,db)=>id===user()?.userId&&user()?.role==='student'&&typeof window.CONTREM_PROGRAM_STATE_ACCESS==='function'?window.CONTREM_PROGRAM_STATE_ACCESS():(db.states[id]||{progress:{}});
 function upsert(value){
  admin();const data=load(),existing=data.academies.find(a=>a.id===value.id);
  const cover=String(value.cover||'').trim();
  const isDataImage=/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(cover);
  if(cover.length>1400000||(cover&&!isDataImage&&!cover.startsWith('https://')))
   throw Error('Imagem de capa inválida ou muito grande. Use JPG, PNG ou WebP de até 900 KB.');
  const a={id:value.id||uniqueId('academy'),title:String(value.title||'').trim(),description:String(value.description||'').trim().slice(0,4000),
   audience:String(value.audience||'').trim().slice(0,500),objectives:String(value.objectives||'').trim().slice(0,1200),
   heroKicker:String(value.heroKicker||'').trim().slice(0,160),
   heroTitle:String(value.heroTitle||'').trim().slice(0,180),
   heroHighlight:String(value.heroHighlight||'').trim().slice(0,80),
   heroDescription:String(value.heroDescription||'').trim().slice(0,600),
   stageHeading:String(value.stageHeading||'').trim().slice(0,130),
   cover,price:Number(value.price)||0,
   certificateEnabled:!!value.certificateEnabled,stages:core.copy(value.stages||[]),
   status:existing?.status||'draft',createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(a.price<0||a.price>10000000)throw Error('Preço inválido.');
  core.guardProgram(a,courses(),data.academies,a.id);
  if(existing){if(existing.status==='archived')throw Error('Formação arquivada não pode ser editada.');
   if(existing.status==='published'&&data.enrollments.some(e=>e.academyId===existing.id&&e.active))throw Error('Esta Academia possui matrículas ativas. A edição exige versionamento de conteúdo para preservar o progresso dos alunos.');
   a.status='draft';data.academies[data.academies.findIndex(x=>x.id===a.id)]=a;
  }else data.academies.push(a);
  log(data,'save-academy',a.id);write(data);return core.copy(a);
 }
 function setStatus(id,status){
  admin();if(!['draft','published','archived'].includes(status))throw Error('Estado inválido.');
  const data=load(),a=data.academies.find(a=>a.id===id);
  if(!a)throw Error('Academia não encontrada.');
  if(status!=='published'&&data.enrollments.some(e=>e.academyId===id&&e.active))throw Error('A Academia possui matrículas ativas. Não é seguro despublicar ou arquivar sem tratar os acessos.');
  if(status==='published'){core.guardProgram(a,courses(),data.academies,id);const problem=core.publishReady(a,courses());if(problem)throw Error(problem);}
  a.status=status;a.updatedAt=new Date().toISOString();log(data,'academy-'+status,id);write(data);return core.copy(a);
 }
 function enroll(studentId,academyId,enabled,validUntil='',source='manual'){
  admin();const data=load(),person=students().find(s=>s.id===studentId&&s.active),academy=data.academies.find(a=>a.id===academyId);
  if(!person||!academy)throw Error('Aluno ou Academia não encontrado.');
  if(enabled&&academy.status!=='published')throw Error('Publique primeiro a Academia para liberar acesso.');
  if(enabled&&validUntil&&(!core.validDate(validUntil)||validUntil<core.today()))throw Error('Data de validade inválida ou expirada.');
  if(!['manual','venda_externa','cortesia','convenio'].includes(source))throw Error('Origem de matrícula inválida.');
  let e=data.enrollments.find(e=>e.studentId===studentId&&e.academyId===academyId);
  if(e){e.active=!!enabled;e.validUntil=enabled?validUntil||null:e.validUntil;e.source=enabled?source:e.source;e.updatedAt=new Date().toISOString();e.revokedAt=enabled?null:e.updatedAt;}
  else if(enabled){e={id:uniqueId('matricula'),studentId,academyId,active:true,validUntil:validUntil||null,source,
   grantedBy:user().userId,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),revokedAt:null};data.enrollments.push(e);}
  log(data,enabled?'grant-academy':'revoke-academy',studentId+':'+academyId);write(data);
  return e?core.copy(e):null;
 }
 function studentPrograms(id=student()){
  const data=load(),db=courseDb(),state=learningState(id,db);
  return {items:data.enrollments.filter(e=>e.studentId===id).map(e=>{
    const a=data.academies.find(a=>a.id===e.academyId);
    if(!a||a.status!=='published')return null;
    return {academy:core.copy(a),enrollment:core.copy(e),
      map:core.programState(a,db.catalog.courses,state,e,data.requests,id)};
   }).filter(Boolean),certificates:data.certificates.filter(c=>c.studentId===id).map(core.copy)};
 }
 function accessibleCourseIds(id,allCourses,state){
  const data=load(),accessible=new Set();
  for(const e of data.enrollments.filter(e=>e.studentId===id&&core.activeEnrollment(e))){
   const a=data.academies.find(a=>a.id===e.academyId&&a.status==='published');
   if(!a)continue;
   for(const item of core.buildMap(a,allCourses,state,e,data.requests,id)){
    if(item.canOpen&&allCourses.some(c=>c.id===item.id&&c.status==='published'))accessible.add(item.id);
   }
  }
  return [...accessible];
 }
 function enrollmentFor(id,academyId){return load().enrollments.find(e=>e.studentId===id&&e.academyId===academyId);}
 function requestRetake(courseId){
  const id=student(),db=courseDb(),allCourses=db.catalog.courses||[],
   course=allCourses.find(c=>c.id===courseId&&c.academyId),data=load(),
   a=course&&data.academies.find(a=>a.id===course.academyId&&a.status==='published'),
   e=a&&data.enrollments.find(e=>e.studentId===id&&e.academyId===a.id),state=learningState(id,db);
  if(!a||!core.activeEnrollment(e))throw Error('Matrícula não permite esta ação.');
  const current=core.buildMap(a,allCourses,state,e,data.requests,id).find(m=>m.id===courseId);
  if(!current?.canOpen)throw Error('O módulo está bloqueado.');
  const attempts=core.attempts(courseId,state);
  if(!attempts.length||attempts.some(x=>x.passed))throw Error('Não existe reprovação pendente de nova tentativa.');
  const forAttempt=attempts.length+1,existing=data.requests.find(r=>r.studentId===id&&r.courseId===courseId&&r.forAttempt===forAttempt&&['pending','approved','used'].includes(r.status));
  if(existing)throw Error('Já existe solicitação ou liberação para esta tentativa.');
  const r={id:uniqueId('retake'),studentId:id,academyId:a.id,courseId,forAttempt,status:'pending',createdAt:new Date().toISOString()};
  data.requests.push(r);log(data,'request-retake',r.id);write(data);return core.copy(r);
 }
 function reviewRetake(requestId,allowed){
  admin();const data=load(),r=data.requests.find(r=>r.id===requestId&&r.status==='pending');
  if(!r)throw Error('Solicitação indisponível.');r.status=allowed?'approved':'rejected';
  r.decidedAt=new Date().toISOString();r.decidedBy=user().userId;
  log(data,'review-retake',requestId+':'+r.status);write(data);return core.copy(r);
 }
 function canAttempt(courseId){
  const id=student(),db=courseDb(),allCourses=db.catalog.courses||[],
   course=allCourses.find(c=>c.id===courseId&&c.academyId),data=load(),
   a=course&&data.academies.find(a=>a.id===course.academyId&&a.status==='published'),
   e=a&&data.enrollments.find(e=>e.studentId===id&&e.academyId===a.id),state=learningState(id,db);
  if(!a||!core.activeEnrollment(e))return {allowed:false,reason:'Matrícula expirada ou indisponível.'};
  if(!core.buildMap(a,allCourses,state,e,data.requests,id).some(m=>m.id===courseId&&m.canOpen))return {allowed:false,reason:'Módulo bloqueado.'};
  return core.eligibleExam(course,state,data.requests,id);
 }
 function consumeRetry(courseId){
  const decision=canAttempt(courseId);if(!decision.allowed)throw Error(decision.reason);
  if(decision.initial)return true;
  const id=student(),db=courseDb(),history=core.attempts(courseId,db.states[id]||{progress:{}}),
   data=load(),r=data.requests.find(r=>r.studentId===id&&r.courseId===courseId&&r.forAttempt===history.length+1&&r.status==='approved');
  if(!r)throw Error('Nova tentativa sem autorização.');
  r.status='used';r.usedAt=new Date().toISOString();log(data,'consume-retry',r.id);write(data);return true;
 }
 function issueCertificate(academyId){
  const id=student(),db=courseDb(),data=load(),a=data.academies.find(a=>a.id===academyId&&a.status==='published'),
   e=a&&data.enrollments.find(e=>e.studentId===id&&e.academyId===academyId);
  if(!a?.certificateEnabled||!core.activeEnrollment(e))throw Error('Certificado desabilitado ou matrícula inativa.');
  if(!core.programState(a,db.catalog.courses,db.states[id]||{progress:{}},e,data.requests,id).completed)throw Error('Conclua as aulas e avaliações de todos os módulos.');
  const existing=data.certificates.find(c=>c.studentId===id&&c.academyId===academyId);
  if(existing)return core.copy(existing);
  const person=db.students.find(s=>s.id===id),hours=core.moduleIds(a).reduce((n,k)=>n+Number(db.catalog.courses.find(c=>c.id===k)?.hours||0),0);
  const c={id:uniqueId('certificado'),studentId:id,academyId,name:person?.name||'Aluno',title:a.title,hours,mode:'100% online',issuedAt:new Date().toISOString(),code:'DEMO-'+crypto.randomUUID().slice(0,8).toUpperCase(),demo:true};
  data.certificates.push(c);log(data,'certificate',c.id);write(data);return core.copy(c);
 }
 const api={list(){admin();const d=load();return {...d,students:students()};},
  getPrograms(){return core.copy(load().academies);},upsert,setStatus,enroll,studentPrograms,accessibleCourseIds,enrollmentFor,requestRetake,reviewRetake,canAttempt,consumeRetry,issueCertificate};
 window.CONTREM_PROGRAM_STORE=api;
})();
