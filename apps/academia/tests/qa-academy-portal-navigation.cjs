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
