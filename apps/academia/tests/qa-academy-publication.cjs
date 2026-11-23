'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../src/assets/academy-program-core.js');
const fs=require('node:fs');
const path=require('node:path');
function prepared(id,status='draft'){
 return {id,academyId:'academy-test',catalogType:'academy_module',name:'Módulo '+id,description:'Conteúdo didático',
 status,lessons:[{id:id+'-aula',name:'Aula técnica',url:'https://player.mux.com/abc123XYZ'}],
 questions:[{id:id+'-q',text:'Questão?',choices:['A','B'],correct:0}],passScore:75};
}
const academy={id:'academy-test',title:'Formação de Mecânicos',stages:[{id:'s1',title:'Fundamentos',moduleIds:['m1','m2']}]};

test('Módulos completos em rascunho devem ser identificados como aptos para publicação conjunta',()=>{
 const courses=[prepared('m1','published'),prepared('m2','draft')];
 const report=core.inspectModules(academy,courses);
 assert.equal(report.length,2);
 assert.ok(report.every(item=>item.ready));
 assert.equal(report[1].status,'draft');
 assert.match(core.publishReady(academy,courses),/Módulo m2/);
 courses[1].status='published';
 assert.equal(core.publishReady(academy,courses),'');
});

test('Não publicar módulo sem prova, Mux ou descrição',()=>{
 const courses=[prepared('m1'),prepared('m2')];
 courses[0].questions=[];
 courses[1].lessons[0].url='';
 const report=core.inspectModules(academy,courses);
 assert.equal(report.filter(m=>!m.ready).length,2);
 assert.match(report[0].issues.join(' '),/prova/);
 assert.match(report[1].issues.join(' '),/Mux/);
 assert.ok(courses.every(c=>c.status==='draft'),'a validação não muda o status');
});

test('A publicação conjunta no ADM valida tudo antes de mudar status e restaura em caso de falha',()=>{
 const ui=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-program-ui.js'),'utf8');
 assert.match(ui,/const diagnostics=core\.inspectModules\(a,courses\),invalid=diagnostics\.filter\(item=>!item\.ready\)/);
 assert.match(ui,/if\(invalid\.length\)/);
 assert.match(ui,/for\(const entry of original\)entry\.course\.status='published'/);
 assert.match(ui,/store\.setStatus\(a\.id,'published'\)/);
 assert.match(ui,/for\(const entry of original\)entry\.course\.status=entry\.status/);
 assert.match(ui,/Corrigir módulo/);
});
