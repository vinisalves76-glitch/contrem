'use strict';
// Execute with: node --test apps/academia/tests/qa-academy-programs.cjs
// Preview-only domain tests; never connect to actual Supabase or Auth.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const assets=path.join(__dirname,'..','src','assets');
let counter=0;
function setup(){
 const mem=new Map(),storage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
 const crypto={randomUUID:()=>`00000000-0000-4000-8000-${String(++counter).padStart(12,'0')}`};
 const win={CONTREM_ACADEMY_CONFIG:{preview:true}},context=vm.createContext({window:win,localStorage:storage,crypto,Date,URL,Set,Map,Array,JSON,Number,String,Object,Error,RegExp});
 for(const name of ['academy-program-core.js','academy-program-store.js'])vm.runInContext(fs.readFileSync(path.join(assets,name),'utf8'),context,{filename:name});
 const courses=['m1','m2'].map(id=>({id,academyId:'program',catalogType:'academy_module',status:'published',hours:1,
   lessons:[{id:id+'-l1',name:'Aula',url:'https://player.mux.com/hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500'}],
   questions:[{id:id+'-q',text:'Questão',choices:['A','B'],correct:0}],passScore:75}));
 const id='00000000-0000-4000-8000-000000000004',master='00000000-0000-4000-8000-000000000001';
 const db={catalog:{courses,revision:0},students:[{id,name:'Aluno de teste',email:'aluno@example.invalid',active:true,courses:[]}],states:{[id]:{progress:{},revision:0}}};
 const persist=()=>storage.setItem('contrem-adm-preview-db-v1',JSON.stringify(db));
 const asAdmin=()=>{win.AcademySession={role:'admin',preview:true,userId:master};win.CONTREM_PROGRAM_COURSE_ACCESS=()=>courses;};
 const asStudent=()=>{win.AcademySession={role:'student',preview:true,userId:id};win.CONTREM_PROGRAM_STATE_ACCESS=()=>db.states[id];};
 asAdmin();persist();
 const store=win.CONTREM_PROGRAM_STORE,core=win.CONTREM_PROGRAM_CORE;
 const create=()=>store.upsert({id:'program',title:'Academia de teste',certificateEnabled:true,stages:[{id:'e1',title:'Fundamentos',moduleIds:['m1','m2']}]});
 return {storage,win,store,core,courses,id,db,asAdmin,asStudent,create,persist};
}
test('Cursos avulsos não podem ser inseridos como módulos, e módulos são exclusivos',()=>{
 const s=setup();s.courses[0].catalogType='standalone';assert.throws(()=>s.create(),/exclusivamente/);
 s.courses[0].catalogType='academy_module';s.create();assert.throws(()=>s.store.upsert({title:'Outra Academia',stages:[{id:'e',title:'Básico',moduleIds:['m1']}]}),/exclusivamente|vinculado/);
});
test('Academia pode ser publicada com todos os módulos inativos e sem vídeos',()=>{
 const s=setup();s.create();
 s.courses.forEach(c=>{c.status='draft';c.moduleEnabled=false;c.lessons[0].url='';c.questions=[];});s.persist();
 assert.equal(s.store.setStatus('program','published').status,'published');
 s.store.enroll(s.id,'program',true,'','manual');s.asStudent();
 const map=s.store.studentPrograms().items[0].map;
 assert.equal(map.items.length,2);
 assert.equal(map.items[0].status,'inactive');
 assert.equal(map.items[0].canOpen,false);
 assert.equal(s.store.accessibleCourseIds(s.id,s.courses,s.db.states[s.id]).length,0);
});
test('Matrícula idempotente, bloqueio sequencial, reprovação e retake do Master',()=>{
 const s=setup();s.create();s.store.setStatus('program','published');
 s.store.enroll(s.id,'program',true,'','manual');s.store.enroll(s.id,'program',true,'','manual');
 assert.equal(s.store.list().enrollments.length,1);
 s.asStudent();assert.deepEqual(Array.from(s.store.accessibleCourseIds(s.id,s.courses,s.db.states[s.id])),['m1']);
 assert.equal(s.store.canAttempt('m1').allowed,false);
 s.db.states[s.id].progress.m1=['m1-l1'];s.db.states[s.id].progress['video-watched:m1']=['m1-l1'];s.persist();
 assert.equal(s.store.canAttempt('m1').allowed,true);
 s.store.consumeRetry('m1');
 s.db.states[s.id].progress['assessment:m1']=[{passed:false,score:0,at:new Date().toISOString()}];s.persist();
 assert.equal(s.store.canAttempt('m1').allowed,false);
 const req=s.store.requestRetake('m1');
 assert.throws(()=>s.store.requestRetake('m1'),/Já existe/);
 assert.equal(s.store.canAttempt('m1').allowed,false);
 s.asAdmin();s.store.reviewRetake(req.id,true);
 s.asStudent();assert.equal(s.store.canAttempt('m1').allowed,true);assert.equal(s.store.consumeRetry('m1'),true);
 assert.equal(s.store.canAttempt('m1').allowed,false);
 s.db.states[s.id].progress['assessment:m1'].push({passed:true,score:100,at:new Date().toISOString()});s.persist();
 assert.deepEqual(Array.from(s.store.accessibleCourseIds(s.id,s.courses,s.db.states[s.id])),['m1','m2']);
});
test('Uma atividade de aula pendente bloqueia a próxima aula e a aprovação do módulo',()=>{
 const s=setup();s.courses[0].lessons.push({id:'m1-l2',name:'Aula 2',url:'https://player.mux.com/hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500'});
 s.courses[0].lessons[0].questions=[{id:'q1',text:'Teste',choices:['A','B'],correct:0}];
 s.create();s.store.setStatus('program','published');s.store.enroll(s.id,'program',true);
 s.db.states[s.id].progress.m1=['m1-l1'];s.db.states[s.id].progress['video-watched:m1']=['m1-l1'];s.persist();
 s.asStudent();assert.equal(s.core.nextLessonIndex(s.courses[0],s.db.states[s.id]),0);
 s.db.states[s.id].progress['lesson-assessment:m1:m1-l1']=[{passed:true}];s.persist();
 assert.equal(s.core.nextLessonIndex(s.courses[0],s.db.states[s.id]),1);
 assert.equal(s.core.lessonDone(s.courses[0],s.db.states[s.id]),false);
 s.db.states[s.id].progress.m1=['m1-l1','m1-l2'];s.db.states[s.id].progress['video-watched:m1']=['m1-l1','m1-l2'];s.persist();
 assert.equal(s.store.canAttempt('m1').allowed,true);
});
test('Emissão final configurável, sem certificado duplicado e sem acesso vencido',()=>{
 const s=setup();s.create();s.store.setStatus('program','published');s.store.enroll(s.id,'program',true,'','manual');
 s.db.states[s.id].progress.m1=['m1-l1'];s.db.states[s.id].progress.m2=['m2-l1'];
 s.db.states[s.id].progress['video-watched:m1']=['m1-l1'];s.db.states[s.id].progress['video-watched:m2']=['m2-l1'];
 s.db.states[s.id].progress['assessment:m1']=[{passed:true,score:100}];
 s.db.states[s.id].progress['assessment:m2']=[{passed:true,score:100}];s.persist();
 s.asStudent();const one=s.store.issueCertificate('program');const again=s.store.issueCertificate('program');
 assert.equal(one.id,again.id);assert.equal(one.hours,2);assert.equal(one.demo,true);
 s.asAdmin();s.store.enroll(s.id,'program',false);s.asStudent();
 assert.equal(s.store.accessibleCourseIds(s.id,s.courses,s.db.states[s.id]).length,0);
 assert.equal(s.store.studentPrograms().certificates.length,1);
});
test('Edição e arquivamento de programa publicado com matrícula ativa são bloqueados',()=>{
 const s=setup();s.create();s.store.setStatus('program','published');s.store.enroll(s.id,'program',true);
 assert.throws(()=>s.store.upsert({...s.store.getPrograms()[0],title:'Novo nome'}),/versionamento/);
 assert.throws(()=>s.store.setStatus('program','archived'),/matrículas ativas/);
});
