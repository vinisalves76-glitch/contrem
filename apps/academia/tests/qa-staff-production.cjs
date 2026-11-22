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
 const admin=actor==='admin',editor=admin||actor==='content_admin';
 return {user:{id:accountId,email:admin?owner:editor?'staff@example.invalid':'learner@example.invalid'},
 member:{id:memberId,user_id:accountId,role:actor,active:true,display_name:admin?'Administrador QA':editor?'Editor QA':'Aluno QA'},
 catalog:{revision:rev,courses:editor?JSON.parse(JSON.stringify(coursesWritten.at(-1)||[])):[]},
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
const staff=[],published=[];
service.createContentAdmin=async(name,email,password)=>{assert.equal(actor,'admin');assert.equal(password,'SenhaForte123!');staff.push({id:'staff-id',name,email,active:true});return {id:'staff-id',name,email,active:true};};
service.listStaff=async()=>staff;
service.setStaffActive=async(id,active)=>{assert.equal(actor,'admin');staff[0].active=active;};
service.publishCourse=async id=>{assert.equal(actor,'admin');published.push(id);return {courseId:id,status:'published'};};
service.unpublishCourse=async id=>{assert.equal(actor,'admin');return {courseId:id,status:'draft'};};
context.supabase={createClient:()=>client};context.AcademyCloudService={create:()=>service};
asset('cloud-ui.js');asset('admin-preview-media.js');asset('admin-manager.js');asset('assessment-author.js');
const $=id=>document.getElementById(id);
const set=(id,value)=>{$(id).value=String(value);$(id).dispatchEvent(new dom.Event('input',{bubbles:true}));};
const submit=async id=>$(id).onsubmit({preventDefault(){},currentTarget:$(id)});
const click=async id=>$(id).onclick({preventDefault(){},currentTarget:$(id)});

(async()=>{
 set('cloudEmail',owner);set('cloudPassword','mock');await submit('cloudLoginForm');
 assert.equal(context.AcademySession.role,'admin');
 assert.equal($('staffTab').hidden,false,'Master vê Funcionários');
 $('staffTab').dispatchEvent(new dom.Event('click',{bubbles:true}));
 assert.equal($('adminHeading').textContent,'Funcionários');
 assert.equal($('adminStaff').hidden,false);
 set('staffName','Editor de cursos QA');
 set('staffEmail','staff@example.invalid');
 set('staffPassword','SenhaForte123!');
 await submit('staffCreateForm');
 assert.match($('staffFormStatus').textContent,/Login de Editor de cursos QA criado/);
 assert.equal($('staffPassword').value,'','Senha não deve permanecer preenchida');
 assert.equal(staff[0].email,'staff@example.invalid');
 await click('exit');actor='content_admin';
 set('cloudEmail','staff@example.invalid');set('cloudPassword','SenhaForte123!');
 await submit('cloudLoginForm');
 assert.equal(context.AcademySession.role,'content_admin');
 assert.equal($('adminNav').hidden,false);
 assert.equal($('studentNav').hidden,true);
 assert.equal($('staffTab').hidden,true,'Editor não vê Funcionários');
 assert.equal($('studentForm').hidden,true,'Editor não cria logins');
 assert.equal($('adminPublish').hidden,true,'Editor não publica');
 assert.equal($('adminUnpublish').hidden,true,'Editor não despublica');
 assert.equal($('adminView').classList.contains('content-admin'),true);
 await click('newAdminCourse');
 set('courseName','Sistemas hidráulicos em máquinas pesadas');
 set('courseDescription','Introdução a máquinas pesadas');
 await submit('courseForm');await click('syncNow');
 assert.equal(coursesWritten.at(-1)[0].status,'draft');
 await click('newAdminLesson');set('lessonName','Componentes hidráulicos');set('lessonUrl','hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500');
 await submit('lessonForm');await click('syncNow');
 assert.equal(coursesWritten.at(-1)[0].lessons.length,1);
 await click('adminPublish');assert.equal(published.length,0,'Editor não publica ainda que dispare o handler');
 await click('exit');actor='admin';
 set('cloudEmail',owner);set('cloudPassword','mock');await submit('cloudLoginForm');
 assert.equal($('staffTab').hidden,false);
 run('editCourse(courses[0].id)');
 assert.equal($('adminPublish').hidden,false,'Master pode publicar');
 await click('adminPublish');await click('syncNow');
 assert.equal(published.length,1,'A publicação deve passar pelo backend do Master');
 console.log('PASS production staff DOM: direct account, password cleared, employee login, drafts, lessons, no publish/user creation, master review');
})().catch(err=>{console.error(err);process.exitCode=1;});
