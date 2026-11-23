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
 const window={scrollTo:args=>calls.push(['scroll',args.top])};
 const body={classList:{add:name=>calls.push(['body-class',name])}};
 const wrap=new Function('enrolled','preparePortalPayload','show','frame','crypto','window','portalLoading','document','setTimeout','clearTimeout','calls',
  'let opened=null,portalRequest=null,frameReady=true,portalTimer=null;'+source.slice(start,end)+
  ';return {open:openAcademyPortal,state:()=>({opened,portalRequest,frameReady,portalTimer})};');
 const ctrl=wrap(()=>authorized,()=>hasEnrollment?{academy:{id:'a1'}}:null,
  view=>calls.push(['show',view]),frame,{randomUUID:()=> 'unique-session'},window,
  ()=>calls.push(['loading']),{body},()=>99,()=>{},calls);
 return {ctrl,calls,frame};
}
test('Clique em Academia matriculada abre uma tela de carregamento e o painel original imediatamente',()=>{
 const h=harness();h.ctrl.open('a1');
 assert.equal(h.ctrl.state().opened,'a1');
 assert.equal(h.ctrl.state().frameReady,false);
 assert.equal(h.frame.hidden,false,'iframe deve começar a carregar visivelmente');
 assert.deepEqual(h.calls,[
  ['show','studentView'],['loading'],['body-class','academy-immersive'],
  ['attribute','src','./trilha-formacao/?integrated=1&request=unique-session'],['scroll',0]
 ]);
 assert.equal(h.ctrl.state().portalTimer,99,'deve existir um caminho de recuperação');
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
