'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-connected-ui.js'),'utf8');
const api=fs.readFileSync(path.resolve(__dirname,'../supabase/functions/academy-programs/index.ts'),'utf8');
const styles=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-connected-ui.css'),'utf8');
const extract=(start,end)=>{
 const a=src.indexOf(start),b=src.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Function boundaries missing: '+start);
 return src.slice(a,b);
};

test('Novas Academias exibem Adicionar etapa, Adicionar módulo e Adicionar aula',()=>{
 for(const term of ['id="connectedAddStage"','data-add-module="','data-add-lesson','data-edit-module="','data-module-name','data-lesson-name','data-lesson-description','data-lesson-minutes']){
  assert.ok(src.includes(term),'Control missing: '+term);
 }
 assert.match(styles,/\.connected-add-entry/);
 assert.match(styles,/\.connected-lesson-entry/);
});

test('Adicionar etapa não apaga campos preenchidos antes da inclusão',()=>{
 const messages=[],draft={stages:[],modules:[]};
 const input={value:'Fundamentos'};
 const add=new Function('draft','collectForm','$','message','renderDetails','newId',
 extract(' function addStage(){',' function addModule(stageId){')+';return addStage;')(
  draft,()=>messages.push('collect'),id=>id==='connectedNewStageName'?input:null,
  value=>messages.push(value),()=>messages.push('render'),()=>'stage-1234567890abc'
 );
 add();
 assert.equal(draft.stages.length,1);
 assert.equal(draft.stages[0].title,'Fundamentos');
 assert.deepEqual(draft.stages[0].moduleIds,[]);
 assert.deepEqual(messages[0],'collect');
});

test('Adicionar módulo gera uma unidade inativa, dentro da etapa selecionada',()=>{
 const stage={id:'stage-a',title:'Fundamentos',moduleIds:[]};
 const draft={stages:[stage],modules:[]},messages=[];
 const editor={hidden:true,scrollIntoView:()=>messages.push('scrolled')};
 const add=new Function('draft','document','collectForm','message','renderDetails','$','renderModuleEditor','newId',
 extract(' function addModule(stageId){',' function renderDetails(){')+';return addModule;')(
  draft,{querySelector:()=>({value:'Motor Diesel',focus(){}})},
  ()=>messages.push('collect'),v=>messages.push(v),()=>messages.push('render'),
  id=>id==='connectedModuleEditor-module-abc'?editor:null,
  ()=>messages.push('open editor'),()=>'module-abc'
 );
 add('stage-a');
 assert.equal(draft.modules[0].id,'module-abc');
 assert.equal(draft.modules[0].name,'Motor Diesel');
 assert.equal(draft.modules[0].moduleEnabled,false);
 assert.equal(draft.modules[0].lessons.length,0);
 assert.deepEqual(stage.moduleIds,['module-abc']);
 assert.equal(editor.hidden,false);
 assert.ok(messages.includes('open editor'));
});

test('Gerenciar aulas cria novas aulas com ID estável, sem vídeo obrigatório e sem excluir existentes',()=>{
 const draft={modules:[{id:'module-a',name:'Motor Diesel',description:'',hours:12,lessons:[
  {id:'lesson-original',name:'Introdução',description:'',minutes:0,videoId:''}]}]};
 const buttons={'[data-save-module]':{},'[data-add-lesson]':{},'[data-new-lesson-name]':{value:'Sistema de injeção'}};
 const box={dataset:{},set innerHTML(x){this.html=x},get innerHTML(){return this.html},querySelector:s=>buttons[s]};
 const render=new Function('draft','esc','collectForm','saveDraft','message','newId',
 extract(' function renderModuleEditor(id,box,canEdit){',' async function loadStudents(){')+';return renderModuleEditor;')(
  draft,s=>String(s),()=>{},()=>{},()=>{},()=>'lesson-next'
 );
 render('module-a',box,true);
 assert.match(box.html,/Adicionar aula/);
 buttons['[data-add-lesson]'].onclick();
 assert.equal(draft.modules[0].lessons.length,2);
 assert.equal(draft.modules[0].lessons[0].id,'lesson-original');
 assert.equal(draft.modules[0].lessons[1].name,'Sistema de injeção');
 assert.equal(draft.modules[0].lessons[1].videoId,'');
 assert.equal(draft.modules[0].lessons[1].id,'lesson-next');
});

test('Nome, descrição, duração e horas são preservados no modelo antes de salvar',()=>{
 const draft={modules:[{id:'module-b',name:'Rascunho',description:'',hours:0,lessons:[
  {id:'lesson-b',name:'Aula',description:'',minutes:0,videoId:''}]}]};
 const box={dataset:{moduleId:'module-b'},
 querySelector(s){const map={
  '[data-module-name]':{value:'Hidráulica'},
  '[data-module-description]':{value:'Bombas e cilindros'},
  '[data-module-hours]':{value:'8'}
 };return map[s]||null},
 querySelectorAll(s){const map={
  '[data-lesson-name]':[{dataset:{lessonName:'lesson-b'},value:'Bombas hidráulicas'}],
  '[data-lesson-description]':[{dataset:{lessonDescription:'lesson-b'},value:'Tipos e funções'}],
  '[data-lesson-minutes]':[{dataset:{lessonMinutes:'lesson-b'},value:'45'}]
 };return map[s]||[]}
 };
 const collect=new Function('draft',
  extract(' function collectModuleFields(box){',' function addStage(){')+';return collectModuleFields;')(draft);
 collect(box);
 assert.equal(draft.modules[0].name,'Hidráulica');
 assert.equal(draft.modules[0].hours,8);
 assert.equal(draft.modules[0].lessons[0].name,'Bombas hidráulicas');
 assert.equal(draft.modules[0].lessons[0].minutes,45);
});

test('Publicação exige etapa e módulo, mas NÃO exige link ou vídeo Mux',()=>{
 assert.match(api,/if\(!stages\.length\)/);
 assert.match(api,/stages\.some\(stage=>Array\.isArray\(stage\.moduleIds\)&&stage\.moduleIds\.length>0\)/);
 assert.match(api,/Vídeos não são obrigatórios/);
 assert.match(api,/nextStatus='published'/);
 assert.doesNotMatch(api,/if\(action==='publish'\)[\s\S]{0,500}videoId/);
});
