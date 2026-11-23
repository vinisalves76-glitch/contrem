'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const navCode=fs.readFileSync(path.join(root,'src/assets/student-navigation.js'),'utf8');
const navCSS=fs.readFileSync(path.join(root,'src/assets/student-navigation.css'),'utf8');
const html=fs.readFileSync(path.join(root,'src/index.html'),'utf8');
const cloud=fs.readFileSync(path.join(root,'src/assets/cloud-ui.js'),'utf8');
const service=fs.readFileSync(path.join(root,'src/assets/cloud-service.js'),'utf8');
const adminAPI=fs.readFileSync(path.join(root,'supabase/functions/academy-students/index.ts'),'utf8');
const connected=fs.readFileSync(path.join(root,'src/assets/academy-connected-ui.js'),'utf8');
function fake(){
 const byId=new Map(),listeners=new Map(),scrolls=[],showCalls=[];
 const el=id=>{
  if(byId.has(id))return byId.get(id);
  const classSet=new Set(),events=new Map(),attributes={};
  const node={id,children:[],hidden:false,style:{},dataset:{},textContent:'',
   append(...parts){this.children.push(...parts);},
   after(){},
   setAttribute:(k,v)=>attributes[k]=v,
   removeAttribute:k=>delete attributes[k],
   addEventListener:(k,cb)=>events.set(k,cb),
   events,attributes,
   classList:{add:k=>classSet.add(k),remove:k=>classSet.delete(k),
    toggle:(k,force)=>{const bool=force===undefined?!classSet.has(k):force;
     if(bool)classSet.add(k);else classSet.delete(k);return bool;},
    contains:k=>classSet.has(k)},
   querySelector(q){
    const targets={'.welcome-row':'welcome','.learning-banner':'banner',':scope > .stats':'stats'};
    return targets[q]?el(targets[q]):null;
   },
   querySelectorAll(q){return q==='button'?
    [el('studentTab'),el('myAcademiesConnectedTab'),el('jumpCourses'),el('jumpPerformance'),el('jumpProfile'),el('jumpCertificates')]:[];}
  };
  byId.set(id,node);return node;
 };
 for(const id of ['studentView','connectedMyAcademies','my-profile','my-courses','courseGrid',
  'my-performance','my-history','my-certificates','studentNav','studentTab','myAcademiesConnectedTab',
  'workspaceLabel','back','connectedAcademyOverlay','studentAccountName','studentAccountEmail',
  'studentAccountCompanyRow','studentAccountRoleRow','studentAccountCompany','studentAccountRole',
  'jumpCourses','jumpPerformance','jumpProfile','jumpCertificates','heroCourseCTA'])el(id);
 const menu={jumpCourses:'my-courses',jumpPerformance:'my-performance',
 jumpProfile:'my-profile',jumpCertificates:'my-certificates',heroCourseCTA:'my-courses'};
 for(const [id,jump] of Object.entries(menu))el(id).dataset.jump=jump;
 el('connectedAcademyOverlay').hidden=true;
 const doc={getElementById:el,createElement:()=>el('dynamic-'+byId.size),
  querySelectorAll:q=>q==='#studentNav [data-jump], .learning-banner [data-jump]'?
  Object.keys(menu).map(el):[]};
 const win={addEventListener:(name,cb)=>listeners.set(name,cb),
  scrollTo:args=>scrolls.push(args)};
 const appShow=to=>{showCalls.push(to);el('studentView').classList.remove('hidden');};
 new Function('window','document','show',navCode)(win,doc,appShow);
 return{byId,el,win,doc,listeners,scrolls,showCalls,
  login:info=>listeners.get('contrem:academy-session-ready')({detail:info}),
  logout:()=>listeners.get('contrem:academy-session-ended')()};
}
test('Cadastro do ADM possui nome, e-mail, senha inicial, empresa e função opcionais',()=>{
 for(const id of ['studentFullName','studentEmail','studentPassword','studentCompany','studentJobTitle'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(cloud,/studentCompany'\)\.value\.trim\(\)/);
 assert.match(cloud,/studentJobTitle'\)\.value\.trim\(\)/);
 assert.match(service,/createStudent\(name,email,password,company='',jobTitle=''\)/);
 assert.match(adminAPI,/profile:\{fullName:name,email,company,role:jobTitle\}/);
 assert.match(adminAPI,/company\.length>100\|\|jobTitle\.length>100/);
});
test('Identificação antiga fica oculta e perfil é apenas leitura',()=>{
 const app=fake();
 app.login({role:'student',name:'Aluno Teste',email:'aluno@example.com',company:'Contrem',jobTitle:'Aprendiz'});
 const legacy=app.el('my-profile');
 assert.equal(legacy.hidden,true);
 assert.equal(legacy.attributes['aria-hidden'],'true');
 assert.match(navCSS,/\.legacy-student-profile/);
 assert.equal(app.el('studentAccountName').textContent,'Aluno Teste');
 assert.equal(app.el('studentAccountEmail').textContent,'aluno@example.com');
 assert.equal(app.el('studentAccountCompany').textContent,'Contrem');
 assert.equal(app.el('studentAccountRole').textContent,'Aprendiz');
 assert.equal(html.includes('student-navigation.js'),true);
});
test('Cada menu mostra somente sua área; Minha aprendizagem não exibe módulos dos outros menus',()=>{
 const a=fake();
 a.login({role:'student',name:'Aluno',email:'aluno@example.com'});
 const nav=a.win.CONTREM_STUDENT_NAV,ids=['home','academies','courses','performance','profile','certificates'];
 const expected={
 home:['welcome','banner','stats'],
 academies:['connectedMyAcademies'],
 courses:['my-courses','courseGrid'],
 performance:['my-performance','my-history'],
 profile:['studentAccountSummary','my-profile'],
 certificates:['my-certificates']
 };
 for(const name of ids){
  assert.equal(nav.go(name),true);
  assert.equal(a.el('workspaceLabel').textContent,{
   home:'Minha aprendizagem',academies:'Minhas Academias',courses:'Meus cursos',
   performance:'Meu desempenho',profile:'Meu perfil',certificates:'Certificados'
  }[name]);
  for(const section of ids){
   const element=a.el('studentArea'+section[0].toUpperCase()+section.slice(1));
   assert.equal(element.hidden,section!==name,section+' visible for '+name);
  }
  const area=a.el('studentArea'+name[0].toUpperCase()+name.slice(1));
  for(const subId of expected[name])assert.ok(area.children.some(c=>c.id===subId),subId+' belongs to '+name);
 }
 assert.equal(a.el('my-profile').hidden,true);
 assert.ok(a.scrolls.length>=ids.length);
});
test('Menu antigo e CTA levam à seção escolhida sem rolagem por âncora',()=>{
 const app=fake();
 app.login({role:'student'});
 app.el('jumpCourses').events.get('click')({preventDefault(){}});
 assert.equal(app.win.CONTREM_STUDENT_NAV.getCurrent(),'courses');
 app.el('heroCourseCTA').events.get('click')({preventDefault(){}});
 assert.equal(app.win.CONTREM_STUDENT_NAV.getCurrent(),'courses');
 app.el('jumpPerformance').events.get('click')({preventDefault(){}});
 assert.equal(app.win.CONTREM_STUDENT_NAV.getCurrent(),'performance');
 app.el('back').events.get('click')();
 assert.equal(app.win.CONTREM_STUDENT_NAV.getCurrent(),'performance');
 app.el('studentTab').events.get('click')();
 assert.equal(app.win.CONTREM_STUDENT_NAV.getCurrent(),'home');
 assert.match(connected,/CONTREM_STUDENT_NAV\?\.go/);
 assert.match(connected,/go\('academies'\)/);
});
test('Separação não altera controles dos cursos, matrículas e player',()=>{
 assert.match(html,/id="courseGrid"/);
 assert.match(html,/id="player"/);
 assert.match(html,/id="my-certificates"/);
 assert.match(html,/id="connectedMyAcademies"/);
 assert.match(cloud,/contrem:academy-session-ready/);
 assert.match(connected,/api\('my'\)/);
 assert.doesNotMatch(navCode,/removeChild|\\.remove\(/);
});
