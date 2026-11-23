'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const src=path.resolve(__dirname,'../src/assets');
const core=require(path.join(src,'academy-program-core.js'));
const lessonUrl='https://player.mux.com/hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500';
function setup(){
 const handlers={};const views={};
 const node=id=>views[id]||(views[id]={
  disabled:false,hidden:false,textContent:'',style:{},src:'',onclick:null,children:[],
  setAttribute(){},querySelectorAll:()=>[{disabled:false,setAttribute(){}}]
 });
 let last=null,originalRenderCount=0;
 class Player{
  constructor(){this.handlers={};last=this;}
  on(name,fn){this.handlers[name]=fn;}
  emit(name,value){this.handlers[name]?.(value);}
 }
 const course={id:'m1',academyId:'a1',name:'Segurança',status:'published',moduleEnabled:true,
  lessons:[{id:'l1',name:'Primeira aula',url:lessonUrl}]};
 const map={items:[{id:'m1',canOpen:true}]};
 const window={
  CONTREM_ACADEMY_CONFIG:{preview:true},CONTREM_PROGRAM_CORE:core,
  CONTREM_PROGRAM_STORE:{studentPrograms:()=>({items:[{academy:{id:'a1'},map}]})},
  AcademySession:{role:'student',preview:true},playerjs:{Player},
  CONTREM_PREVIEW_SYNC:{flush:async()=>{}},dispatchEvent:()=>{}
 };
 const progress={},activity={},local=new Map;
 const context=vm.createContext({
  window,document:{getElementById:node},selectedCourse:course,selectedLesson:0,
  progress,activity,renderClass:()=>{originalRenderCount++;},
  chooseLesson:i=>{context.selectedLesson=i;context.renderClass();},
  renderAssessment:()=>{},refresh:()=>{},save:()=>{},
  academyStorage:{setItem:(k,v)=>local.set(k,String(v))},
  ACTIVITY_KEY:'activity',CustomEvent:class{constructor(type,opt){this.type=type;this.detail=opt?.detail;}},
  Date,Set,Map
 });
 node('markDone').onclick=()=>{throw Error('manual button must not be used');};
 node('nextLesson').onclick=()=>{};
 vm.runInContext(fs.readFileSync(path.join(src,'academy-lesson-gate.js'),'utf8'),context);
 context.renderClass();
 assert.ok(last,'Player.js monitor should attach');
 last.emit('ready');
 return {context,course,progress,activity,player:last,node,originalRenderCount:()=>originalRenderCount};
}
test('Pular até o fim NÃO registra uma aula vista',()=>{
 const h=setup(),p=h.player;
 p.emit('timeupdate',{seconds:0,duration:100});
 p.emit('seeked');
 p.emit('timeupdate',{seconds:99,duration:100});
 p.emit('ended');
 assert.equal((h.progress['video-watched:m1']||[]).includes('l1'),false);
 assert.equal(core.lessonDone(h.course,{progress:h.progress}),false);
});
test('Vídeo completo registra evento, libera aula sem atividade e impede marcação manual',()=>{
 const h=setup(),p=h.player;
 for(let second=0;second<100;second++)p.emit('timeupdate',{seconds:second,duration:100});
 p.emit('ended');
 assert.equal(h.progress['video-watched:m1'][0],'l1');
 assert.equal(h.progress.m1[0],'l1');
 assert.equal(core.lessonDone(h.course,{progress:h.progress}),true);
 assert.equal(h.node('markDone').disabled,true);
 assert.equal(h.node('markDone').textContent,'Conclusão automática pelo vídeo');
});
test('Vídeo visto não libera próxima aula enquanto atividade obrigatória não for aprovada',()=>{
 const h=setup(),p=h.player;h.course.lessons[0].questions=[{id:'q',text:'Questão?',choices:['A','B'],correct:0}];
 h.course.lessons.push({id:'l2',name:'Segunda aula',url:lessonUrl});
 for(let second=0;second<100;second++)p.emit('timeupdate',{seconds:second,duration:100});
 p.emit('ended');
 assert.equal(core.nextLessonIndex(h.course,{progress:h.progress}),0);
 assert.equal(h.context.CONTREM_LESSON_GATE?.canSelect(1),undefined); // API is exposed on window, not global
 assert.equal(h.context.window.CONTREM_LESSON_GATE.canSelect(1),false);
 h.progress['lesson-assessment:m1:l1']=[{passed:true}];
 assert.equal(h.context.window.CONTREM_LESSON_GATE.canSelect(1),true);
});
