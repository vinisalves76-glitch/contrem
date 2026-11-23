'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto'),{parseHTML}=require('linkedom');
const base=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(base,'src/assets/academy-lesson-editor.js'),'utf8');
const connected=fs.readFileSync(path.join(base,'src/assets/academy-connected-ui.js'),'utf8');
const html=fs.readFileSync(path.join(base,'src/index.html'),'utf8');
const media=fs.readFileSync(path.join(base,'src/assets/admin-preview-media.js'),'utf8');
const backend=fs.readFileSync(path.join(base,'supabase/functions/academy-programs/index.ts'),'utf8');
const sleep=()=>new Promise(r=>setTimeout(r,15));
function fixture(){
 const {document,window}=parseHTML('<html><body></body></html>');
 const saved=[],uploaded=[];
 const target={
  id:'module-teste-001',name:'Sistemas hidráulicos',description:'',hours:6,moduleEnabled:false,
  lessons:[{id:'lesson-001',name:'Bombas e motores',description:'',videoId:'',minutes:0,
   previewMaterials:[],supportLinks:[],questions:[]}],
  previewMaterials:[],supportLinks:[],questions:[],passScore:75
 };
 window.AcademySession={role:'admin'};
 window.confirm=()=>true;
 window.AcademyAssessment={normalizeQuestion:x=>x};
 window.AcademyPreviewMedia={
  MAX_FILES:20,validate:(file)=>{if(!file.name)throw Error('Arquivo inválido');},
  save:async(file,kind,folder)=>{
   uploaded.push({name:file.name,kind,folder});
   return {id:folder+'/attachment-00000000-0000-4000-8000-000000000000',kind:'support',
    name:file.name,type:'application/pdf',size:1024};
  }
 };
 vm.runInNewContext(source,{window,document,crypto:webcrypto,URL,console});
 const editor=window.CONTREM_ACADEMY_LESSON_EDITOR;
 editor.open({programTitle:'Formação de Mecânicos',module:target,canEdit:true,
  onSave:async module=>{saved.push(JSON.parse(JSON.stringify(module)))},onClose:()=>{}});
 const root=document.getElementById('connectedFullLessonEditor');
 const click=selector=>{
  const button=root.querySelector(selector);
  assert.ok(button,'Missing: '+selector);
  button.dispatchEvent(new window.Event('click',{bubbles:true}));
 };
 const set=(field,value)=>{
  const el=root.querySelector('[data-field="'+field+'"]');
  assert.ok(el,field+' missing');
  el.value=value;el.dispatchEvent(new window.Event('input',{bubbles:true}));
 };
 return {editor,root,saved,uploaded,click,set,window,document};
}
test('Gerenciar aulas da Academia abre o mesmo conjunto de recursos do construtor de cursos',()=>{
 assert.match(connected,/openFullModuleEditor\(button\.dataset\.editModule,canEdit\)/);
 assert.match(connected,/api\('save',\{id:programId,revision:existing\?\.revision\?\?null,definition:newDefinition\}\)/);
 assert.match(html,/assets\/academy-lesson-editor\.js/);
 assert.match(html,/assets\/academy-lesson-editor\.css/);
 const f=fixture();
 assert.match(f.root.innerHTML,/Link do vídeo Mux ou Playback ID/);
 assert.match(f.root.innerHTML,/Materiais de apoio desta aula/);
 assert.match(f.root.innerHTML,/Atividades e prova/);
 assert.match(f.root.innerHTML,/Materiais do módulo/);
 assert.match(f.root.innerHTML,/Revisão/);
 assert.equal(f.root.hidden,false);
});
test('Playback ID do Mux e descrição da aula são mantidos ao salvar',async()=>{
 const f=fixture(),id='hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500';
 f.set('lessonName','Bomba de pistões axiais');
 f.set('lessonUrl','https://player.mux.com/'+id);
 f.set('lessonDescription','Diagnóstico de vazão e pressão');
 f.set('lessonMinutes','42');
 f.click('[data-action="save"]');await sleep();
 assert.equal(f.saved.length,1);
 assert.equal(f.saved[0].lessons[0].videoId,id);
 assert.equal(f.saved[0].lessons[0].url,'https://player.mux.com/'+id);
 assert.equal(f.saved[0].lessons[0].name,'Bomba de pistões axiais');
 assert.equal(f.saved[0].lessons[0].minutes,42);
});
test('Arquivos privados são anexados por módulo e links HTTPS persistem na aula',async()=>{
 const f=fixture();
 f.set('linkTitle','Manual PDF');
 f.set('linkUrl','https://exemplo.com/manual.pdf');
 f.click('[data-action="add-link:lesson"]');
 const input=f.root.querySelector('#academyFullUpload');
 assert.ok(input);
 Object.defineProperty(input,'files',{configurable:true,value:[{name:'apostila.pdf',size:1024,type:'application/pdf'}]});
 input.dispatchEvent(new f.window.Event('change',{bubbles:true}));
 await sleep();
 assert.equal(f.uploaded.length,1);
 assert.equal(f.uploaded[0].folder,'academy-asset-module-teste-001');
 f.click('[data-action="save"]');await sleep();
 assert.equal(f.saved.at(-1).lessons[0].supportLinks[0].url,'https://exemplo.com/manual.pdf');
 assert.match(f.saved.at(-1).lessons[0].previewMaterials[0].id,/^academy-asset-module-teste-001\/attachment-/);
});
test('Não grava um Playback ID Mux inválido e não altera outros cursos',async()=>{
 const f=fixture();f.set('lessonUrl','https://youtube.com/watch?v=falha');
 f.click('[data-action="save"]');await sleep();
 assert.equal(f.saved.length,0);
 assert.match(f.root.querySelector('#academyFullStatus').textContent,/Mux/);
 assert.doesNotMatch(source,/courses\.push\(|setCourseAccess\(|deleteCourse\(/);
 assert.match(media,/academyFolder/);
 assert.match(media,/academy-asset-/);
});
test('Servidor conserva Mux, metadados de anexos, links e questões sem exigir vídeo ao publicar',()=>{
 for(const token of ['muxId(val.url||val.videoId)','cleanLinks(val.supportLinks)',
  'cleanAttachments(val.previewMaterials,folder)','cleanQuestions(val.questions)',
  'previewMaterials:files,supportLinks:links','supportLinks,previewMaterials,questions']){
  assert.ok(backend.includes(token),'Missing persisted field '+token);
 }
 assert.match(backend,/if\(action==='publish'\)/);
 assert.match(backend,/Vídeos não são obrigatórios/);
 assert.match(backend,/\.eq\('role','admin'\)|m\.role==='admin'/);
 assert.doesNotMatch(backend,/lessons:cleanLessons,questions:\[\]/);
});
