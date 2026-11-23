/* Authenticated-looking preview portal: visual shell is the approved original design.
   Receives restricted VIEW DATA from the parent Academy session; never authenticates itself.
   Browser-only sandbox: production must enforce enrolment server-side. */
(() => {
 'use strict';
 const params=new URLSearchParams(location.search);
 if(params.get('integrated')!=='1')return;
 const $=id=>document.getElementById(id),query=selector=>document.querySelector(selector);
 const safeText=value=>String(value??'');
 const root=document.documentElement;
 const request=new URLSearchParams(location.search).get('request');
 const labels={blocked:'BLOQUEADO',inactive:'DESATIVADO PELO ADM',preparing:'ATIVO · VÍDEO PENDENTE',expired:'ACESSO INDISPONÍVEL',approved:'APROVADO',
  available:'DISPONÍVEL','awaiting-exam':'PROVA DISPONÍVEL',failed:'AGUARDANDO NOVA TENTATIVA',
  'retry-pending':'AGUARDANDO ADM MASTER','retry-approved':'TENTATIVA AUTORIZADA'};
 let data=null,current='overview',selectedModule=null;
 const ask=(action,more={})=>{if(window.parent===window||!request)return;window.parent.postMessage({type:'contrem:academy-action',request,action,...more},location.origin);};
 function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=safeText(text);if(className)node.className=className;return node;}
 function tab(name){
  if(!data)return;
  if(!['overview','modules','lab','about','detail'].includes(name))return;
  current=name;document.querySelectorAll('.view').forEach(view=>{view.hidden=view.id!=='view-'+name;});
  document.querySelectorAll('.side-nav [data-tab]').forEach(button=>button.classList.toggle('current',button.dataset.tab===name));
  $('sidebar').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');
  window.scrollTo({top:0,behavior:'auto'});
 }
 const allModules=()=>data?.map?.items||[];
 const findModule=id=>allModules().find(item=>item.id===id);
 const course=id=>data?.courses?.find(item=>item.id===id)||null;
 const canEnter=m=>!!data?.map?.active&&m?.canOpen===true;
 function heading(text,highlight){
  const title=$('overview-title');title.replaceChildren();
  const line=safeText(text||data.academy.title);
  const part=safeText(highlight).trim(),at=part?line.toLocaleLowerCase('pt-BR').indexOf(part.toLocaleLowerCase('pt-BR')):-1;
  if(at<0){title.textContent=line;return;}
  title.append(document.createTextNode(line.slice(0,at)),element('em',line.slice(at,at+part.length)),document.createTextNode(line.slice(at+part.length)));
 }
 function stat(card,value,suffix){
  const output=card?.querySelector('.stat-num');if(!output)return;
  output.replaceChildren(document.createTextNode(String(value)));
  if(suffix)output.append(element('small',' '+suffix));
 }
 function updateOverview(){
  const a=data.academy,stages=a.stages||[],modules=allModules(),total=modules.reduce((sum,m)=>sum+(Number(m.hours)||0),0);
  const pct=modules.length?Math.round(100*data.map.approved/modules.length):0;
  const kicker=query('.hero-overline');
  kicker.textContent=safeText(a.heroKicker||'TRILHA DE CONHECIMENTO · FORMAÇÃO ONLINE');
  heading(a.heroTitle||a.title,a.heroHighlight||'');
  query('.hero-copy > p').textContent=safeText(a.heroDescription||a.description||'Conheça a sua jornada de formação técnica.');
  const cover=safeText(a.cover||'');
  const safeCover=/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(cover)||/^https:\/\/[\w.\-]+(?:[:\d]+)?\/[\w\-./?=&%#+]*$/i.test(cover);
  if(safeCover)query('.hero-visual').style.backgroundImage='linear-gradient(92deg,#16263a11,#10213655),url('+JSON.stringify(cover)+')';
  const pills=query('.hero-pills');pills.replaceChildren();
  ['◉ 100% online','◎ '+(a.audience?'Formação técnica':'Multimarcas'),'✦ '+modules.length+' módulos'].forEach(x=>pills.append(element('span',x)));
  const cards=document.querySelectorAll('.stats-grid .stat-card');
  stat(cards[0],modules.length,'módulos');stat(cards[1],total,'horas');stat(cards[2],data.map.approved,'aprovados');
  stat(cards[3],pct,'%');$('overviewBar').style.width=pct+'%';
  cards[3].querySelector('.stat-sub').textContent='Progresso na formação';
  query('.section-intro.intro-top .muted-label').textContent='PROGRAMA · CONTREM';
  const eyebrow=query('.section-intro:not(.intro-top) h2');
  if(eyebrow)eyebrow.textContent='Módulos da sua formação';
  const stageGrid=query('.stage-grid');stageGrid.replaceChildren();
  stageGrid.style.gridTemplateColumns='repeat(auto-fit,minmax(230px,1fr))';
  modules.forEach((module,i)=>{
   const btn=element('button',undefined,'stage stage-'+(i%3+1));btn.type='button';btn.dataset.module=module.id;
   btn.append(element('span','MÓDULO '+String(i+1).padStart(2,'0'),'stage-index'),
    element('span',module.canOpen?'✓':'◇','stage-symbol'),
    element('strong',module.name),
    element('small',module.lessons+' aulas · '+(labels[module.status]||'EM PREPARAÇÃO')));
   const foot=element('span',undefined,'stage-footer');
   foot.append(document.createTextNode(module.canOpen?'ACESSAR MÓDULO':'VISUALIZAR MÓDULO'),element('i','→'));
   btn.append(foot);stageGrid.append(btn);
  });
  document.querySelectorAll('.nav-trailing').forEach(label=>label.textContent=String(modules.length));
  query('.section-intro .text-button').textContent='Ver os '+modules.length+' módulos →';
  const resume=data.resume||null;
  query('.resume-text .eyebrow').textContent=resume?.status==='completed'?'FORMAÇÃO CONCLUÍDA':resume?.status==='blocked'?'ACESSO INDISPONÍVEL':resume?.started?'CONTINUE DE ONDE PAROU':'PRIMEIRO PASSO';
  query('.resume-text h3').textContent=resume?.status==='completed'?'Todos os módulos concluídos':resume?.name||'Comece sua formação';
  query('.resume-text p').textContent=resume?.description||'Acompanhe seus módulos, aulas e atividades na trilha.';
  $('startSample').textContent=resume?.status==='completed'?'Ver minha trilha →':resume?.moduleId&&data.map.active?'Continuar aprendendo →':'Ver minha trilha →';
  query('.breadcrumb b').textContent=a.title;
  query('.top-actions').replaceChildren(element('span','●','status-dot'),document.createTextNode(' ALUNO MATRICULADO '),element('span',safeText(data.studentName||'Aluno').trim().split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase().slice(0,2),'avatar'));
  query('.sidebar-feature b').textContent='Sua jornada de conhecimento.';
  query('.sidebar-feature p').textContent=a.title;
  query('.sidebar-foot').textContent='© CONTREM ACADEMIA';
  query('.footer').replaceChildren(element('span','CONTREM ACADEMIA · Formação online'),element('span',a.title));
 }
 function updateModules(){
  const academy=data.academy,stages=academy.stages||[],modules=allModules();
  const hours=modules.reduce((sum,m)=>sum+(Number(m.hours)||0),0),pct=modules.length?Math.round(data.map.approved/modules.length*100):0;
  $('modules-title').textContent='Mapa de aprendizagem.';
  query('#view-modules .page-heading p').textContent=modules.length+' módulos na ordem da formação. O próximo módulo exige aprovação nas aulas e na prova final do anterior.';
  const summary=document.querySelectorAll('.track-summary > div');
  if(summary[0])summary[0].querySelector('strong').textContent=hours+'h';
  if(summary[1])summary[1].querySelector('strong').textContent=modules.length;
  if(summary[2])summary[2].querySelector('strong').textContent=data.map.approved;
  $('trackProgressLabel').textContent=pct+'% concluído';$('trackProgressBar').style.width=pct+'%';
  query('.disclaimer-note').textContent='A formação exige a conclusão das aulas e aprovação na avaliação de cada módulo. Novas tentativas após reprovação exigem autorização do ADM Master.';
  const list=$('moduleList');list.replaceChildren();
  stages.forEach((stage,index)=>{
   const section=element('section',undefined,'stage-group');section.dataset.stageIndex=String(index);
   // Manter as associações internas legadas sem exibir uma hierarquia de etapas ao aluno.
   const grid=element('div',undefined,'module-items');
   (stage.moduleIds||[]).forEach((id,i)=>{
    const m=findModule(id);if(!m)return;
    const btn=element('button',undefined,'module-card'+(canEnter(m)?' first':''));btn.type='button';btn.dataset.module=id;
    btn.append(element('div',undefined,'module-card-top'),element('h3',m.name),element('p',course(id)?.description||'Unidade de aprendizagem da formação.'));
    const chip=element('span',labels[m.status]||'AGUARDANDO');
    chip.className='module-chip'+(m.passed?' sample':'');
    btn.querySelector('.module-card-top').append(element('span','M'+String(modules.findIndex(x=>x.id===id)+1).padStart(2,'0'),'module-card-id'),chip);
    const footer=element('div',undefined,'module-card-footer');footer.append(element('span',m.hours+'h · '+m.lessons+' aulas'),element('span','→'));btn.append(footer);
    if(!canEnter(m))btn.classList.add('locked');grid.append(btn);
   });
   section.append(grid);list.append(section);
  });
 }
 function showModule(id){
  const m=findModule(id),c=course(id);if(!m)return;
  selectedModule=id;
  const stageIndex=data.academy.stages.findIndex(stage=>(stage.moduleIds||[]).includes(id));
  $('detail-stage').textContent='MÓDULO '+String(allModules().findIndex(x=>x.id===id)+1).padStart(2,'0')+' / '+safeText(data.academy.title).toUpperCase();
  $('detail-title').textContent=m.name;
  $('detail-summary').textContent=c?.description||'Módulo da formação '+data.academy.title+'.';
  $('detail-count').textContent=String(allModules().findIndex(x=>x.id===id)+1).padStart(2,'0');
  $('detail-tags').replaceChildren();
  [m.hours+'h',m.lessons+' aulas',labels[m.status]||'MÓDULO'].forEach(label=>$('detail-tags').append(element('span',label)));
  const lessons=$('detail-lessons');lessons.replaceChildren();
  for(const l of c?.lessons||[])lessons.append(element('li',l.name));
  if(!c?.lessons?.length)lessons.append(element('li','Conteúdo disponível conforme liberação da trilha.'));
  $('detail-goal').textContent=c?.description||'Aprender e aplicar os conceitos previstos nesta unidade.';
  $('lesson-title').textContent=canEnter(m)?'Continuar estudando: '+m.name:'Módulo bloqueado';
  $('lesson-goal').textContent=canEnter(m)
   ?(m.hasVideo?'Acesse a sala de aula. Para avançar, conclua cada vídeo e a atividade, quando houver.':
     'Módulo ativado pelo ADM. Você já pode acessar a sala, mas as aulas aguardam os vídeos Mux e não podem ser concluídas.')
   :m.status==='inactive'?'Este módulo está desativado pelo ADM. Seu progresso anterior permanece salvo.':
   'Conclua os módulos anteriores e mantenha sua matrícula ativa para liberar as aulas.';
  query('.lesson-head .eyebrow').textContent='SALA DE AULA · CONTREM ACADEMIA';
  query('.lesson-head .tiny-pill').textContent=canEnter(m)?'LIBERADO':'BLOQUEADO';
  query('.lesson-description').textContent=canEnter(m)?(m.hasVideo?'Aulas e atividades liberadas conforme o progresso do aluno.':'O módulo está ativo. Os vídeos ainda serão cadastrados pelo ADM.'):'Este módulo está protegido pelas regras de progressão.';
  const mock=query('.video-fake');mock.replaceChildren();
  mock.style.display='grid';mock.style.placeItems='center';
  const open=element('button',canEnter(m)?'Abrir sala de aula →':'Módulo indisponível','btn btn-orange');
  open.type='button';open.disabled=!canEnter(m);
  open.addEventListener('click',()=>ask('open-module',{academyId:data.academy.id,moduleId:id}));
  mock.append(open);
  query('.quiz-box').hidden=true;
  tab('detail');
 }
 function updateAbout(){
  const a=data.academy,m=allModules();
  $('about-title').textContent=a.title;
  query('#view-about .page-heading p').textContent=a.description||'Formação técnica online da CONTREM Academia.';
  const panels=document.querySelectorAll('.about-panel');
  if(panels[0]){
   panels[0].querySelector('h2').textContent=a.audience||'Para quem deseja desenvolver conhecimento técnico.';
   panels[0].querySelector('p').textContent=a.objectives||'Percurso estruturado em módulos, com aulas e avaliações.';
   panels[0].querySelector('.about-highlights').replaceChildren(element('span','✓ Formação por módulos'),element('span','✓ Progressão após aprovação'),element('span','✓ Material de apoio'));
  }
  if(panels[1]){
   panels[1].querySelector('h2').textContent='Teoria com aplicação visual.';
   panels[1].querySelector('p').textContent='Aulas, vídeos Mux, materiais complementares e avaliações dentro do ambiente de aprendizagem.';
   panels[1].querySelector('.about-highlights').replaceChildren(element('span',m.length+' módulos'),element('span',m.reduce((s,x)=>s+Number(x.hours||0),0)+' horas'),element('span',m.length+' módulos de aprendizagem'));
  }
  query('.certificate-info p').textContent=a.certificateEnabled?'O certificado de conclusão estará disponível após a aprovação em todos os módulos e o cumprimento das regras da formação.':'Esta formação não possui certificado final habilitado. Consulte o ADM para informações.';
 }
 function updateLab(){
  $('lab-title').textContent='Laboratório virtual.';
  query('#view-lab .page-heading p').textContent='Espaço de experiências e simulações técnicas. Conteúdo complementar em desenvolvimento.';
  query('.lab-layout').hidden=true;
  query('.lab-warning').textContent='As futuras atividades serão educativas e não substituem procedimentos reais de manutenção ou treinamentos práticos supervisionados.';
 }
 function onMessage(event){
  if(event.origin!==location.origin||event.source!==window.parent)return;
  const msg=event.data;
  if(msg?.type!=='contrem:academy-data'||msg.request!==request||msg.payload?.academy?.id!==msg.academyId)return;
  const payload=msg.payload;
  if(!payload.map||!Array.isArray(payload.map.items)||!Array.isArray(payload.academy.stages))return;
  try{
   data=payload;
   updateOverview();updateModules();updateAbout();updateLab();
   if(selectedModule&&findModule(selectedModule))showModule(selectedModule);
   else tab(current==='detail'?'modules':current);
   root.dataset.portalIntegrated='ready';
   window.parent.postMessage({type:'contrem:academy-displayed',request,academyId:payload.academy.id},location.origin);
  }catch(error){
   window.parent.postMessage({type:'contrem:academy-error',request,message:String(error?.message||error)},location.origin);
  }
 }
 function start(){
  if(window.parent===window){document.body.textContent='Acesse esta formação pelo seu login na CONTREM Academia.';root.dataset.portalIntegrated='ready';return;}
  query('.preview-banner')?.remove();
  query('.hero-actions a[href*="trilha="]')?.remove();
  const back=element('button','← Voltar para meu perfil','side-nav-item portal-return');
  back.type='button';back.id='returnToProfile';back.onclick=()=>ask('back');
  const nav=query('.side-nav');nav.append(back);
  query('.brand').addEventListener('click',event=>{event.preventDefault();if(data)tab('overview');});
  document.addEventListener('click',event=>{
   const navButton=event.target.closest('[data-tab]');
   if(navButton){event.preventDefault();if(data)tab(navButton.dataset.tab);return;}
   const stage=event.target.closest('[data-stage]');
   if(stage&&data){tab('modules');const block=$('moduleList').querySelector('[data-stage-index="'+stage.dataset.stage+'"]');block?.scrollIntoView({block:'start',behavior:'smooth'});return;}
   const module=event.target.closest('[data-module]');
   if(module&&data){showModule(module.dataset.module);return;}
  });
  $('startSample').onclick=()=>{
   const resume=data?.resume;
   if(resume?.moduleId&&data.map.active)ask('open-module',{academyId:data.academy.id,moduleId:resume.moduleId});
   else tab('modules');
  };
  $('menuToggle').onclick=()=>{const menu=$('sidebar'),next=!menu.classList.contains('open');menu.classList.toggle('open',next);$('menuToggle').setAttribute('aria-expanded',String(next));};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){$('sidebar').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');}});
  window.addEventListener('message',onMessage);
  window.parent.postMessage({type:'contrem:academy-ready',request},location.origin);
 }
 try{start();}
 catch(error){
  root.dataset.portalIntegrated='ready';
  if(window.parent!==window)window.parent.postMessage({type:'contrem:academy-error',request,message:String(error?.message||error)},location.origin);
 }
})();
