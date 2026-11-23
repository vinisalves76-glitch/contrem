'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../src/assets/academy-program-core.js');
const fs=require('node:fs');
const path=require('node:path');
const validUrl='https://player.mux.com/hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500';
const academy={id:'academy-test',title:'Formação de Mecânicos',stages:[{id:'s1',title:'Fundamentos',moduleIds:['m1','m2']}]};
const course=(id,enabled=false)=>({id,academyId:academy.id,catalogType:core.MOD,name:'Módulo '+id,description:'Conteúdo didático',
 status:enabled?'published':'draft',moduleEnabled:enabled,
 lessons:[{id:id+'-aula-1',name:'Aula técnica',url:enabled?validUrl:''}],
 questions:[{id:id+'-q',text:'Questão?',choices:['A','B'],correct:0}],passScore:75});

test('Formação pode ser publicada com todos os vídeos ausentes e módulos inativos',()=>{
 const courses=[course('m1'),course('m2')];
 assert.equal(core.publishReady(academy,courses),'');
 assert.equal(core.inspectModules(academy,courses).filter(x=>x.enabled).length,0);
 assert.equal(core.firstVideoReady(courses[0]),false);
 assert.equal(core.moduleActive(courses[0]),false);
 const student={active:true,validUntil:null};
 const map=core.buildMap(academy,courses,{progress:{}},student);
 assert.equal(map.length,2);
 assert.equal(map[0].canOpen,false);
 assert.equal(map[0].status,'inactive');
});

test('ADM pode ativar módulo só com primeiro vídeo, mantendo aulas futuras em preparação',()=>{
 const first=course('m1',true),later=course('m2');
 first.lessons.push({id:'m1-aula-2',name:'Aula 2',url:''});
 const summary=core.inspectModules(academy,[first,later]);
 assert.equal(summary[0].enabled,true);
 assert.equal(summary[0].ready,true);
 assert.equal(summary[0].missingLessons,1);
 assert.equal(summary[1].enabled,false);
 assert.equal(core.buildMap(academy,[first,later],{progress:{}},{active:true})[0].canOpen,true);
});

test('Ativar módulo sem Mux libera módulo mas não a aula',()=>{
 const courses=[course('m1'),course('m2')],student={active:true,validUntil:null};
 courses[0].moduleEnabled=true;
 let result=core.buildMap(academy,courses,{progress:{}},student);
 assert.equal(result[0].canOpen,true);
 assert.equal(result[0].enabled,true);
 assert.equal(result[0].hasVideo,false);
 assert.equal(result[0].status,'preparing');
 assert.equal(core.lessonCompleted(courses[0],courses[0].lessons[0],{progress:{}}),false);
 assert.equal(result[1].canOpen,false);
 courses[0].moduleEnabled=false;
 result=core.buildMap(academy,courses,{progress:{}},student);
 assert.equal(result[0].canOpen,false);
 assert.equal(result[0].status,'inactive');
});

test('Estado Ativo é preservado quando construtor deixa módulo em rascunho',()=>{
 const c=course('m1',true);
 c.status='draft';
 assert.equal(core.moduleActive(c),true);
 c.moduleEnabled=false;
 assert.equal(core.moduleActive(c),false);
});

test('Aula somente é concluída após vídeo e atividade aprovada, e módulo exige prova se cadastrada',()=>{
 const first=course('m1',true),second=course('m2',true);
 first.lessons[0].questions=[{id:'a',text:'Atividade?',choices:['A','B'],correct:0}];
 const progress={};
 const state={progress},lesson=first.lessons[0],enrollment={active:true};
 assert.equal(core.lessonCompleted(first,lesson,state),false);
 progress.m1=[lesson.id]; // marcação manual antiga não deve valer como vídeo completo
 assert.equal(core.lessonCompleted(first,lesson,state),false);
 progress['video-watched:m1']=[lesson.id];
 assert.equal(core.lessonCompleted(first,lesson,state),false); // falta atividade
 progress['lesson-assessment:m1:'+lesson.id]=[{passed:false}];
 assert.equal(core.lessonCompleted(first,lesson,state),false);
 progress['lesson-assessment:m1:'+lesson.id].push({passed:true});
 assert.equal(core.lessonCompleted(first,lesson,state),true);
 assert.equal(core.passed(first,state),false); // falta prova final do módulo
 assert.equal(core.buildMap(academy,[first,second],state,enrollment)[1].status,'blocked');
 progress['assessment:m1']=[{passed:true}];
 assert.equal(core.passed(first,state),true);
 assert.equal(core.buildMap(academy,[first,second],state,enrollment)[1].canOpen,true);
 second.moduleEnabled=false;
 assert.equal(core.buildMap(academy,[first,second],state,enrollment)[1].canOpen,false);
 assert.equal(core.buildMap(academy,[first,second],state,enrollment)[1].status,'inactive');
});

test('Sem prova final cadastrada, concluir vídeo e atividade da aula permite avançar',()=>{
 const first=course('m1',true),second=course('m2',true);
 first.questions=[];
 const p={m1:['m1-aula-1'],'video-watched:m1':['m1-aula-1']};
 assert.equal(core.passed(first,{progress:p}),true);
 assert.equal(core.buildMap(academy,[first,second],{progress:p},{active:true})[1].canOpen,true);
});

test('ADM contém botões Ativar/Desativar e preserva rastreamento Mux',()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-program-ui.js'),'utf8');
 const gate=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-lesson-gate.js'),'utf8');
 assert.match(source,/store\.setStatus\(a\.id,'published'\)/);
 assert.match(source,/data\.moduleAccess/);
 assert.match(source,/data\.accessValue/);
 assert.match(source,/course\.moduleEnabled=active/);
 assert.match(source,/\[true,'Ativar'\]/);
 assert.match(source,/\[false,'Desativar'\]/);
 assert.doesNotMatch(source,/if\(control\.checked&&!core\.firstVideoReady/);
 assert.match(gate,/player\.on\('timeupdate'/);
 assert.match(gate,/player\.on\('ended'/);
 assert.match(gate,/watched>=\.95/);
 assert.match(gate,/\$\('markDone'\)\.disabled=true/);
});
