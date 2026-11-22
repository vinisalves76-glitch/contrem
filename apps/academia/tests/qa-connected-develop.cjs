// Integration in an emulated DOM: these are not browser/visual QA results.
const {parseHTML}=require('linkedom');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const html=fs.readFileSync('src/index.html','utf8');
const {document,window:dom}=parseHTML(html);
const memory=new Map(),session=new Map();
const mediaMemory=new Map();
const indexedDB={open(){const request={},db={objectStoreNames:{contains:()=>true},createObjectStore(){},transaction(){const tx={objectStore(){return {put(record){queueMicrotask(()=>{mediaMemory.set(record.id,record);tx.oncomplete?.();});},get(id){const result={};queueMicrotask(()=>{result.result=mediaMemory.get(id);result.onsuccess?.();});return result;},delete(id){queueMicrotask(()=>{mediaMemory.delete(id);tx.oncomplete?.();});}};}};return tx;}};queueMicrotask(()=>{request.result=db;request.onsuccess?.();});return request;}};
const storage=map=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)});
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(value){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.value===String(value));},configurable:true});
dom.HTMLElement.prototype.reset=function(){this.querySelectorAll('input,textarea').forEach(el=>el.value=el.getAttribute('value')||'');};
dom.HTMLElement.prototype.scrollIntoView=()=>{};
const windowEvents=new Map();let allowDiscard=true;
const context={document,localStorage:storage(memory),sessionStorage:storage(session),crypto:webcrypto,TextEncoder,URL,Blob,indexedDB,console,MutationObserver:dom.MutationObserver,navigator:{onLine:true},matchMedia:()=>({matches:false}),scrollTo:()=>{},alert:text=>{throw Error('Unexpected alert: '+text);},confirm:()=>allowDiscard,setTimeout,clearTimeout,queueMicrotask,addEventListener:(name,fn)=>{windowEvents.set(name,fn);}};
context.window=context;vm.createContext(context);
const run=code=>vm.runInContext(code,context);
const asset=name=>run(fs.readFileSync('src/assets/'+name,'utf8'));

asset('cloud-store.js');
for(const code of html.matchAll(/<script>([\s\S]*?)<\/script>/g))run(code[1]);
asset('contrem.js');asset('assessment-core.js');
context.CONTREM_ACADEMY_CONFIG={mode:'connected',preview:false,url:'https://vwvesygsudhbaqmayhsz.supabase.co',publishableKey:'sb_publishable_contract_only',playbackFunction:'academy-playback'};
const accountId='b53f0dfd-7f55-459d-bd49-0991384860a8',memberId='bf8dd26c-2dab-422e-bf49-8ed659495b44';
const owner='vinicius.alves@irmen.com.br',coursesWritten=[],statesWritten=[];
let actor='admin',rev=0;
const data=()=>{
 const admin=actor==='admin';
 return {user:{id:accountId,email:admin?owner:'learner@example.invalid'},
 member:{id:memberId,user_id:accountId,role:actor,active:true,display_name:admin?'Administrador QA':'Aluno QA'},
 catalog:{revision:rev,courses:admin?JSON.parse(JSON.stringify(coursesWritten.at(-1)||[])):[]},
 state:{revision:0,profile:{fullName:'QA'},progress:{},activity:{},certificates:[]}};
};
const fakeStorage={
 from(name){assert.equal(name,'academy-materials');return {
  upload:async(name,blob)=>({data:{path:name},error:null}),
  createSignedUrl:async()=>({data:{signedUrl:'https://example.invalid/private'},error:null}),
  remove:async()=>({data:[],error:null})
 };}
};
const client={auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},storage:fakeStorage};
const service={
 signIn:async()=>data(),restore:async()=>null,reload:async()=>data(),signOut:async()=>{},
 writeCatalog:async(value,revision)=>{assert.equal(revision,rev);coursesWritten.push(JSON.parse(JSON.stringify(value)));return {revision:++rev};},
 writeState:async(value,revision)=>{statesWritten.push(value);return {revision:revision+1};},
 listStudents:async()=>({members:[],grants:[]}),
 playback:async()=>{throw Error('no signed Mux asset');}
};
context.supabase={createClient:()=>client};context.AcademyCloudService={create:()=>service};
asset('cloud-ui.js');asset('admin-preview-media.js');asset('admin-manager.js');asset('assessment-author.js');
const $=id=>document.getElementById(id);
const set=(id,value)=>{$(id).value=String(value);$(id).dispatchEvent(new dom.Event('input',{bubbles:true}));};
const submit=async id=>$(id).onsubmit({preventDefault(){},currentTarget:$(id)});
const click=async id=>$(id).onclick({preventDefault(){},currentTarget:$(id)});
(async()=>{
 assert.equal($('demoAccess').hidden,true);assert.equal($('enter').disabled,true);
 set('cloudEmail',owner);set('cloudPassword','mock');await submit('cloudLoginForm');
 assert.equal(context.AcademySession.role,'admin');
 assert.equal($('app').classList.contains('hidden'),false);
 assert.equal($('adminNav').hidden,false);assert.equal($('studentNav').hidden,true);
 assert.equal($('createTestCourses').closest('details').hidden,true,'QA fictício não aparece no conectado');
 assert.equal($('newAdminCourse').disabled,false);
 await click('newAdminCourse');set('courseName','Treinamento real de integração');set('courseDescription','Curso salvo no backend autenticado');set('courseFormat','series');
 await submit('courseForm');await click('syncNow');
 assert.equal(coursesWritten.length>0,true,'botão salvar curso deve chamar backend');
 assert.equal(coursesWritten.at(-1)[0].name,'Treinamento real de integração');
 assert.equal($('newAdminLesson').disabled,false);
 await click('newAdminLesson');set('lessonName','Aula de introdução');await submit('lessonForm');await click('syncNow');
 assert.equal(coursesWritten.at(-1)[0].lessons.length,1,'botão salvar aula persiste no catálogo');
 const file=new (require('node:buffer').File)(['conteúdo'],'manual.pdf',{type:'application/pdf'});
 const item=await context.AcademyPreviewMedia.save(file,'support');
 assert.match(item.id,/^course-[a-z0-9-]+\/attachment-[0-9a-f-]{36}$/i);
 context.qaMaterial=item;
 run('courses[0].previewMaterials=[qaMaterial];validateBackup({app:"VA Academia",schemaVersion:4,courses,progress:{}});save()');
 await click('syncNow');
 assert.equal(coursesWritten.at(-1)[0].previewMaterials[0].id,item.id,'metadados privados são persistidos no catálogo autorizado');
 assert.equal($('migrateLocalCatalog').hidden,false,'importação Developer visível para admin');
 await click('exit');actor='student';set('cloudEmail','learner@example.invalid');set('cloudPassword','mock');await submit('cloudLoginForm');
 assert.equal(context.AcademySession.role,'student');assert.equal($('adminNav').hidden,true);assert.equal($('studentNav').hidden,false);
 assert.equal($('migrateLocalCatalog').hidden,true);
 console.log('PASS connected DOM: developer ADM, save course/lesson, private upload, role isolation, no demo');
})().catch(err=>{console.error(err);process.exitCode=1;});
