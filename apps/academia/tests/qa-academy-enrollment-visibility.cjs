'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const code=fs.readFileSync(path.resolve(__dirname,'../supabase/functions/academy-programs/index.ts'),'utf8');
const ui=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-connected-ui.js'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-connected-ui.css'),'utf8');
const extract=(text,a,b)=>{
 const start=text.indexOf(a),end=text.indexOf(b,start);
 assert.ok(start>=0&&end>start,'missing code segment: '+a);return text.slice(start,end);
};
test('Consulta my inclui formações matriculadas em rascunho, mas só matrículas ativas',()=>{
 const query=extract(code,"  if(action==='my'){","  return reply(400,error(400,'Operação não reconhecida.'))");
 assert.match(query,/\.eq\('member_id',m\.id\)\.eq\('active',true\)/);
 assert.match(query,/\.select\('id,title,status,definition'\)\.in\('id',ids\)/);
 assert.doesNotMatch(query,/\.eq\('status','published'\)/);
 assert.match(query,/p\.status==='published'/);
 assert.match(query,/unpublishedEnrollmentProjection\(p,enrollment,m\.display_name\)/);
});
test('API não expõe aulas, vídeos ou descrição de formações não publicadas',()=>{
 const projection=extract(code,'function unpublishedEnrollmentProjection(', 'function studentProjection(');
 assert.doesNotMatch(projection,/program\.definition/);
 assert.match(projection,/stages:\[\]/);
 assert.match(projection,/courses:\[\]/);
 assert.match(projection,/active:false/);
 assert.match(projection,/status:'waiting'/);
 assert.match(projection,/Aguardando publicação/);
 const plainJs=projection.replace('program:Json,enrollment:Json,studentName:string','program,enrollment,studentName');
 const runner=new Function('program','enrollment','studentName',plainJs+';return unpublishedEnrollmentProjection(program,enrollment,studentName);');
 const response=runner({id:'academy-test',title:'Curso de Formação',status:'draft',definition:{modules:[{id:'secret',videoId:'secret-url'}]}},{active:true,expires_on:null},'Aluno');
 assert.equal(response.academy.title,'Curso de Formação');
 assert.equal(response.map.active,false);
 assert.equal(response.publicationStatus,'draft');
 assert.equal(response.map.items.length,0);
 assert.equal(response.courses.length,0);
 assert.equal(JSON.stringify(response).includes('secret-url'),false);
});
test('Cartão do aluno identifica pre-matrícula sem habilitar acesso antecipado',()=>{
 const render=extract(ui,' function renderStudent(){',' function seedDefinition(){');
 assert.match(render,/payload\.publicationStatus==='published'/);
 assert.match(render,/const ready=published&&enrolled/);
 assert.match(render,/MATRÍCULA CONFIRMADA · AGUARDANDO PUBLICAÇÃO/);
 assert.match(render,/Aguardando publicação/);
 assert.match(render,/if\(ready\)card\.querySelector\('button'\)\.onclick=\(\)=>openPortal\(payload\)/);
 assert.match(render,/!ready\?'disabled '/);
 assert.match(css,/\.connected-program-card\.awaiting-publication/);
});
test('Publicada com matrícula ativa abre; arquivada, rascunho e vencida não abrem',()=>{
 const cases=[
  {status:'draft',active:false,expected:false},
  {status:'archived',active:false,expected:false},
  {status:'published',active:true,expected:true},
  {status:'published',active:false,expected:false}
 ];
 const rendered=extract(ui,' function renderStudent(){',' function seedDefinition(){');
 const factory=new Function('myPrograms','$','studentSection','document','esc','openPortal','reloadStudent',
    rendered+';return renderStudent;');
 for(const t of cases){
  const button={disabled:false,onclick:null};
  const card={classList:{toggle(){}},set innerHTML(value){this.html=value;button.disabled=/ disabled /.test(value)},querySelector:()=>button};
  const list={innerHTML:'',children:[],append(value){this.children.push(value)}};
  const root={hidden:false,innerHTML:''};
  const lookup=id=>id==='connectedAcademyCards'?list:{onclick:null};
  const p={publicationStatus:t.status,
   academy:{id:'academy-test',title:'Formação',stages:[]},
   enrollment:{active:t.active},map:{active:t.active,items:[]}};
  factory([p],lookup,root,{createElement:()=>card},x=>String(x),()=>{},()=>{})();
  assert.equal(button.disabled,!t.expected,t.status+' disabled');
  assert.equal(typeof button.onclick==='function',t.expected,t.status+' clickable');
  assert.equal(list.children.length,1);
 }
});
