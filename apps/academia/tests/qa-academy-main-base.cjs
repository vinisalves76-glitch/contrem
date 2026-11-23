'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../src/assets/academy-program-core.js');
const srcRoot=path.resolve(__dirname,'../src');
const root=path.resolve(srcRoot,'../../..');
const code=(p)=>fs.readFileSync(path.resolve(root,p),'utf8');
const academy={
 id:'formacao-mecanicos',title:'Formação de Mecânicos',
 stages:[{id:'e1',title:'Fundamentos',moduleIds:['m1','m2']}]
};
const course=(id,active=false)=>({
 id,academyId:academy.id,status:'draft',moduleEnabled:active,
 name:'Módulo '+id,description:'Introdução',lessons:[{id:id+'-l1',name:'Aula inicial',url:''}],
 questions:[],passScore:75
});
test('Academia inteira pode estar publicada com módulos desativados e sem vídeos',()=>{
 const courses=[course('m1'),course('m2')];
 assert.equal(core.publishReady(academy,courses),'');
 const steps=core.buildMap(academy,courses,{progress:{}},{active:true});
 assert.equal(steps.length,2);
 assert.equal(steps[0].status,'inactive');
 assert.equal(steps[0].canOpen,false);
});
test('Ativar só abre o módulo, sem liberar aula pendente ou módulo seguinte',()=>{
 const courses=[course('m1',true),course('m2',true)];
 const state={progress:{}};
 let steps=core.buildMap(academy,courses,state,{active:true});
 assert.equal(steps[0].canOpen,true);
 assert.equal(steps[0].hasVideo,false);
 assert.equal(steps[0].status,'preparing');
 assert.equal(steps[1].canOpen,false);
 assert.equal(core.lessonDone(courses[0],state),false);
 courses[0].moduleEnabled=false;
 steps=core.buildMap(academy,courses,state,{active:true});
 assert.equal(steps[0].canOpen,false);
});
test('Progressão exige vídeo acompanhado e atividade aprovada quando configurada',()=>{
 const courses=[course('m1',true),course('m2',true)],lesson=courses[0].lessons[0];
 lesson.url='https://player.mux.com/hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500';
 lesson.questions=[{id:'q1',text:'Questão',choices:['Sim','Não'],correct:0}];
 const state={progress:{m1:[lesson.id]}};
 assert.equal(core.lessonCompleted(courses[0],lesson,state),false);
 state.progress['video-watched:m1']=[lesson.id];
 assert.equal(core.lessonCompleted(courses[0],lesson,state),false);
 state.progress['lesson-assessment:m1:'+lesson.id]=[{passed:true}];
 assert.equal(core.lessonCompleted(courses[0],lesson,state),true);
 assert.equal(core.buildMap(academy,courses,state,{active:true})[1].canOpen,true);
});
test('Produção mantém login real e não carrega sandbox da preview',()=>{
 const html=code('apps/academia/src/index.html');
 const config=code('apps/academia/src/assets/cloud-config.js');
 const service=code('apps/academia/src/assets/cloud-service.js');
 assert.match(html,/id="cloudLoginForm"/);
 assert.doesNotMatch(html,/id="(?:demoAccess|previewAdminEntry)"/);
 assert.doesNotMatch(html,/src="assets\/(?:admin-preview-service|academy-program-ui|academy-program-store)\.js"/);
 assert.match(config,/"mode":"connected"/);
 assert.match(config,/"preview":false/);
 assert.match(service,/academy_my_catalog/);
 assert.match(service,/academy-workspace/);
});
test('A importação é isolada: core puro não substitui o ADM real',()=>{
 const html=code('apps/academia/src/index.html');
 assert.match(html,/src="assets\/admin-manager\.js"/);
 assert.match(html,/src="assets\/cloud-ui\.js"/);
 assert.doesNotMatch(html,/src="assets\/academy-program-core\.js"/);
});
