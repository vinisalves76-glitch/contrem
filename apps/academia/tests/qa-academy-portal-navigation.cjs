'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-program-ui.js'),'utf8');
const originalPortal=fs.readFileSync(path.resolve(__dirname,'../src/trilha-formacao/index.html'),'utf8');

function harness({authorized=true,hasEnrollment=true}={}){
 const start=source.indexOf(' function openAcademyPortal(academyId){');
 const end=source.indexOf(" window.addEventListener('message',event=>{",start);
 assert.ok(start>=0&&end>start,'missing portal entry');
 const calls=[],frame={hidden:true,setAttribute:(name,value)=>calls.push(['attribute',name,value])};
 const wrap=new Function('enrolled','preparePortalPayload','show','frame','crypto','window',
  'let opened=null,portalRequest=null,frameReady=true;'+source.slice(start,end)+
  ';return {open:openAcademyPortal,state:()=>({opened,portalRequest,frameReady})};');
 const ctrl=wrap(()=>authorized,()=>hasEnrollment?{academy:{id:'a1'}}:null,
  view=>calls.push(['show',view]),frame,{randomUUID:()=> 'unique-session'},
  {scrollTo:args=>calls.push(['scroll',args.top])});
 return {ctrl,calls,frame};
}
test('Clique em Academia matriculada abre o layout original em modo de integração',()=>{
 const h=harness();h.ctrl.open('a1');
 assert.equal(h.ctrl.state().opened,'a1');
 assert.equal(h.ctrl.state().frameReady,false);
 assert.deepEqual(h.calls,[
  ['show','studentView'],['attribute','src','./trilha-formacao/?integrated=1&request=unique-session'],['scroll',0]
 ]);
 assert.equal(h.frame.hidden,true,'não mostrar conteúdo antigo antes da confirmação da formação');
});
test('Sem matrícula ou login de aluno, portal não pode abrir',()=>{
 for(const option of [{authorized:false},{hasEnrollment:false}]){
  const h=harness(option);h.ctrl.open('a1');assert.deepEqual(h.calls,[]);
 }
});
test('Painel original reaproveitado e navegação segura para perfil e sala de aula',()=>{
 assert.match(originalPortal,/class="sidebar"/);
 assert.match(originalPortal,/class="hero"/);
 assert.match(originalPortal,/class="stage-grid"/);
 assert.match(source,/hidePortalFrame\(\);show\('studentView'\)/);
 assert.match(source,/returnToAcademy=academyId;/);
 assert.match(source,/frame\.contentWindow\?\.postMessage/);
 assert.match(source,/msg\?\.request!==portalRequest/);
});
