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
asset('contrem.js');asset('cloud-config.js');asset('assessment-core.js');asset('assessment-demo.js');asset('cloud-service.js');asset('admin-preview-service.js');asset('cloud-ui.js');asset('admin-preview-media.js');asset('admin-manager.js');asset('assessment-student.js');asset('assessment-author.js');
const $=id=>document.getElementById(id);
assert.ok($('coursePhotoFile'),'ADM must expose a native image picker');
assert.equal($('coursePhotoFile').getAttribute('accept'),'image/jpeg,image/png,image/webp');
assert.equal($('lessonUrl').parentElement.querySelector('label').textContent,'Link do vídeo Mux (URL ou Playback ID)');
assert.equal($('newAdminLesson').disabled,false,'Add lesson must remain actionable before a course is selected');
assert.ok($('lessonMaterialFile').getAttribute('accept').includes('.pdf'));
assert.equal(run("safeCoursePhoto('data:image/jpeg;base64,YQ==')"),true,'compressed image data URLs must pass catalog validation');
assert.equal(run("safeCoursePhoto('data:text/html;base64,YQ==')"),false,'non-image data URLs must remain rejected');
const set=(id,value)=>{$(id).value=String(value);$(id).dispatchEvent(new dom.Event('input',{bubbles:true}));};
const submit=async id=>$(id).onsubmit({preventDefault(){},currentTarget:$(id)});
const click=async id=>$(id).onclick({currentTarget:$(id)});
const mux='hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500';
const tab=name=>document.querySelector('[data-admin-tab="'+name+'"]').onclick();
const flush=()=>click('syncNow');
const answerFinal=async values=>{
 if($('assessmentRetry'))await click('assessmentRetry');else if($('assessmentStart'))await click('assessmentStart');
 for(const value of values){const input=document.querySelector('[data-answer-index="'+value+'"]');input.checked=true;input.onchange();await click('assessmentNext');}
 await click('assessmentConfirmSubmit');await flush();
};

// Learner actions exercise only the visible dynamic controls.
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const courseId='qa-assessments-dynamic-v1';
const active=()=>run('activity["'+courseId+'"].assessments');
const current=key=>active()[key];
const answerCurrent=value=>{
 if(Array.isArray(value)&&document.querySelector('[data-answer-position]'))document.querySelectorAll('[data-answer-position]').forEach((select,i)=>{select.value=String(value[i]);select.onchange();});
 else if(Array.isArray(value))document.querySelectorAll('[data-answer-index]').forEach(input=>{input.checked=value.includes(Number(input.value));input.onchange();});
 else {const input=document.querySelector('[data-answer-index="'+value+'"]');input.checked=true;input.onchange();}
};
(async()=>{
 await click('previewStudentEntry');assert.equal(run('courses.length'),3);
 run('openCourse("'+courseId+'")');await click('assessmentLessonScope');await click('assessmentStart');
 assert.equal($('assessmentContent').textContent.includes('Resposta esperada'),false);
 const lessonKey='lesson:'+run('selectedCourse.lessons[0].id');
 const oldInput=document.querySelector('[data-answer-index="1"]');answerCurrent(0);await click('assessmentCheck');
 assert.equal(current(lessonKey).xp,10);assert.equal(current(lessonKey).locked[0],true);
 oldInput.checked=true;oldInput.onchange();assert.equal(current(lessonKey).answers[0],0,'confirmed answers must remain locked');
 await click('assessmentNext');answerCurrent([0,1,2]);await click('assessmentCheck');await click('assessmentNext');await flush();
 assert.equal(current(lessonKey).result.score,100);assert.equal(current(lessonKey).xp,20);
 assert.equal(run('getAttempts("'+courseId+'").length'),0);assert.equal(run('latestPassed("'+courseId+'")'),false,'checkpoints must not authorize final certificate');
 run('chooseLesson(1)');await click('assessmentLessonScope');await click('assessmentStart');answerCurrent([0,1,2,3]);await click('assessmentPause');await flush();
 const secondLessonKey='lesson:'+run('selectedCourse.lessons[1].id');assert.equal(current(secondLessonKey).status,'paused');
 run('chooseLesson(0)');await click('assessmentLessonScope');assert.equal(current(lessonKey).status,'result');assert.equal($('assessmentResume'),null,'different lesson must not show another checkpoint draft');
 run('chooseLesson(1)');await click('assessmentLessonScope');assert.ok($('assessmentResume'));assert.deepEqual(Array.from(current(secondLessonKey).answers[0]),[0,1,2,3]);
 run('chooseLesson(0)');await click('assessmentLessonScope');

 await click('assessmentFinalScope');await click('assessmentStart');
 assert.equal($('assessmentContent').textContent.includes('Resposta esperada'),false);answerCurrent(1);await click('assessmentNext');await click('assessmentFlag');
 const savedOrders=JSON.stringify(current('final').choiceOrders);await click('assessmentPause');await flush();await click('exit');
 await click('previewStudentEntry');run('openCourse("'+courseId+'")');assert.ok($('assessmentResume'));await click('reloadCloud');run('openCourse("'+courseId+'")');assert.ok($('assessmentResume'));await click('assessmentResume');
 assert.equal(current('final').index,1);assert.equal(current('final').answers[0],1);assert.equal(JSON.stringify(current('final').choiceOrders),savedOrders,'choice order stable across resume');assert.equal(current('final').flags.includes(1),true);
 await click('assessmentReview');assert.match($('assessmentContent').textContent,/pendente/);assert.equal($('assessmentContent').textContent.includes('Resposta esperada'),false);
 await click('assessmentReviewQuestion0');
 const completedPauseHandler=$('assessmentPause').onclick;
 const correct=[0,0,0,[0,1],[0,1,2,3],[0,1,2],0,0];
 for(const value of correct){answerCurrent(value);await click('assessmentNext');}
 assert.ok($('assessmentConfirmSubmit'));assert.equal($('assessmentContent').textContent.includes('Resposta esperada'),false);
 await click('assessmentConfirmSubmit');completedPauseHandler();assert.equal(current('final').status,'result','finalized attempts cannot be reopened by detached controls');await flush();assert.equal(run('getAttempts("'+courseId+'")[0].score'),100);assert.equal(run('latestPassed("'+courseId+'")'),true);assert.match($('assessmentContent').textContent,/Componentes/);assert.match($('assessmentContent').textContent,/Resposta esperada/);
 for(let i=0;i<3;i++){run('chooseLesson('+i+')');$('markDone').onclick();}
 run('printCertificate=()=>{};issueCertificate("participation");issueCertificate("approval")');await flush();assert.equal(run('certificates.length'),2);
 await click('assessmentFinalScope');await click('assessmentRetry');answerCurrent(0);await click('assessmentPause');await flush();
 const aId=context.AcademySession.userId;await click('exit');await click('previewAdminEntry');
 $('studentsTab').dispatchEvent(new dom.Event('click',{bubbles:true}));set('studentFullName','Aluno B');set('studentEmail','aluno-b@example.invalid');set('studentPassword','AlunoBTeste123!');await submit('studentForm');
 const bRow=Array.from(document.querySelectorAll('.student-roster-row')).find(row=>row.querySelector('.roster-email').textContent==='aluno-b@example.invalid'),grant=bRow.querySelector('[data-course="'+courseId+'"]');grant.checked=true;grant.dispatchEvent(new dom.Event('change',{bubbles:true}));await tick();await click('exit');
 set('cloudEmail','aluno-b@example.invalid');set('cloudPassword','AlunoBTeste123!');await submit('cloudLoginForm');run('openCourse("'+courseId+'")');
 assert.ok($('assessmentStart'));assert.equal(run('getAttempts("'+courseId+'").length'),0);assert.equal($('assessmentResume'),null,'another student must not inherit paused attempt');await click('assessmentStart');answerCurrent(1);
 const staleB=document.querySelector('[data-answer-index="2"]');await click('assessmentPause');await flush();const bId=context.AcademySession.userId;assert.notEqual(aId,bId);await click('exit');
 await click('previewStudentEntry');run('openCourse("'+courseId+'")');assert.ok($('assessmentResume'));staleB.checked=true;staleB.onchange();assert.equal(current('final').answers[0],0,'stale previous-account input cannot mutate current draft');
 const db=JSON.parse(memory.get('contrem-adm-preview-db-v1'));assert.equal(db.states[bId].activity[courseId].assessments.final.answers[0],1);assert.equal(db.states[aId].activity[courseId].assessments.final.answers[0],0);
 // An authored config change invalidates the old draft while preserving historical approval.
 await click('exit');await click('previewAdminEntry');run('AcademyAssessmentAuthor.open("'+courseId+'","final")');
 document.querySelector('[data-author-edit="0"]').dispatchEvent(new dom.Event('click',{bubbles:true}));set('assessmentContext','Contexto revisado pelo instrutor.');await submit('assessmentAuthorForm');
 tab('review');await click('adminPublish');await flush();await click('exit');await click('previewStudentEntry');run('openCourse("'+courseId+'")');
 assert.match($('assessmentContent').textContent,/configuração mudou/);assert.equal($('assessmentResume'),null);assert.equal(run('getAttempts("'+courseId+'").length'),1);assert.equal(run('latestPassed("'+courseId+'")'),true);
 await click('assessmentStart');assert.equal(current('final').answers.every(value=>value===null),true);assert.equal(current('final').index,0);
 // Unanswered final delivery requires a distinct review/confirmation action and records zero.
 await click('assessmentReview');assert.match($('assessmentContent').textContent,/8 questão/);await click('assessmentConfirmSubmit');await flush();assert.equal(run('getAttempts("'+courseId+'")[1].score'),0);assert.equal(run('getAttempts("'+courseId+'")[1].passed'),false);assert.equal(run('latestPassed("'+courseId+'")'),true,'historical successful final remains valid');
 current('final').answers[0]={invalid:true};current('final').history={invalid:true};run('renderAssessment()');assert.ok($('assessmentStart'),'malformed draft must safely offer fresh attempt');await click('assessmentStart');assert.equal(Array.isArray(current('final').history),true);
 run('validateBackup({app:"VA Academia",schemaVersion:4,courses,progress,activity,certificates})');
 assert.ok([...memory.keys()].every(key=>key.startsWith('contrem-adm-preview')));
 console.log('PASS: checkpoint feedback/XP lock, final deferred feedback/review, per-account pause/resume/shuffle, historical certificates, config invalidation and unanswered confirmation.');
})().catch(error=>{console.error(error);process.exitCode=1;});
