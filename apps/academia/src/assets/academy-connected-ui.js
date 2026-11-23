/* CONTREM Academia · independent formations, connected to the real login and a server-authorized API.
 * This controller does not alter standalone courses, Supabase auth or the existing admin editor. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),esc=value=>String(value??'').replace(/[&<>"']/g,
   x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
 const copy=value=>JSON.parse(JSON.stringify(value)),core=window.CONTREM_PROGRAM_CORE;
 const newId=prefix=>prefix+'-'+crypto.randomUUID().replace(/-/g,'');
 let session=null,programs=[],selected=null,draft=null,students=[],enrollments=[],myPrograms=[],
  currentPayload=null,portalRequest=null,portalReady=false,currentModule=null;
 const studentView=$('studentView'),adminView=$('adminView'),adminNav=$('adminNav');
 const adminBtn=document.createElement('button');adminBtn.id='academiasConnectedTab';adminBtn.type='button';
 adminBtn.innerHTML='<span aria-hidden="true">▦</span> Academias';adminBtn.hidden=true;
 adminNav.insertBefore(adminBtn,$('studentsTab'));
 const studentBtn=document.createElement('button');studentBtn.id='myAcademiesConnectedTab';studentBtn.type='button';
 studentBtn.innerHTML='<span aria-hidden="true">◈</span> Minhas Academias';studentBtn.hidden=true;
 $('studentNav').insertBefore(studentBtn,$('studentNav').querySelector('[data-jump]'));
 const studentSection=document.createElement('section');
 studentSection.id='connectedMyAcademies';studentSection.className='connected-programs-home';
 studentSection.hidden=true;
 studentView.querySelector('.learning-banner').after(studentSection);
 const adminSection=document.createElement('section');
 adminSection.id='connectedAcademyAdmin';adminSection.className='connected-academy-admin';
 adminSection.hidden=true;
 adminView.append(adminSection);
 const overlay=document.createElement('div');overlay.id='connectedAcademyOverlay';overlay.hidden=true;
 overlay.innerHTML='<div class="connected-portal-loading" role="status" aria-live="polite"><div class="connected-logo">CONTREM <span>ACADEMIA</span></div><h2>Preparando sua Academia</h2><p>Abrindo o portal da formação.</p><button type="button" id="connectedPortalCancel">Voltar para meu perfil</button></div><iframe title="Portal da Academia CONTREM" id="connectedAcademyFrame" referrerpolicy="same-origin"></iframe><div id="connectedAcademyRoom" hidden></div>';
 document.body.append(overlay);
 const frame=$('connectedAcademyFrame'),room=$('connectedAcademyRoom'),loading=overlay.querySelector('.connected-portal-loading');
 const message=(value,error=false)=>{const t=$('connectedAcademyMessage');if(t){t.textContent=value||'';t.classList.toggle('error',error)}};
 const api=async(action,body={})=>{
  if(!session||!window.AcademyCloudMediaClient)throw Error('Entre na sua conta da CONTREM Academia.');
  const result=await window.AcademyCloudMediaClient.functions.invoke('academy-programs',{body:{action,...body}});
  if(result.error){
   let details=null;try{details=await result.error.context?.json?.()}catch{}
   throw Error(details?.error||result.error.message||'Operação indisponível. Tente novamente.');
  }
  return result.data;
 };
 const isMaster=()=>session?.role==='admin';
 const isEditor=()=>isMaster()||session?.role==='content_admin';
 const mask=()=>{
  adminBtn.hidden=!isEditor();studentBtn.hidden=isEditor()||!session;
  studentSection.hidden=isEditor()||!session;
  if(!session){adminSection.hidden=true;closePortal();}
 };
 const closeEditor=()=>{
  adminView.classList.remove('connected-academia-focused');
  adminSection.hidden=true;adminBtn.classList.remove('active');
 };
 const openEditor=async()=>{
  if(!isEditor())return;
  show('adminView');adminView.classList.add('connected-academia-focused');
  adminSection.hidden=false;adminBtn.classList.add('active');
  $('workspaceLabel').textContent='Academias';
  await reloadAdmin();
 };
 adminBtn.onclick=openEditor;
 adminNav.addEventListener('click',event=>{
  if(!event.target.closest('#academiasConnectedTab'))closeEditor();
 },true);
 studentBtn.onclick=()=>{
  if(!session||isEditor())return;
  closeEditor();show('studentView');
  studentSection.scrollIntoView({block:'start',behavior:'smooth'});
 };
 async function reloadAdmin(){
  message('Carregando as formações…');
  try{
   const result=await api('list');programs=result.programs||[];
   if(selected&&!programs.some(p=>p.id===selected))selected=null;
   if(selected){const current=programs.find(p=>p.id===selected);draft=copy(current.definition);}
   renderAdmin();message('');
  }catch(error){message(error.message,true);renderAdmin();}
 }
 async function reloadStudent(){
  if(!session||isEditor())return;
  try{const result=await api('my');myPrograms=result.academies||[];renderStudent();}
  catch(error){studentSection.innerHTML='<div class="connected-program-empty"><h3>Minhas Academias</h3><p>'+esc(error.message)+'</p><button type="button" id="retryAcademies">Tentar novamente</button></div>';$('retryAcademies').onclick=reloadStudent;}
 }
 function renderStudent(){
  studentSection.hidden=false;
  studentSection.innerHTML='<div class="connected-program-heading"><div><div class="tag">JORNADA DE FORMAÇÃO</div><h2>Minhas Academias</h2><p>Programas de aprendizagem com trilhas e módulos próprios.</p></div><button type="button" class="outline" id="refreshConnectedAcademies">Atualizar</button></div><div id="connectedAcademyCards" class="connected-program-grid"></div>';
  $('refreshConnectedAcademies').onclick=reloadStudent;
  const list=$('connectedAcademyCards');
  if(!myPrograms.length){list.innerHTML='<div class="connected-program-empty">Você ainda não tem matrícula em Academias. Os Cursos Avulsos continuam disponíveis acima.</div>';return;}
  for(const payload of myPrograms){
   const a=payload.academy,card=document.createElement('article');card.className='connected-program-card';
   card.innerHTML='<span class="connected-program-eyebrow">CONTREM ACADEMIA · FORMAÇÃO</span><h3>'+esc(a.title)+'</h3><p>'+esc(a.heroDescription||a.description||'')+'</p><div class="connected-program-meta">'+a.stages.length+' etapas · '+payload.map.items.length+' módulos</div><button class="primary" type="button">Abrir minha Academia →</button>';
   card.querySelector('button').onclick=()=>openPortal(payload);
   list.append(card);
  }
 }
 function seedDefinition(){
  const catalog=window.CONTREM_TRILHA_CATALOG;
  if(!catalog?.modules?.length)throw Error('Matriz da Formação de Mecânicos não carregada.');
  const stageContent=[
   {id:'academy-mec-stage-1',title:'Fundamentos',cardTitle:'Construa sua base técnica.',cardDescription:'Segurança, mecânica básica, metrologia e documentação.',moduleIds:[]},
   {id:'academy-mec-stage-2',title:'Sistemas',cardTitle:'Entenda como tudo funciona.',cardDescription:'Motores diesel, elétrica, eletrônica, hidráulica e trem de força.',moduleIds:[]},
   {id:'academy-mec-stage-3',title:'Aplicação',cardTitle:'Pense como um técnico.',cardDescription:'Manutenção, investigação de falhas e estudos de caso virtuais.',moduleIds:[]}
  ];
  const modules=catalog.modules.map(m=>{
   const id='trilha-formacao-'+m.id.toLowerCase();
   stageContent[m.stage-1].moduleIds.push(id);
   return {id,name:m.name,description:m.description,hours:m.hours,moduleEnabled:false,
     lessons:m.lessons.map((name,i)=>({id:id+'-aula-'+String(i+1).padStart(2,'0'),
       name,description:'Conteúdo técnico em preparação.',videoId:'',minutes:0})),
     questions:[],passScore:75};
  });
  return {title:'Formação de Mecânicos de Máquinas Pesadas',
   description:'Formação técnica multimarcas, do nível inicial ao intermediário.',
   heroKicker:'TRILHA DE CONHECIMENTO · NÍVEL INICIAL AO INTERMEDIÁRIO',
   heroTitle:'Formação de Mecânicos de Máquinas Pesadas',heroHighlight:'Mecânicos',
   heroDescription:'Do primeiro contato com a mecânica à análise de sistemas e diagnóstico técnico. Uma jornada completa para evoluir na linha pesada.',
   stageHeading:'Três etapas. Uma evolução.',cover:'',
   audience:'Iniciantes e profissionais de manutenção',objectives:'Fundamentos, sistemas e diagnóstico introdutório.',
   certificateEnabled:false,stages:stageContent,modules};
 }
 function newProgram(){
  if(!isEditor())return;
  const name=prompt('Nome da nova Academia:');
  if(!name?.trim())return;
  const slug=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
  selected='academy-'+(slug||'formacao')+'-'+crypto.randomUUID().slice(0,8);
  draft={title:name.trim(),description:'',heroKicker:'TRILHA DE CONHECIMENTO',
   heroTitle:name.trim(),heroHighlight:'',heroDescription:'',stageHeading:'Etapas da formação.',
   cover:'',audience:'',objectives:'',certificateEnabled:false,stages:[],modules:[]};
  renderAdmin();
 }
 async function seed(){
  if(!isEditor())return;
  if(programs.some(p=>p.id==='academy-formacao-mecanicos')){
   selected='academy-formacao-mecanicos';draft=copy(programs.find(p=>p.id===selected).definition);
   renderAdmin();message('Formação existente carregada, sem sobrescrever o cadastro.');return;
  }
  try{const definition=seedDefinition();await api('save',{id:'academy-formacao-mecanicos',definition});
   selected='academy-formacao-mecanicos';await reloadAdmin();message('Formação criada com 3 etapas, 12 módulos e 78 aulas planejadas. Todos começam inativos.');
  }catch(error){message(error.message,true);}
 }
 function renderAdmin(){
  if(!isEditor())return;
  const header='<div class="connected-editor-head"><div><div class="tag">GESTÃO DAS FORMAÇÕES</div><h1>Academias</h1><p>Trilhas completas e matrículas independentes dos Cursos Avulsos.</p></div><div class="connected-editor-actions"><button type="button" class="outline" id="connectedNewProgram">Nova Academia</button><button type="button" class="primary" id="connectedSeed">Preparar Formação de Mecânicos</button></div></div><div id="connectedAcademyMessage" class="connected-editor-message" role="status"></div>';
  adminSection.innerHTML=header+'<div class="connected-editor-body"><aside id="connectedProgramList" class="connected-program-list"></aside><div id="connectedProgramDetails" class="connected-program-details"></div></div>';
  $('connectedNewProgram').onclick=newProgram;
  $('connectedSeed').onclick=seed;
  const list=$('connectedProgramList');
  if(!programs.length)list.innerHTML='<p>Sem formações cadastradas. Prepare a Formação de Mecânicos para começar.</p>';
  for(const p of programs){
   const btn=document.createElement('button');btn.type='button';btn.className='connected-program-list-item'+(p.id===selected?' selected':'');
   btn.innerHTML='<strong>'+esc(p.title)+'</strong><small>'+esc(p.status==='published'?'Publicada':'Em rascunho')+'</small>';
   btn.onclick=()=>{selected=p.id;draft=copy(p.definition);renderAdmin();};
   list.append(btn);
  }
  if(!selected||!draft){$('connectedProgramDetails').innerHTML='<div class="connected-program-placeholder">Selecione uma Academia para editar sua apresentação, etapas, módulos e matrículas.</div>';return;}
  renderDetails();
 }
 function collectForm(){
  const form=$('connectedProgramForm');if(!form||!draft)return;
  for(const name of ['title','description','heroKicker','heroTitle','heroHighlight','heroDescription','stageHeading','audience','objectives']){
   const input=form.elements.namedItem(name);if(input)draft[name]=input.value.trim();
  }
  draft.certificateEnabled=!!form.elements.namedItem('certificateEnabled')?.checked;
  for(const item of draft.stages){
   const fields=form.querySelector('[data-stage-fields="'+CSS.escape(item.id)+'"]');
   if(fields){item.title=fields.querySelector('[data-stage-title]').value.trim();
    item.cardTitle=fields.querySelector('[data-stage-card]').value.trim();
    item.cardDescription=fields.querySelector('[data-stage-description]').value.trim();}
  }
  document.querySelectorAll('#connectedProgramDetails .connected-module-editor:not([hidden])').forEach(collectModuleFields);
 }
 function collectModuleFields(box){
  const id=box.dataset.moduleId,mod=draft?.modules.find(m=>m.id===id);
  if(!mod)return;
  const title=box.querySelector('[data-module-name]');
  const description=box.querySelector('[data-module-description]');
  const hours=box.querySelector('[data-module-hours]');
  if(title)mod.name=title.value.trim().slice(0,180);
  if(description)mod.description=description.value.trim().slice(0,1200);
  if(hours)mod.hours=Math.max(0,Math.min(1000,Number(hours.value)||0));
  box.querySelectorAll('[data-lesson-name]').forEach(input=>{
   const lesson=mod.lessons.find(l=>l.id===input.dataset.lessonName);
   if(lesson)lesson.name=input.value.trim().slice(0,180);
  });
  box.querySelectorAll('[data-lesson-description]').forEach(input=>{
   const lesson=mod.lessons.find(l=>l.id===input.dataset.lessonDescription);
   if(lesson)lesson.description=input.value.trim().slice(0,1200);
  });
  box.querySelectorAll('[data-lesson-minutes]').forEach(input=>{
   const lesson=mod.lessons.find(l=>l.id===input.dataset.lessonMinutes);
   if(lesson)lesson.minutes=Math.max(0,Math.min(600,Number(input.value)||0));
  });
 }
 function addStage(){
  if(!draft)return;
  collectForm();
  const name=$('connectedNewStageName')?.value.trim();
  if(!name){message('Informe o nome da etapa antes de adicionar.',true);$('connectedNewStageName')?.focus();return;}
  if(draft.stages.length>=15){message('Limite de 15 etapas por Academia.',true);return;}
  draft.stages.push({id:newId('stage'),title:name.slice(0,120),cardTitle:'',
   cardDescription:'',moduleIds:[]});
  renderDetails();
  message('Etapa adicionada. Agora adicione um módulo e clique em Salvar configurações.');
 }
 function addModule(stageId){
  if(!draft)return;
  const stage=draft.stages.find(s=>s.id===stageId);
  const input=document.querySelector('[data-new-module-name="'+CSS.escape(stageId)+'"]');
  const name=input?.value.trim();
  if(!stage||!name){message('Informe o nome do módulo antes de adicionar.',true);input?.focus();return;}
  collectForm();
  if(draft.modules.length>=90){message('Limite de 90 módulos por Academia.',true);return;}
  const id=newId('module');
  draft.modules.push({id,name:name.slice(0,180),description:'',hours:0,moduleEnabled:false,
   lessons:[],questions:[],passScore:75});
  stage.moduleIds.push(id);
  renderDetails();
  const editor=$('connectedModuleEditor-'+id);
  if(editor){editor.hidden=false;renderModuleEditor(id,editor,true);editor.scrollIntoView({block:'nearest'});}
  message('Módulo criado como Inativo. Cadastre as aulas e salve a Academia.');
 }
 function renderDetails(){
  const p=programs.find(p=>p.id===selected)||null,canEdit=isMaster()||!p||p.status==='draft';
  const holder=$('connectedProgramDetails');let html=
   '<div class="connected-details-bar"><h2>'+esc(draft.title||'Nova Academia')+'</h2><div class="connected-details-actions"><span class="connected-state">'+esc(p?.status==='published'?'PUBLICADA':'RASCUNHO')+'</span><button type="button" id="connectedPreviewProgram" class="outline">Visualizar portal</button></div></div>'+
   '<form id="connectedProgramForm"><h3>Identidade e apresentação do portal</h3><div class="connected-field-grid">'+
   field('title','Título da Academia',draft.title,180)+field('heroKicker','Chamada superior',draft.heroKicker,160)+
   field('heroTitle','Título principal do banner',draft.heroTitle,180)+
   field('heroHighlight','Palavra em laranja',draft.heroHighlight,80)+
   field('stageHeading','Chamada das etapas',draft.stageHeading,150)+
   textarea('heroDescription','Descrição do primeiro card',draft.heroDescription,700)+
   textarea('description','Descrição institucional',draft.description,4000)+
   field('audience','Público-alvo',draft.audience,600)+
   textarea('objectives','Objetivos de aprendizagem',draft.objectives,2000)+
   '</div><div class="connected-cover-field"><label for="connectedCoverUpload">Imagem da capa (JPG, PNG ou WebP até 600 KB)</label><input id="connectedCoverUpload" type="file" accept="image/jpeg,image/png,image/webp"><img id="connectedCoverPreview" alt="Capa selecionada" hidden></div>'+
   '<label class="connected-certificate"><input type="checkbox" name="certificateEnabled" '+(draft.certificateEnabled?'checked':'')+'> Certificado final da Academia</label>'+
   '<h3>1. Etapas do aprendizado</h3><p class="connected-builder-guide">Crie as etapas da trilha. Depois, adicione os módulos e as aulas de cada etapa.</p><div id="connectedStagesFields">';
  for(const [i,stage] of draft.stages.entries()){
   html+='<div class="connected-stage-fields" data-stage-fields="'+esc(stage.id)+'"><b>Etapa '+String(i+1).padStart(2,'0')+'</b>'+
    '<label>Nome<input data-stage-title value="'+esc(stage.title)+'" maxlength="120"></label>'+
    '<label>Chamada do cartão<input data-stage-card value="'+esc(stage.cardTitle||'')+'" maxlength="150"></label>'+
    '<label>Descrição resumida<input data-stage-description value="'+esc(stage.cardDescription||'')+'" maxlength="320"></label></div>';
  }
  html+='</div><div class="connected-add-entry"><label>Nova etapa da Academia<input type="text" id="connectedNewStageName" maxlength="120" placeholder="Ex.: Fundamentos de manutenção" '+(!canEdit?'disabled':'')+'></label><button type="button" id="connectedAddStage" class="outline" '+(!canEdit?'disabled':'')+'>+ Adicionar etapa</button></div><div class="connected-form-actions"><button type="submit" class="primary" '+(!canEdit?'disabled':'')+'>Salvar configurações</button>';
  if(isMaster()&&p?.status!=='published')html+='<button type="button" id="connectedPublishProgram" class="outline">Publicar Academia completa</button>';
  html+='</div></form><h3>2. Módulos e aulas da Academia</h3><p class="connected-builder-guide">Dentro de cada etapa, use <strong>Adicionar módulo</strong>. Depois clique em <strong>Gerenciar aulas</strong> para cadastrar as aulas. Salve as configurações antes de publicar. Os vídeos podem ser incluídos depois.</p><div id="connectedModulesList">';
  const byId=new Map(draft.modules.map(m=>[m.id,m]));
  for(const stage of draft.stages){
   html+='<div class="connected-stage-modules"><h4>'+esc(stage.title)+'</h4>';
   for(const id of stage.moduleIds){
    const m=byId.get(id);if(!m)continue;
    html+='<div class="connected-module-row" data-module="'+esc(m.id)+'"><div><b>'+esc(m.name)+'</b><small>'+Number(m.hours||0)+'h · '+(m.lessons||[]).length+' aulas · '+(m.moduleEnabled?'ATIVO':'INATIVO')+'</small></div><div class="connected-module-tools">';
    if(isMaster()&&p)html+='<button type="button" data-toggle-module="'+esc(m.id)+'" data-enable="true" class="'+(m.moduleEnabled?'selected':'')+'">Ativar</button><button type="button" data-toggle-module="'+esc(m.id)+'" data-enable="false" class="'+(!m.moduleEnabled?'selected':'')+'">Desativar</button>';
    html+='<button type="button" data-edit-module="'+esc(m.id)+'" class="outline">Gerenciar aulas</button></div></div><div class="connected-module-editor" id="connectedModuleEditor-'+esc(m.id)+'" hidden></div>';
   }
   html+='<div class="connected-add-entry"><label>Novo módulo nesta etapa<input type="text" data-new-module-name="'+esc(stage.id)+'" maxlength="180" placeholder="Ex.: Segurança e ferramentas" '+(!canEdit?'disabled':'')+'></label><button type="button" data-add-module="'+esc(stage.id)+'" class="outline" '+(!canEdit?'disabled':'')+'>+ Adicionar módulo</button></div></div>';
  }
  html+='</div>';
  if(isMaster()&&p?.status==='published')html+='<section class="connected-enrollment-panel"><h3>Gerenciar matrículas</h3><p>Somente o ADM Master pode liberar ou suspender acesso à formação.</p><div id="connectedEnrollmentEditor"><button class="outline" type="button" id="connectedLoadStudents">Carregar alunos</button></div></section>';
  holder.innerHTML=html;
  $('connectedAddStage').onclick=addStage;
  holder.querySelectorAll('[data-add-module]').forEach(button=>button.onclick=()=>addModule(button.dataset.addModule));
  $('connectedPreviewProgram').onclick=()=>{
   collectForm();
   const stages=draft.stages||[],modules=draft.modules||[];
   const byId=new Map(modules.map(m=>[m.id,m]));
   const ids=stages.flatMap(s=>s.moduleIds||[]);
   const items=ids.map((id,index)=>{
    const m=byId.get(id),enabled=m?.moduleEnabled===true,hasVideo=!!m?.lessons?.[0]?.videoId;
    return {id,index,name:m?.name||'Módulo planejado',hours:m?.hours||0,lessons:m?.lessons?.length||0,
     enabled,hasVideo,canOpen:enabled&&index===0,passed:false,done:false,attempts:0,
     status:index>0?'blocked':!enabled?'inactive':!hasVideo?'preparing':'available'};
   });
   const first=items.find(x=>x.canOpen),source=byId.get(first?.id);
   const payload={academy:{id:selected,title:draft.title,description:draft.description,
    heroKicker:draft.heroKicker,heroTitle:draft.heroTitle,heroHighlight:draft.heroHighlight,
    heroDescription:draft.heroDescription,stageHeading:draft.stageHeading,cover:draft.cover,
    audience:draft.audience,objectives:draft.objectives,certificateEnabled:draft.certificateEnabled,
    stages},map:{active:true,approved:0,total:items.length,completed:false,items},
    courses:first&&source?[{id:first.id,name:first.name,description:source.description,
      lessons:(source.lessons||[]).map(l=>({id:l.id,name:l.name}))}]:[],
    resume:first?{moduleId:first.id,name:source?.lessons?.[0]?.name||first.name,
      description:'Prévia administrativa da formação'}:{status:'blocked',name:'Módulos em preparação',
      description:'Ative o primeiro módulo para permitir o acesso ao aluno matriculado.'},
    studentName:'Prévia ADM'};
   openPortal(payload);
  };
  const form=$('connectedProgramForm');form.onsubmit=async event=>{
   event.preventDefault();collectForm();await saveDraft();
  };
  const cover=$('connectedCoverPreview');
  if(draft.cover){cover.hidden=false;cover.src=draft.cover;}
  $('connectedCoverUpload').onchange=event=>{
   const file=event.target.files?.[0];if(!file)return;
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>600*1024){
    message('Envie imagem JPG, PNG ou WebP de até 600 KB.',true);event.target.value='';return;
   }
   const reader=new FileReader();
   reader.onload=()=>{draft.cover=String(reader.result||'');cover.hidden=false;cover.src=draft.cover;};
   reader.onerror=()=>message('Não foi possível ler a imagem.',true);
   reader.readAsDataURL(file);
  };
  const publication=$('connectedPublishProgram');
  if(publication)publication.onclick=async()=>{
   if(!isMaster())return;
   if(!p)return;
   publication.disabled=true;
   try{await api('publish',{id:selected});await reloadAdmin();message('Academia publicada! Os módulos mantêm suas liberações individuais.');}
   catch(error){publication.disabled=false;message(error.message,true);}
  };
  holder.querySelectorAll('[data-toggle-module]').forEach(button=>button.onclick=async()=>{
   if(!isMaster()||!p)return;
   const id=button.dataset.toggleModule,enabled=button.dataset.enable==='true';
   button.disabled=true;
   try{await api('toggle',{id:selected,moduleId:id,enabled});await reloadAdmin();message('Módulo '+(enabled?'ativado':'desativado')+' para alunos autorizados.');}
   catch(error){button.disabled=false;message(error.message,true);}
  });
  holder.querySelectorAll('[data-edit-module]').forEach(button=>button.onclick=()=>{
   collectForm();const id=button.dataset.editModule,box=$('connectedModuleEditor-'+id);
   if(box.hidden){box.hidden=false;renderModuleEditor(id,box,canEdit);}else box.hidden=true;
  });
  const load=$('connectedLoadStudents');if(load)load.onclick=loadStudents;
 }
 const field=(name,label,value,max)=>'<label>'+esc(label)+'<input type="text" name="'+name+'" maxlength="'+max+'" value="'+esc(value||'')+'"></label>';
 const textarea=(name,label,value,max)=>'<label class="wide">'+esc(label)+'<textarea name="'+name+'" maxlength="'+max+'" rows="3">'+esc(value||'')+'</textarea></label>';
 async function saveDraft(){
  if(!draft)return;
  const button=$('connectedProgramForm')?.querySelector('[type=submit]');if(button)button.disabled=true;
  try{const existing=programs.find(p=>p.id===selected);
   await api('save',{id:selected,revision:existing?.revision??null,definition:draft});
   await reloadAdmin();message('Configurações e aulas planejadas salvas no Supabase.');
  }catch(error){if(button)button.disabled=false;message(error.message,true);}
 }
 function renderModuleEditor(id,box,canEdit){
  const m=draft.modules.find(x=>x.id===id);if(!m)return;
  box.dataset.moduleId=id;
  let html='<div class="connected-module-head"><h4>'+esc(m.name)+'</h4><p>Planeje as aulas sem vídeos. Elas permanecem indisponíveis até a publicação do conteúdo e liberação pelo ADM.</p></div>'+
    '<div class="connected-field-grid">'+
    '<label>Nome do módulo<input data-module-name maxlength="180" value="'+esc(m.name)+'" '+(!canEdit?'disabled':'')+'></label>'+
    '<label>Carga horária (horas)<input type="number" data-module-hours min="0" max="1000" step="0.5" value="'+Number(m.hours||0)+'" '+(!canEdit?'disabled':'')+'></label>'+
    '<label class="wide">Descrição do módulo<textarea data-module-description maxlength="1200" rows="3" '+(!canEdit?'disabled':'')+'>'+esc(m.description||'')+'</textarea></label></div>'+
    '<h4>Aulas deste módulo ('+m.lessons.length+')</h4><div class="connected-lessons-list">';
  for(const [i,lesson] of m.lessons.entries()){
   html+='<div class="connected-lesson-entry"><strong>Aula '+String(i+1).padStart(2,'0')+'</strong>'+
    '<label>Título da aula<input data-lesson-name="'+esc(lesson.id)+'" maxlength="180" value="'+esc(lesson.name)+'" '+(!canEdit?'disabled':'')+'></label>'+
    '<label>Descrição<textarea data-lesson-description="'+esc(lesson.id)+'" maxlength="1200" rows="2" '+(!canEdit?'disabled':'')+'>'+esc(lesson.description||'')+'</textarea></label>'+
    '<label>Duração prevista (minutos)<input data-lesson-minutes="'+esc(lesson.id)+'" type="number" min="0" max="600" step="1" value="'+Number(lesson.minutes||0)+'" '+(!canEdit?'disabled':'')+'></label>'+
    '<span class="connected-lesson-notice">'+(lesson.videoId?'Vídeo Mux vinculado ao conteúdo':'Vídeo Mux ainda não vinculado — aula em preparação')+'</span></div>';
  }
  html+='</div><div class="connected-add-entry"><label>Nome da nova aula<input type="text" data-new-lesson-name maxlength="180" placeholder="Ex.: Introdução ao sistema hidráulico" '+(!canEdit?'disabled':'')+'></label>'+
   '<button type="button" data-add-lesson class="outline" '+(!canEdit?'disabled':'')+'>+ Adicionar aula</button></div>'+
   '<div class="connected-module-save"><button type="button" class="primary" data-save-module '+(!canEdit?'disabled':'')+'>Salvar módulo e aulas</button>'+
   '<small>A matrícula e as liberações são gerenciadas separadamente. Aulas não podem ser excluídas neste fluxo.</small></div>';
  box.innerHTML=html;
  box.querySelector('[data-save-module]').onclick=async()=>{
   collectForm();await saveDraft();
  };
  box.querySelector('[data-add-lesson]').onclick=()=>{
   const name=box.querySelector('[data-new-lesson-name]')?.value.trim();
   if(!name){message('Digite o nome da nova aula.',true);box.querySelector('[data-new-lesson-name]')?.focus();return;}
   collectForm();
   if(m.lessons.length>=150){message('Limite de 150 aulas por módulo.',true);return;}
   m.lessons.push({id:newId('lesson'),name:name.slice(0,180),description:'',minutes:0,videoId:''});
   renderModuleEditor(id,box,canEdit);
   box.querySelector('[data-save-module]')?.scrollIntoView({block:'nearest'});
   message('Aula adicionada. Preencha as informações e clique em Salvar módulo e aulas.');
  };
 }
 async function loadStudents(){
  try{const result=await api('students');students=result.students||[];enrollments=result.enrollments||[];
   renderEnrollment();
  }catch(error){message(error.message,true);}
 }
 function renderEnrollment(){
  const div=$('connectedEnrollmentEditor');if(!div)return;
  const active=enrollments.filter(e=>e.program_id===selected);
  div.innerHTML='<div class="connected-enroll-controls"><label>Aluno<select id="connectedStudentChoice">'+students.filter(s=>s.active).map(s=>'<option value="'+esc(s.id)+'">'+esc(s.display_name)+'</option>').join('')+'</select></label><label>Validade opcional<input type="date" id="connectedEnrollmentExpiry"></label><button type="button" class="primary" id="connectedGrant">Liberar matrícula</button></div>'+
   '<div id="connectedExistingEnrollments">'+active.map(e=>{
    const name=students.find(s=>s.id===e.member_id)?.display_name||'Aluno';
    return '<div class="connected-enrollment"><span>'+esc(name)+' · '+(e.active?'Ativa':'Suspensa')+(e.expires_on?' · até '+esc(e.expires_on):'')+'</span><button class="outline" type="button" data-enroll-member="'+esc(e.member_id)+'" data-enroll-active="'+!e.active+'">'+(e.active?'Suspender':'Reativar')+'</button></div>';
   }).join('')+'</div>';
  $('connectedGrant').onclick=async()=>{
   const memberId=$('connectedStudentChoice').value;if(!memberId)return;
   const expiresOn=$('connectedEnrollmentExpiry').value;
   try{await api('enroll',{id:selected,memberId,expiresOn,active:true});await loadStudents();message('Matrícula liberada.');}
   catch(err){message(err.message,true);}
  };
  div.querySelectorAll('[data-enroll-member]').forEach(button=>button.onclick=async()=>{
   const memberId=button.dataset.enrollMember,active=button.dataset.enrollActive==='true';
   const item=enrollments.find(e=>e.member_id===memberId&&e.program_id===selected);
   try{await api('enroll',{id:selected,memberId,active,expiresOn:item?.expires_on||''});await loadStudents();message(active?'Matrícula reativada.':'Matrícula suspensa.');}
   catch(err){message(err.message,true);}
  });
 }
 function openPortal(payload){
  if(!session)return;
  currentPayload=payload;currentModule=null;
  portalRequest=crypto.randomUUID();portalReady=false;
  overlay.hidden=false;loading.hidden=false;room.hidden=true;
  loading.querySelector('h2').textContent='Preparando sua Academia';
  loading.querySelector('p').textContent='Carregando o painel da formação.';
  frame.hidden=false;
  frame.src='./trilha-formacao/?integrated=1&request='+encodeURIComponent(portalRequest);
  document.body.classList.add('academy-connected-open');
 }
 function closePortal(){
  portalRequest=null;currentPayload=null;currentModule=null;portalReady=false;
  overlay.hidden=true;room.hidden=true;frame.src='about:blank';
  document.body.classList.remove('academy-connected-open');
 }
 $('connectedPortalCancel').onclick=closePortal;
 function openModuleRoom(moduleId){
  if(!currentPayload?.map?.items.some(x=>x.id===moduleId&&x.canOpen))return;
  const m=currentPayload.map.items.find(x=>x.id===moduleId);
  const src=currentPayload.courses.find(c=>c.id===moduleId),lessons=src?.lessons||[];
  room.hidden=false;
  room.innerHTML='<div class="connected-room"><button class="outline" type="button" id="connectedBackToTrilha">← Voltar para Minha trilha</button><p class="tag">SALA DE AULA · CONTREM ACADEMIA</p><h2>'+esc(m.name)+'</h2><p>Este módulo está ativo. Cada aula será liberada depois que o conteúdo Mux e a avaliação estiverem disponíveis.</p><div class="connected-room-list">'+lessons.map((l,i)=>'<div class="connected-room-lesson"><span>'+String(i+1).padStart(2,'0')+'. '+esc(l.name)+'</span><small>Vídeo e atividades em preparação</small></div>').join('')+'</div><p class="connected-room-notice">A conclusão automática e as avaliações protegidas serão integradas ao serviço de vídeos antes da liberação das aulas reais.</p></div>';
  $('connectedBackToTrilha').onclick=()=>{room.hidden=true;room.replaceChildren();};
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||!session||!portalRequest)return;
  const msg=event.data;
  if(msg?.request!==portalRequest)return;
  if(msg.type==='contrem:academy-ready'){
   portalReady=true;
   frame.contentWindow.postMessage({type:'contrem:academy-data',request:portalRequest,academyId:currentPayload.academy.id,payload:currentPayload},location.origin);
  }else if(msg.type==='contrem:academy-displayed'&&msg.academyId===currentPayload?.academy.id){
   loading.hidden=true;
  }else if(msg.type==='contrem:academy-error'){
   loading.hidden=false;loading.querySelector('h2').textContent='Não foi possível abrir o painel';
   loading.querySelector('p').textContent=String(msg.message||'Erro ao carregar a Academia.');
  }else if(msg.type==='contrem:academy-action'){
   if(msg.action==='back'){closePortal();return;}
   if(msg.action==='open-module'&&msg.academyId===currentPayload?.academy.id)openModuleRoom(msg.moduleId);
  }
 });
 window.addEventListener('contrem:academy-session-ready',async event=>{
  session=event.detail;mask();
  if(isEditor()){adminSection.hidden=true;try{await reloadAdmin();}catch{}}
  else{studentSection.innerHTML='<p class="muted">Carregando suas Academias…</p>';await reloadStudent();}
 });
 window.addEventListener('contrem:academy-session-ended',()=>{
  session=null;programs=[];students=[];enrollments=[];myPrograms=[];selected=null;draft=null;
  closeEditor();mask();studentSection.innerHTML='';
 });
 window.CONTREM_CONNECTED_PROGRAMS={refreshAdmin:reloadAdmin,refreshStudent:reloadStudent};
})();
