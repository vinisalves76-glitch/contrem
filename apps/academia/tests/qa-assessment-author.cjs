// Authoring integration through the real preview service and ADM shell (emulated DOM).
const {parseHTML}=require('linkedom'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const html=fs.readFileSync('src/index.html','utf8'),{document,window:dom}=parseHTML(html),memory=new Map(),session=new Map();
const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)});
Object.defineProperty(dom.HTMLSelectElement.prototype,'value',{get(){return this.querySelector('option[selected]')?.value||this.querySelector('option')?.value||'';},set(value){for(const option of this.querySelectorAll('option'))option.toggleAttribute('selected',option.value===String(value));},configurable:true});
dom.HTMLElement.prototype.reset=function(){this.querySelectorAll('input,textarea').forEach(element=>element.value=element.getAttribute('value')||'');};dom.HTMLElement.prototype.scrollIntoView=()=>{};
let allowDiscard=true;
const context={document,localStorage:storage(memory),sessionStorage:storage(session),crypto:webcrypto,TextEncoder,URL,Blob,console,MutationObserver:dom.MutationObserver,navigator:{onLine:true},matchMedia:()=>({matches:false}),scrollTo(){},alert:text=>{throw Error('Unexpected alert: '+text);},confirm:()=>allowDiscard,setTimeout,clearTimeout,queueMicrotask,addEventListener(){}};
context.window=context;vm.createContext(context);const run=code=>vm.runInContext(code,context),asset=name=>run(fs.readFileSync('src/assets/'+name,'utf8'));
asset('cloud-store.js');asset('assessment-core.js');
for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))run(script[1]);
asset('contrem.js');asset('cloud-config.js');asset('cloud-service.js');
if(fs.existsSync('src/assets/assessment-demo.js'))asset('assessment-demo.js');
asset('admin-preview-service.js');asset('cloud-ui.js');asset('admin-preview-media.js');asset('admin-manager.js');asset('assessment-author.js');
const $=id=>document.getElementById(id),set=(id,value)=>{$(id).value=String(value);$(id).dispatchEvent(new dom.Event('input',{bubbles:true}));},click=async id=>$(id).onclick({currentTarget:$(id)}),submit=async id=>$(id).onsubmit({preventDefault(){},currentTarget:$(id)}),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
function type(value){set('assessmentAuthorType',value);$('assessmentAuthorType').dispatchEvent(new dom.Event('change',{bubbles:true}));}
function correct(values){const kind=$('assessmentAuthorType').value;if(kind==='single'){set('assessmentCorrectSingle',values);return;}const inputs=Array.from($('assessmentCorrectEditor').querySelectorAll('[data-author-correct]'));if(kind==='multi'){for(const input of inputs){input.checked=values.includes(Number(input.value));input.dispatchEvent(new dom.Event('change',{bubbles:true}));}}else inputs.forEach((input,index)=>{input.value=String(values[index]);input.dispatchEvent(new dom.Event('change',{bubbles:true}));});}
function chooseScope(value){$('assessmentAuthorScope').value=value;$('assessmentAuthorScope').onchange();}
(async()=>{
 await click('previewAdminEntry');
 set('courseName','Motor e diagnóstico');set('courseDescription','Curso para validar autoria de avaliações.');set('courseFormat','series');await submit('courseForm');
 const courseId=run('courses[0].id');
 await click('newAdminLesson');set('lessonName','Etapa de lubrificação');set('lessonUrl','hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500');await submit('lessonForm');
 const lessonId=run('courses[0].lessons[0].id');await tick();
 assert.ok(document.querySelector('[data-lesson-activity="0"]'),'each authored lesson exposes activity shortcut');
 await click('openAssessmentAuthor');assert.equal($('assessmentAuthorPanel').hidden,false);assert.equal($('assessmentAuthorScope').value,'final');
 const definitions=[['single',0],['multi',[0,1]],['order',[1,0]],['match',[1,0]]];
 for(const [kind,answer] of definitions){
  await click('newAssessmentQuestion');type(kind);set('assessmentQuestionText','Questão '+kind);set('assessmentChoices','Pressão\nVazão');if(kind==='match')set('assessmentMatchItems','Instrumento A\nInstrumento B');correct(answer);
  set('assessmentCompetency','Diagnóstico');set('assessmentExplanation','Explicação técnica do gabarito.');set('assessmentContext','Caso de aprendizagem demonstrativo.');set('assessmentIllustration','engine');
  await submit('assessmentAuthorForm');assert.match($('assessmentAuthorStatus').textContent,/Questão salva/);
 }
 assert.deepEqual(Array.from(run('courses[0].questions'),question=>question.type),['single','multi','order','match']);assert.equal(run('courses[0].status'),'draft');
 assert.equal(run('courses[0].questions[3].items.length'),2);assert.equal(run('courses[0].questions[2].correct[0]'),1);
 set('assessmentPassScore','80');await click('saveAssessmentSettings');assert.equal(run('courses[0].passScore'),80);
 chooseScope(lessonId);type('multi');set('assessmentQuestionText','Atividade imediata da etapa');set('assessmentChoices','Verificar nível\nMedir pressão');correct([0,1]);await submit('assessmentAuthorForm');
 assert.equal(run('courses[0].lessons[0].questions.length'),1);assert.equal(run('courses[0].questions.length'),4);
 chooseScope('final');
 document.querySelector('[data-author-edit="0"]').dispatchEvent(new dom.Event('click',{bubbles:true}));set('assessmentQuestionText','Enunciado revisado');await submit('assessmentAuthorForm');assert.equal(run('courses[0].questions[0].text'),'Enunciado revisado');
 document.querySelector('[data-author-remove="3"]').dispatchEvent(new dom.Event('click',{bubbles:true}));assert.equal(run('courses[0].questions.length'),3);
 set('assessmentQuestionText','Rascunho que deve permanecer');allowDiscard=false;await click('openCourseMaterials');assert.equal($('assessmentAuthorPanel').hidden,false);assert.equal($('assessmentQuestionText').value,'Rascunho que deve permanecer');
 await click('newAdminLesson');assert.equal($('assessmentQuestionText').value,'Rascunho que deve permanecer');assert.equal(context.AcademyAssessmentAuthor.hasPendingEdits(),true);
 allowDiscard=true;await click('openCourseMaterials');assert.equal($('assessmentAuthorPanel').hidden,true);assert.equal(run('courses[0].questions.length'),3,'accepted discard must not save the draft');
 await click('cancelCourseMaterials');await click('openAssessmentAuthor');
 type('single');set('assessmentQuestionText','Imagem inválida');set('assessmentChoices','A\nB');correct(0);set('assessmentImageUrl','javascript:alert(1)');await submit('assessmentAuthorForm');assert.match($('assessmentAuthorStatus').textContent,/imagem/);assert.equal(run('courses[0].questions.length'),3);
 allowDiscard=true;await click('closeAssessmentAuthor');
 document.querySelector('[data-lesson-activity="0"]').dispatchEvent(new dom.Event('click',{bubbles:true}));assert.equal($('assessmentAuthorScope').value,lessonId);
 await click('syncNow');await click('exit');await click('previewAdminEntry');assert.equal($('assessmentAuthorPanel').hidden,true,'author drafts must not cross a new account session');
 assert.equal(run('courses.find(c=>c.id==="'+courseId+'").questions.length'),3);assert.equal(run('courses.find(c=>c.id==="'+courseId+'").lessons[0].questions.length'),1);
 console.log('PASS: preview author creates four question types, lesson activity, threshold, edit/remove, dirty navigation guards and safe metadata with per-session state.');
})().catch(error=>{console.error(error);process.exitCode=1;});
