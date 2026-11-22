'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-program-ui.js'),'utf8');
function extractedPortalFunction(){
 const start=source.indexOf(' function openAcademyPortal(academyId){');
 const finish=source.indexOf(' function renderStudentDetail(){',start);
 assert.ok(start>=0&&finish>start,'expected real portal-entry function');
 return source.slice(start,finish);
}
function harness({role='student',programId='a1'}={}){
 const actions=[],fakeStore={studentPrograms:()=>({items:[{academy:{id:programId}}]})};
 const factory=new Function('store','enrolled','renderStudentDetail','show','window',`
   let opened=null;
   ${extractedPortalFunction()}
   return {open:openAcademyPortal,selected:()=>opened};
 `);
 const impl=factory(fakeStore,()=>role==='student',()=>actions.push('render'),id=>actions.push('show:'+id),{scrollTo:options=>actions.push('scroll:'+options.top)});
 return {impl,actions};
}
test('Click a matriculated Academy opens its exclusive portal at top of page',()=>{
 const h=harness();h.impl.open('a1');
 assert.equal(h.impl.selected(),'a1');
 assert.deepEqual(h.actions,['render','show:academyPortalView','scroll:0']);
});
test('A student cannot open an unavailable Academy, and an ADM cannot enter student portal',()=>{
 let h=harness();h.impl.open('a2');assert.deepEqual(h.actions,[]);
 h=harness({role:'admin'});h.impl.open('a1');assert.deepEqual(h.actions,[]);
});
test('Portal is a separate screen with a back button, not a hidden section below the cards',()=>{
 assert.match(source,/portal\.id='academyPortalView'/);
 assert.match(source,/studentPanel\.innerHTML='<div class="tag">MINHAS ACADEMIAS/);
 assert.match(source,/portal\.querySelector\('#programPortalBack'\)\.onclick=/);
 assert.match(source,/button\.onclick=\(\)=>openAcademyPortal\(item\.academy\.id\)/);
 assert.match(source,/portal\.classList\.toggle\('hidden',id!=='academyPortalView'\)/);
 assert.match(source,/if\(id==='academyPortalView'\)\$\('studentView'\)\.classList\.add\('hidden'\)/);
 assert.match(source,/returnToAcademy=academyId;\s*openCourse\(moduleId\)/);
 assert.match(source,/returnToAcademy&&selectedCourse\?\.academyId===returnToAcademy&&enrolled\(\)/);
});


test('Regressão: aluno matriculado com várias etapas renderiza o portal sem variável do ADM',()=>{
 const start=source.indexOf(' function renderStudentDetail(){');
 const end=source.indexOf(' async function openModule(',start);
 assert.ok(start>0&&end>start,'não foi encontrado o renderer real do aluno');
 const rendererSource=source.slice(start,end);
 // O painel administrativo usa uma variável local `a`; ela nunca deve aparecer no renderer do aluno.
 assert.doesNotMatch(rendererSource,/\ba\.stages\b/);
 assert.doesNotMatch(rendererSource,/\bupdateProgram\(/);
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.hidden=false;this.className='';this.style={};this.textContent='';this.innerHTML='';}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
 }
 const dom={};
 for(const key of ['studentAcademyDetail','programPortalTitle','programPortalDescription','programPortalMeta'])dom[key]=new Element('div');
 const document={createElement:tag=>new Element(tag)};
 const academy={id:'formacao-1',title:'Formação de Mecânicos',description:'Academia de teste',
  stages:[{id:'s1',title:'Fundamentos',moduleIds:['m1']},{id:'s2',title:'Diagnóstico',moduleIds:['m2']}],
  certificateEnabled:false};
 const map={active:true,completed:false,approved:0,total:2,items:[
  {id:'m1',name:'Segurança',status:'available',hours:6,lessons:2,canOpen:true,passed:false},
  {id:'m2',name:'Motor diesel',status:'blocked',hours:16,lessons:4,canOpen:false,passed:false}
 ]};
 const program={academy,enrollment:{validUntil:null},map};
 const renderer=new Function('enrolled','opened','store','$','document','e','openModule','renderStudent','printCert',
  rendererSource+'; return renderStudentDetail;')(
   ()=>true,'formacao-1',{studentPrograms:()=>({items:[program],certificates:[]})},
   id=>dom[id],document,text=>String(text),()=>{},()=>{},()=>{});
 assert.doesNotThrow(renderer);
 const stages=dom.studentAcademyDetail.children.filter(el=>el.className==='program-student-stage');
 assert.equal(stages.length,2);
 const modules=stages.flatMap(stage=>stage.children.filter(el=>el.className.startsWith('program-student-module')));
 assert.equal(modules.length,2);
 assert.equal(dom.programPortalTitle.textContent,'Formação de Mecânicos');
 assert.ok(modules[0].children.some(el=>el.className==='program-student-actions'));
});
