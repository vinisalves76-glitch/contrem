'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=path.resolve(__dirname,'../src');
const read=file=>fs.readFileSync(path.join(src,file),'utf8');
const parent=read('assets/academy-program-ui.js');
const child=read('trilha-formacao/integrated.js');
const page=read('trilha-formacao/index.html');
const standalone=read('trilha-formacao/app.js');
const css=read('assets/academy-program-ui.css');
const store=read('assets/academy-program-store.js');

function prepareFactory(enrolled,store,courses,progress,studentName) {
 const start=parent.indexOf(' function preparePortalPayload(academyId){');
 const end=parent.indexOf(' function sendPortalData(){',start);
 assert.ok(start>=0&&end>start,'função de dados do portal integrada não encontrada');
 return new Function('enrolled','store','courses','progress','studentName',
   parent.slice(start,end)+'; return preparePortalPayload;')(enrolled,store,courses,progress,studentName);
}
test('Painel reaproveita a mesma marca, estilo e menu da preview original',()=>{
 assert.match(page,/class="shell"/);
 assert.match(page,/class="sidebar"/);
 assert.match(page,/class="hero"/);
 assert.match(page,/class="stage-grid"/);
 assert.match(page,/class="resume-row"/);
 assert.match(page,/src="\.\/integrated\.js"/);
 assert.match(page,/href="\.\/integrated\.css"/);
 assert.match(child,/← Voltar para meu perfil/);
 assert.match(standalone,/get\('integrated'\)==='1'\)return/);
});
test('A visualização depende de login e de matrícula na Academia selecionada',()=>{
 const a={id:'academy-1',title:'Formação em mecânica',stages:[{id:'stage-1',title:'Fundamentos',moduleIds:['m1','m2']}]};
 const enrollment={active:true,validUntil:null};
 const map={active:true,completed:false,approved:0,total:2,items:[
  {id:'m1',name:'Segurança',canOpen:true,passed:false,attempts:1},
  {id:'m2',name:'Motor',canOpen:false,passed:false,attempts:0}]};
 const courses=[{id:'m1',description:'Aula online',lessons:[{id:'l1',name:'Primeiro vídeo'},{id:'l2',name:'Segundo vídeo'}],url:'SEGREDO'},
  {id:'m2',description:'Bloqueado',lessons:[{id:'l3',name:'Terceiro vídeo'}],url:'SEGREDO2'}];
 const options={studentPrograms:()=>({items:[{academy:a,enrollment,map}]})};
 const prepare=prepareFactory(()=>true,options,courses,{m1:['l1']},'Aluno de teste');
 const result=prepare('academy-1');
 assert.equal(result.academy.id,'academy-1');
 assert.equal(result.resume.name,'Segundo vídeo');
 assert.equal(result.courses.length,1);
 assert.equal(result.courses[0].id,'m1');
 assert.ok(!JSON.stringify(result.courses).includes('SEGREDO'));
 assert.equal(prepare('academy-2'),null);
 assert.equal(prepareFactory(()=>false,options,courses,{},'Aluno')('academy-1'),null);
});
test('Portal cobre a tela e espera mensagem com token exclusivo por abertura',()=>{
 assert.match(css,/body\.academy-immersive/);
 assert.match(css,/#contremAcademyIntegratedFrame\[hidden\]/);
 assert.match(parent,/frame\.setAttribute\('src','\.\/trilha-formacao\/\?integrated=1&request='/);
 assert.match(parent,/crypto\.randomUUID\(\)/);
 assert.match(parent,/event\.origin!==location\.origin/);
 assert.match(parent,/msg\?\.request!==portalRequest/);
 assert.match(parent,/contrem:academy-displayed/);
 assert.match(child,/msg\.request!==request/);
 assert.match(child,/contrem:academy-displayed/);
});
test('Voltar à conta e abrir sala respeitam autorização de módulo',()=>{
 assert.match(parent,/msg\.action==='back'/);
 assert.match(parent,/hidePortalFrame\(\);show\('studentView'\)/);
 assert.match(parent,/item\.map\.items\.some\(m=>m\.id===msg\.moduleId&&m\.canOpen\)/);
 assert.match(parent,/returnToAcademy=academyId;/);
 assert.match(parent,/openCourse\(moduleId\)/);
});
test('ADM edita a apresentação por Academia sem retirar o editor de aulas',()=>{
 for(const field of ['heroKicker','heroTitle','heroHighlight','heroDescription','stageHeading','coverUpload','cardTitle','cardDescription']){
  assert.ok(parent.includes(field),'campo obrigatório: '+field);
 }
 assert.match(store,/heroTitle:String\(value\.heroTitle/);
 assert.match(store,/stageHeading:String\(value\.stageHeading/);
 assert.match(parent,/reader\.readAsDataURL\(image\)/);
 assert.match(parent,/editCourse\(id\)/);
});
