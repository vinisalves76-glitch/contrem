/* CONTREM Academia · Navegação isolada por área do aluno.
 * Mantém todos os IDs e controladores legados intactos para não perder progresso. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const labels={
  home:'Minha aprendizagem',academies:'Minhas Academias',courses:'Meus cursos',
  performance:'Meu desempenho',profile:'Meu perfil',certificates:'Certificados'
 };
 const areas={};
 let ready=false,connected=false,current='home',account={};
 const createArea=(id,items)=>{
  const area=document.createElement('section');
  area.id='studentArea'+id[0].toUpperCase()+id.slice(1);
  area.className='student-nav-area';
  area.dataset.area=id;
  area.hidden=true;
  for(const element of items)if(element)area.append(element);
  return area;
 };
 function makeProfile(){
  const panel=document.createElement('section');
  panel.className='panel student-account-summary';
  panel.id='studentAccountSummary';
  panel.innerHTML='<div class="tag">MEU PERFIL</div><h2>Dados da minha conta</h2>'+
   '<p class="muted">Seus dados de identificação são cadastrados pela administração da CONTREM Academia.</p>'+
   '<div class="student-account-fields">'+
   '<div><span>Nome completo</span><strong id="studentAccountName"></strong></div>'+
   '<div><span>E-mail de acesso</span><strong id="studentAccountEmail"></strong></div>'+
   '<div id="studentAccountCompanyRow" hidden><span>Empresa</span><strong id="studentAccountCompany"></strong></div>'+
   '<div id="studentAccountRoleRow" hidden><span>Cargo / função</span><strong id="studentAccountRole"></strong></div>'+
   '</div><p class="student-account-note">Para corrigir os dados cadastrais, entre em contato com o administrador da Academia.</p>';
  return panel;
 }
 function updateAccount(data={}){
  account={...account,...data};
  if(!$('studentAccountName'))return;
  $('studentAccountName').textContent=account.name||'Aluno';
  $('studentAccountEmail').textContent=account.email||'E-mail indisponível';
  const company=String(account.company||'').trim(),jobTitle=String(account.jobTitle||'').trim();
  $('studentAccountCompanyRow').hidden=!company;
  $('studentAccountRoleRow').hidden=!jobTitle;
  $('studentAccountCompany').textContent=company;
  $('studentAccountRole').textContent=jobTitle;
 }
 function setup(){
  if(ready)return;
  const view=$('studentView');
  if(!view||!$('connectedMyAcademies'))return;
  const profile=$('my-profile');
  profile.hidden=true;
  profile.setAttribute('aria-hidden','true');
  profile.classList.add('legacy-student-profile');
  areas.home=createArea('home',[view.querySelector('.welcome-row'),view.querySelector('.learning-banner'),view.querySelector(':scope > .stats')]);
  areas.academies=createArea('academies',[$('connectedMyAcademies')]);
  areas.courses=createArea('courses',[$('my-courses'),$('courseGrid')]);
  areas.performance=createArea('performance',[$('my-performance'),$('my-history')]);
  areas.profile=createArea('profile',[makeProfile(),profile]);
  areas.certificates=createArea('certificates',[$('my-certificates')]);
  const quick=document.createElement('div');
  quick.className='student-home-shortcuts';
  quick.innerHTML='<button class="student-home-shortcut" type="button" data-student-area="academies"><span class="student-shortcut-icon" aria-hidden="true">◈</span><span><strong>Minhas Academias</strong><small>Acompanhe suas trilhas de formação</small></span><span aria-hidden="true">→</span></button>'+
   '<button class="student-home-shortcut" type="button" data-student-area="courses"><span class="student-shortcut-icon" aria-hidden="true">▷</span><span><strong>Meus cursos</strong><small>Consulte os cursos disponíveis</small></span><span aria-hidden="true">→</span></button>'+
   '<button class="student-home-shortcut" type="button" data-student-area="performance"><span class="student-shortcut-icon" aria-hidden="true">▥</span><span><strong>Meu desempenho</strong><small>Acompanhe seu desenvolvimento</small></span><span aria-hidden="true">→</span></button>';
  areas.home.append(quick);
  for(const area of Object.values(areas))view.append(area);
  for(const area of view.querySelectorAll(':scope > [data-student-section]')){
   const key=area.dataset.studentSection;
   labels[key]=area.dataset.label;
   areas[key]=area;
  }
  ready=true;
  view.dataset.studentNavigation='ready';
  // Os links antigos eram âncoras sem controlador. Agora mudam áreas de fato.
  const targets={'my-courses':'courses','my-performance':'performance',
   'my-profile':'profile','my-certificates':'certificates'};
  for(const button of document.querySelectorAll('#studentNav [data-jump], .learning-banner [data-jump]')){
   button.addEventListener('click',event=>{
    if(!connected)return;
    const target=targets[button.dataset.jump];
    if(!target)return;
    event.preventDefault();
    go(target);
   });
  }
  $('studentTab').addEventListener('click',()=>{if(connected)go('home');});
  $('studentNav').addEventListener('click',event=>{
   const button=event.target.closest('button[data-student-area]');
   if(button&&connected)go(button.dataset.studentArea);
  });
  view.addEventListener('click',event=>{
   const button=event.target.closest('[data-student-area]');
   if(button&&connected)go(button.dataset.studentArea);
  });
  $('back')?.addEventListener('click',()=>{if(connected)go(current||'courses');});
 }
 function go(target){
  if(!connected||!areas[target])return false;
  if($('connectedAcademyOverlay')?.hidden===false)return false;
  if($('studentView').classList.contains('hidden'))show('studentView');
  for(const [name,area] of Object.entries(areas)){
   area.hidden=name!==target;
   area.classList.toggle('current',name===target);
  }
  current=target;
  if(areas[target].hasAttribute('data-student-section')&&$('contremIntro'))$('contremIntro').hidden=true;
  const nav=$('studentNav');
  const menuTargets={
   studentTab:'home',myAcademiesConnectedTab:'academies'
  };
  for(const button of nav.querySelectorAll('button')){
   const area=menuTargets[button.id]||button.dataset.studentArea||{
    'my-courses':'courses','my-performance':'performance',
    'my-profile':'profile','my-certificates':'certificates'
   }[button.dataset.jump];
   if(!area)continue;
   const active=area===target;
   button.classList.toggle('active',active);
   if(active)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
  }
  $('workspaceLabel').textContent=labels[target];
  window.scrollTo({top:0,behavior:'instant'});
  return true;
 }
 window.addEventListener('contrem:academy-session-ready',event=>{
  const info=event.detail||{};
  if(info.role!=='student'){connected=false;return;}
  setup();
  if(!ready)return;
  connected=true;
  updateAccount(info);
  go('home');
 });
 window.addEventListener('contrem:academy-session-ended',()=>{
  connected=false;current='home';account={};
  for(const area of Object.values(areas))area.hidden=area!==areas.home;
 });
 window.CONTREM_STUDENT_NAV={go,updateAccount,getCurrent:()=>current};
})();
