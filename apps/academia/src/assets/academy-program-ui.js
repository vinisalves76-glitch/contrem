/* CONTREM Academia · integrated programs UI, homologation only.
   Existing course/lesson/Mux authoring remains in admin-manager.js. */
(() => {
 'use strict';
 if(window.CONTREM_ACADEMY_CONFIG?.preview!==true||!window.CONTREM_PROGRAM_STORE)return;
 const store=window.CONTREM_PROGRAM_STORE,core=window.CONTREM_PROGRAM_CORE;
 const $=id=>document.getElementById(id),e=s=>esc(s??''),date=()=>core.today();
 window.CONTREM_PROGRAM_COURSE_ACCESS=()=>courses;
 window.CONTREM_PROGRAM_STATE_ACCESS=()=>({progress});
 let selected=null,opened=null,returnToAcademy=null,frameReady=false,portalRequest=null,portalTimer=null;
 const admin=$('adminView'),panel=document.createElement('section');
 panel.id='academiasAdminPanel';panel.className='panel program-main';
 panel.innerHTML=`
  <header class="program-header"><span class="tag">GESTÃO DE FORMAÇÕES</span><h2>Academias</h2>
  <p>Crie diferentes programas de formação. Cada Academia possui etapas e módulos exclusivos; as aulas continuam no construtor de cursos existente.</p></header>
  <div class="program-actions"><button type="button" id="programNew" class="primary">+ Nova Academia</button>
  <button type="button" id="programSeed" class="outline">Preparar Formação de Mecânicos · 12 módulos</button>
  <button type="button" id="programDemo" class="outline">Criar Academia de teste · 2 módulos</button></div>
  <div id="programNotice" class="program-notice" aria-live="polite"></div>
  <div class="program-layout"><aside id="programList" class="program-list" aria-label="Academias cadastradas"></aside>
   <div id="programEditor" class="program-editor"><p class="muted">Selecione uma Academia ou crie uma nova formação para organizar as etapas e módulos.</p></div></div>`;
 const target=admin.querySelector('.adm-workspace')||admin.querySelector('.admin');
 target.before(panel);
 const nav=document.createElement('button');nav.type='button';nav.id='academiasTab';nav.innerHTML='<span aria-hidden="true">◇</span> Academias';$('adminNav').insertBefore(nav,$('studentsTab'));
 const returnBtn=document.createElement('button');returnBtn.type='button';returnBtn.className='outline program-return';returnBtn.textContent='← Voltar às Academias';
 admin.querySelector('.adm-editor')?.prepend(returnBtn);returnBtn.hidden=true;returnBtn.onclick=enterPrograms;
 const enrollment=document.createElement('section');enrollment.id='programEnrollmentPanel';enrollment.className='panel';
 enrollment.innerHTML=`<div class="tag">MATRÍCULAS DAS ACADEMIAS</div><h3>Liberar formação completa</h3>
 <p class="muted">Somente o ADM Master concede, renova ou suspende acessos. Alunos mantêm seus próprios cursos avulsos.</p>
 <form id="programAccessForm" class="program-access-form"><label>Aluno<select id="programAccessStudent" required></select></label>
 <label>Academia publicada<select id="programAccessAcademy" required></select></label>
 <label>Validade<select id="programAccessType"><option value="none">Sem prazo</option><option value="date">Com validade</option></select></label>
 <label id="programAccessDateWrap" hidden>Válido até<input id="programAccessDate" type="date"></label>
 <label>Origem<select id="programAccessSource"><option value="manual">Liberação manual</option><option value="venda_externa">Venda externa</option><option value="cortesia">Cortesia</option><option value="convenio">Convênio</option></select></label>
 <button class="primary" type="submit">Liberar / renovar Academia</button></form>
 <p id="programAccessFeedback" role="status" aria-live="polite"></p>
 <div id="programAccessList"></div>
 <hr><h3>Solicitações de nova tentativa</h3><div id="programRetakeList"></div>`;
 $('adminStudents').append(enrollment);
 const studentPanel=document.createElement('section');studentPanel.id='myAcademies';studentPanel.className='panel program-student-panel';
 studentPanel.innerHTML='<div class="tag">MINHAS ACADEMIAS</div><div class="row"><div><h2>Minhas formações</h2><p class="muted">Trilhas completas, com etapas e módulos liberados conforme sua aprovação.</p></div><button type="button" class="outline" id="refreshAcademies">Atualizar progresso ↻</button></div><div id="studentAcademiesList"></div>';
 const frame=document.createElement('iframe');
 frame.id='contremAcademyIntegratedFrame';
 frame.title='Portal da Academia vinculada ao seu login';
 frame.setAttribute('referrerpolicy','same-origin');
 frame.hidden=true;
 document.body.append(frame);
 const loading=document.createElement('div');
 loading.id='academyPortalLoading';loading.hidden=true;
 loading.setAttribute('role','status');loading.setAttribute('aria-live','polite');
 loading.innerHTML='<div class="academy-portal-loading-card"><div class="academy-portal-loading-brand">CONTREM <span>ACADEMIA</span></div><div class="academy-portal-loader" aria-hidden="true"></div><h2 id="academyPortalLoadingTitle">Abrindo sua Academia</h2><p id="academyPortalLoadingMessage">Carregando o painel da formação e verificando sua matrícula.</p><div class="academy-portal-loading-actions"><button type="button" id="academyPortalRetry" class="primary" hidden>Tentar novamente</button><button type="button" id="academyPortalCancel" class="outline">Voltar ao meu perfil</button></div></div>';
 document.body.append(loading);
 $('studentView').querySelector('.learning-banner')?.after(studentPanel);
 const studentNav=document.createElement('button');studentNav.type='button';studentNav.innerHTML='<span aria-hidden="true">◇</span> Minhas Academias';
 studentNav.setAttribute('data-jump','myAcademies');$('studentNav').insertBefore(studentNav,$('studentNav').querySelector('[data-jump="my-performance"]'));
 const notify=(message,error=false)=>{const x=$('programNotice');x.textContent=message;x.classList.toggle('error',error);};
 const permitted=()=>window.AcademySession?.role==='admin'&&window.AcademySession?.preview;
 const enrolled=()=>window.AcademySession?.role==='student'&&window.AcademySession?.preview;
 function enterPrograms(){
  if(!permitted())return;
  $('adminTab').click();show('adminView');admin.classList.add('programs-active');
  $('adminHeading').textContent='Academias';$('workspaceLabel').textContent='Academias';
  $('adminTab').classList.remove('active');nav.classList.add('active');returnBtn.hidden=true;
  renderAdmin();window.scrollTo({top:0,behavior:'auto'});
 }
 function leavePrograms(){admin.classList.remove('programs-active');nav.classList.remove('active');returnBtn.hidden=true;}
 $('adminTab').addEventListener('click',leavePrograms);$('studentsTab').addEventListener('click',()=>{leavePrograms();renderEnrollment();});
 nav.addEventListener('click',enterPrograms);
 const fresh=()=>permitted()?store.list():{academies:[],students:[],enrollments:[],requests:[],certificates:[]};
 function renderAdmin(){
  if(!permitted())return;
  const all=fresh().academies,box=$('programList');box.replaceChildren();
  for(const a of all){
   const button=document.createElement('button');button.type='button';button.className='program-choice'+(selected===a.id?' current':'');
   const total=core.moduleIds(a).length;
   button.innerHTML='<b>'+e(a.title)+'</b><small>'+a.stages.length+' etapas · '+total+' módulos</small><span class="program-status '+e(a.status)+'">'+(a.status==='published'?'Publicada':a.status==='archived'?'Arquivada':'Rascunho')+'</span>';
   button.onclick=()=>{selected=a.id;renderAdmin();};
   box.append(button);
  }
  if(!all.length)box.innerHTML='<p class="muted">Nenhuma Academia criada. Cadastre sua primeira formação.</p>';
  const value=all.find(a=>a.id===selected)||null;
  if(!value){$('programEditor').innerHTML='<div class="program-empty">Selecione uma Academia na lista ou clique em <b>Nova Academia</b>.</div>';return;}
  renderEditor(value);
 }
 function updateProgram(value){
  try{const saved=store.upsert(value);selected=saved.id;notify('Academia salva em rascunho.');renderAdmin();return saved;}
  catch(err){notify(err.message,true);return null;}
 }
 function renderEditor(a){
  const root=$('programEditor');root.replaceChildren();
  const head=document.createElement('div');head.className='program-edit-head';
  head.innerHTML='<div><span class="tag">EDITOR DE ACADEMIA</span><h3>'+e(a.title)+'</h3><small>'+e(a.status==='published'?'Publicada na prévia':'Rascunho')+' · '+core.moduleIds(a).length+' módulos</small></div><div class="program-edit-actions"><button type="button" data-program-action="publish" class="primary">'+(a.status==='published'?'Republicar':'Publicar Academia')+'</button><button type="button" data-program-action="archive" class="outline">Arquivar</button></div>';
  root.append(head);
  // Um único checklist explica quais módulos estão prontos para publicação conjunta.
  const inspection=core.inspectModules(a,courses);
  const validCount=inspection.filter(item=>item.ready).length;
  const alreadyPublished=inspection.filter(item=>item.ready&&item.status==='published').length;
  const problems=inspection.filter(item=>!item.ready);
  const checklist=document.createElement('section');checklist.className='program-readiness';
  const summary=document.createElement('div');summary.className='program-readiness-summary';
  const heading=document.createElement('strong');
  heading.textContent='Publicação da Academia · '+validCount+' de '+inspection.length+' módulos preparados';
  const hint=document.createElement('p');
  hint.textContent=problems.length?
   'Corrija os módulos indicados abaixo. Nenhum módulo incompleto será publicado.':
   (inspection.length?'Todos os módulos têm aulas, vídeos Mux e prova. Ao publicar a Academia, os '+(inspection.length-alreadyPublished)+' módulo(s) ainda em rascunho serão publicados juntos.':'Adicione módulos e aulas para preparar a formação.');
  summary.append(heading,hint);checklist.append(summary);
  const pending=document.createElement('div');pending.className='program-readiness-list';
  problems.forEach(item=>{
   const row=document.createElement('div');row.className='program-readiness-item';
   const detail=document.createElement('div'),name=document.createElement('b'),reason=document.createElement('p');
   name.textContent=item.name;reason.textContent=item.issues.join(' ');detail.append(name,reason);
   const button=document.createElement('button');button.type='button';button.className='outline';
   button.textContent='Corrigir módulo →';button.dataset.moduleEdit=item.id;
   row.append(detail,button);pending.append(row);
  });
  if(problems.length)checklist.append(pending);
  root.append(checklist);
  const form=document.createElement('form');form.className='program-settings';form.id='programSettings';
  form.innerHTML=`<div class="program-form-grid"><label>Nome da formação<input name="title" maxlength="150" required value="${e(a.title)}"></label>
   <label>Preço de referência (R$)<input name="price" type="number" min="0" step=".01" max="10000000" value="${Number(a.price)||0}"></label>
   <label class="wide">Descrição<textarea name="description" maxlength="4000" rows="2">${e(a.description)}</textarea></label>
   <label>Público-alvo<input name="audience" maxlength="500" value="${e(a.audience)}"></label>
   <label>Objetivos<input name="objectives" maxlength="1200" value="${e(a.objectives)}"></label>
   <label class="program-checkbox wide"><input name="certificateEnabled" type="checkbox" ${a.certificateEnabled?'checked':''}> Emitir certificado da Academia completa após aprovação em todos os módulos</label>
   <div class="wide program-intro-title"><h4>Identidade e apresentação do portal</h4><p>Personalize o primeiro card sem alterar o layout oficial da CONTREM Academia.</p></div>
   <label class="wide">Chamada acima do título<input name="heroKicker" maxlength="160" value="${e(a.heroKicker||'')}" placeholder="TRILHA DE CONHECIMENTO · NÍVEL INICIAL AO INTERMEDIÁRIO"></label>
   <label class="wide">Título principal do banner<input name="heroTitle" maxlength="180" value="${e(a.heroTitle||a.title)}" placeholder="Formação de Mecânicos de Máquinas Pesadas"></label>
   <label>Palavra ou expressão em laranja<input name="heroHighlight" maxlength="80" value="${e(a.heroHighlight||'')}" placeholder="Ex.: Mecânicos"></label>
   <label>Título acima das etapas<input name="stageHeading" maxlength="130" value="${e(a.stageHeading||'')}" placeholder="Ex.: Três etapas. Uma evolução."></label>
   <label class="wide">Descrição principal do banner<textarea name="heroDescription" maxlength="600" rows="3">${e(a.heroDescription||a.description||'')}</textarea></label>
   <div class="wide program-cover-tools">
    <label>Imagem de capa (JPG, PNG ou WebP até 900 KB)
     <input type="file" id="programCoverUpload" name="coverUpload" accept="image/jpeg,image/png,image/webp">
    </label>
    <img id="programCoverPreview" alt="Imagem de capa selecionada para esta Academia" hidden>
    <button type="button" id="programRemoveCover" class="outline">Remover capa personalizada</button>
    <small>Sem imagem enviada, o portal utiliza a fotografia padrão do layout. Nesta preview, o arquivo é salvo apenas no navegador.</small>
   </div></div>
   <button type="submit" class="primary">Salvar configurações</button><small>Preço apenas informativo nesta fase. Acesso liberado manualmente em Alunos.</small>`;
  root.append(form);
  let coverValue=a.cover||'';
  const coverInput=form.querySelector('#programCoverUpload');
  const coverPreview=form.querySelector('#programCoverPreview');
  const saveButton=form.querySelector('button[type="submit"]');
  const showCover=()=>{
   coverPreview.hidden=!coverValue;
   if(coverValue)coverPreview.src=coverValue;
   else coverPreview.removeAttribute('src');
  };
  showCover();
  coverInput.addEventListener('change',()=>{
   const image=coverInput.files?.[0];if(!image)return;
   if(!['image/jpeg','image/png','image/webp'].includes(image.type)||image.size>900*1024){
    notify('Envie uma imagem JPG, PNG ou WebP de até 900 KB para a preview.',true);
    coverInput.value='';return;
   }
   saveButton.disabled=true;
   const reader=new FileReader();
   reader.onload=()=>{coverValue=String(reader.result||'');showCover();saveButton.disabled=false;};
   reader.onerror=()=>{notify('Não foi possível ler a imagem enviada.',true);saveButton.disabled=false;};
   reader.readAsDataURL(image);
  });
  form.querySelector('#programRemoveCover').onclick=()=>{
   coverValue='';coverInput.value='';showCover();
  };
  const title=document.createElement('h3');title.textContent='Etapas e módulos exclusivos';root.append(title);
  const note=document.createElement('p');note.className='muted';note.textContent='A ordenação das etapas e módulos define a liberação sequencial ao aluno. Para vídeos Mux, apostilas e provas, use Gerenciar aulas do módulo.';root.append(note);
  const stageList=document.createElement('div');stageList.className='program-stage-list';root.append(stageList);
  a.stages.forEach((stage,idx)=>{
   const box=document.createElement('section');box.className='program-stage';
   box.innerHTML='<div class="program-stage-head"><div><span class="tag">ETAPA '+String(idx+1).padStart(2,'0')+'</span><h4>'+e(stage.title)+'</h4></div><div class="program-stage-actions"><button type="button" class="outline" data-stage-up="'+idx+'" '+(idx===0?'disabled':'')+'>↑</button><button type="button" class="outline" data-stage-down="'+idx+'" '+(idx===a.stages.length-1?'disabled':'')+'>↓</button><button type="button" class="outline" data-stage-rename="'+idx+'">Renomear</button></div></div>';
   const stageAppearance=document.createElement('form');stageAppearance.className='program-stage-copy';
   stageAppearance.innerHTML='<div class="program-form-grid"><label>Chamada do cartão<input name="cardTitle" maxlength="120" value="'+e(stage.cardTitle||'')+'" placeholder="Ex.: Construa sua base técnica"></label><label>Descrição resumida<input name="cardDescription" maxlength="240" value="'+e(stage.cardDescription||'')+'" placeholder="Ex.: Segurança, mecânica e metrologia"></label></div><button type="submit" class="outline">Salvar texto desta etapa</button>';
   stageAppearance.onsubmit=event=>{
    event.preventDefault();const fields=new FormData(stageAppearance),stages=core.copy(a.stages);
    stages[idx].cardTitle=String(fields.get('cardTitle')||'').trim();
    stages[idx].cardDescription=String(fields.get('cardDescription')||'').trim();
    updateProgram({...a,stages});
   };
   box.append(stageAppearance);
   const list=document.createElement('div');list.className='program-module-list';
   stage.moduleIds.forEach((id,i)=>{
    const c=courses.find(c=>c.id===id);
    const row=document.createElement('div');row.className='program-module';
    row.innerHTML='<div><b>'+String(i+1).padStart(2,'0')+'. '+e(c?.name||'Módulo não encontrado')+'</b><small>'+Number(c?.hours||0)+'h · '+(c?.lessons?.length||0)+' aulas · '+e(c?.status==='published'?'Publicado':'Rascunho')+'</small></div><div class="program-module-actions"><button type="button" class="outline" data-module-up="'+idx+':'+i+'" '+(i===0?'disabled':'')+'>↑</button><button type="button" class="outline" data-module-down="'+idx+':'+i+'" '+(i===stage.moduleIds.length-1?'disabled':'')+'>↓</button><button type="button" class="primary" data-module-edit="'+e(id)+'">Gerenciar aulas →</button></div>';
    if(a.stages.length>1){
     const selector=document.createElement('select');
     selector.className='program-move-stage';
     selector.setAttribute('aria-label','Mover módulo '+(c?.name||id)+' para outra etapa');
     for(const otherStage of a.stages){
      const option=document.createElement('option');
      option.value=otherStage.id;
      option.textContent='Etapa: '+otherStage.title;
      option.selected=stage.id===otherStage.id;
      selector.append(option);
     }
     selector.onchange=()=>{
      const stages=core.copy(a.stages);
      const sourceStage=stages.find(item=>item.id===stage.id);
      const destinationStage=stages.find(item=>item.id===selector.value);
      if(!sourceStage||!destinationStage||sourceStage.id===destinationStage.id)return;
      sourceStage.moduleIds=sourceStage.moduleIds.filter(moduleId=>moduleId!==id);
      destinationStage.moduleIds.push(id);
      const updated=updateProgram({...a,stages});
      if(updated){
       if(c)c.stageId=destinationStage.id;
       save();refresh();
      }else selector.value=stage.id;
     };
     row.querySelector('.program-module-actions').append(selector);
    }
    list.append(row);
   });
   if(!stage.moduleIds.length)list.innerHTML='<p class="muted">Etapa vazia. Adicione um módulo para começar.</p>';
   box.append(list);
   const create=document.createElement('form');create.className='program-new-module';create.dataset.createModule=stage.id;
   create.innerHTML='<label class="sr-only">Título do novo módulo</label><input required minlength="3" maxlength="150" name="name" placeholder="Nome do novo módulo"><input type="number" name="hours" min=".25" max="500" step=".25" value="4" aria-label="Carga horária estimada" title="Horas"><button type="submit" class="outline">+ Adicionar módulo</button>';
   box.append(create);stageList.append(box);
  });
  const newStage=document.createElement('form');newStage.className='program-new-stage';
  newStage.innerHTML='<input name="name" required maxlength="100" minlength="3" placeholder="Nome de uma nova etapa"><button class="outline" type="submit">+ Adicionar etapa</button>';
  root.append(newStage);
  form.onsubmit=event=>{event.preventDefault();const f=new FormData(form);
   updateProgram({...a,title:f.get('title'),price:Number(f.get('price')),description:f.get('description'),audience:f.get('audience'),objectives:f.get('objectives'),certificateEnabled:f.has('certificateEnabled'),
    heroKicker:f.get('heroKicker'),heroTitle:f.get('heroTitle'),heroHighlight:f.get('heroHighlight'),
    heroDescription:f.get('heroDescription'),stageHeading:f.get('stageHeading'),cover:coverValue});
  };
  newStage.onsubmit=event=>{event.preventDefault();const name=new FormData(newStage).get('name').trim();
   updateProgram({...a,stages:[...a.stages,{id:'stage-'+crypto.randomUUID(),title:name,moduleIds:[]}]});
  };
  stageList.querySelectorAll('form[data-create-module]').forEach(f=>f.onsubmit=event=>{
   event.preventDefault();if(!permitted())return;
   const name=new FormData(f).get('name').trim(),hours=Number(new FormData(f).get('hours'));
   if(name.length<3||hours<.25||hours>500)return notify('Informe nome e carga horária válidos.',true);
   const id='academy-module-'+crypto.randomUUID(),stage=a.stages.find(s=>s.id===f.dataset.createModule);
   if(!stage)return;
   courses.push({id,name,description:'Módulo exclusivo da formação '+a.title,category:'Academia · '+a.title,hours,
    academyId:a.id,stageId:stage.id,catalogType:core.MOD,format:'series',status:'draft',certificateEnabled:false,
    icon:'⚙️',lessons:[],questions:[],passScore:70});
   const stages=core.copy(a.stages),s=stages.find(s=>s.id===stage.id);s.moduleIds.push(id);
   const result=updateProgram({...a,stages});if(result){save();refresh();notify('Módulo criado. Clique em Gerenciar aulas para cadastrar vídeos, materiais e prova.');}
   else courses.splice(courses.findIndex(c=>c.id===id),1);
  });
  root.onclick=event=>{
   const button=event.target.closest('button');if(!button)return;
   const action=button.dataset.programAction;
   if(action){
    if(action==='publish'){
     const diagnostics=core.inspectModules(a,courses),invalid=diagnostics.filter(item=>!item.ready);
     if(invalid.length){
      notify('Não foi possível publicar. '+invalid.length+' módulo(s) com pendências; confira a lista de requisitos no editor.',true);
      root.querySelector('.program-readiness')?.scrollIntoView({block:'center',behavior:'smooth'});
      return;
     }
     if(!diagnostics.length){notify('Cadastre pelo menos um módulo na Academia.',true);return;}
     const ids=new Set(core.moduleIds(a)),original=courses.filter(course=>ids.has(course.id)).map(course=>({course,status:course.status}));
     try{
      for(const entry of original)entry.course.status='published';
      const updated=store.setStatus(a.id,'published');
      save();refresh();selected=updated.id;
      notify('Academia publicada na prévia com '+original.length+' módulos. Matrículas continuam sob controle do ADM Master.');
      renderAdmin();
     }catch(err){
      for(const entry of original)entry.course.status=entry.status;
      save();refresh();notify('Publicação não concluída: '+err.message,true);
     }
     return;
    }
    try{
     if(action==='archive'&&!confirm('Arquivar esta Academia? Matrículas e histórico serão preservados.'))return;
     const updated=store.setStatus(a.id,'archived');selected=updated.id;
     notify('Estado da formação: '+updated.status);renderAdmin();
    }catch(err){notify(err.message,true);}
    return;
   }
   const edit=button.dataset.moduleEdit;if(edit)return editModule(edit);
   const rename=button.dataset.stageRename;if(rename!==undefined){
    const field=document.createElement('input');field.value=a.stages[Number(rename)].title;field.maxLength=100;field.setAttribute('aria-label','Novo nome da etapa');
    const old=button.parentElement.parentElement.querySelector('h4');old.replaceWith(field);button.textContent='Salvar nome';
    button.removeAttribute('data-stage-rename');button.onclick=()=>{const name=field.value.trim();if(!name)return notify('Informe o nome da etapa.',true);
     const stages=core.copy(a.stages);stages[Number(rename)].title=name;updateProgram({...a,stages});};field.focus();return;
   }
   for(const [key,delta] of [['stageUp',-1],['stageDown',1]]){
    if(button.dataset[key]!==undefined){const idx=Number(button.dataset[key]),stages=core.copy(a.stages),target=idx+delta;
     if(target<0||target>=stages.length)return;[stages[idx],stages[target]]=[stages[target],stages[idx]];return updateProgram({...a,stages});}
   }
   for(const [key,delta] of [['moduleUp',-1],['moduleDown',1]]){
    if(button.dataset[key]!==undefined){const [idx,i]=button.dataset[key].split(':').map(Number),stages=core.copy(a.stages),arr=stages[idx].moduleIds,to=i+delta;
     if(to<0||to>=arr.length)return;[arr[i],arr[to]]=[arr[to],arr[i]];return updateProgram({...a,stages});}
   }
  };
 }
 function editModule(id){
  if(!permitted())return;
  if(store.list().enrollments.some(entry=>entry.academyId===selected&&entry.active))return notify('Formação com matrículas ativas: não edite módulos sem versionamento e revisão de impacto no progresso.',true);
  if(!courses.some(c=>c.id===id&&c.academyId===selected))return notify('Módulo indisponível.',true);
  leavePrograms();$('adminTab').click();show('adminView');editCourse(id);
  returnBtn.hidden=false;$('adminHeading').textContent='Módulo da Academia';
 }
 panel.querySelector('#programNew').onclick=()=>{
  if(!permitted())return;
  const root=$('programEditor');root.innerHTML='<form id="newAcademyForm" class="program-settings"><h3>Nova Academia</h3><label>Nome da formação<input name="title" maxlength="150" required minlength="3" placeholder="Ex.: Formação em Eletromecânica"></label><label>Descrição<textarea name="description" rows="3" maxlength="4000"></textarea></label><button class="primary" type="submit">Criar formação em rascunho</button></form>';
  $('newAcademyForm').onsubmit=event=>{event.preventDefault();const f=new FormData(event.target);
   updateProgram({title:f.get('title'),description:f.get('description'),certificateEnabled:false,price:0,stages:[{id:'stage-'+crypto.randomUUID(),title:'Fundamentos',moduleIds:[]}]});
  };
 };
 function seedBlueprint(){
  if(!permitted())return;const blue=window.CONTREM_TRILHA_CATALOG;
  if(!blue?.modules)return notify('Matriz de formação indisponível.',true);
  const id='academy-formacao-mecanicos';const present=fresh().academies.find(a=>a.id===id);
  if(present){selected=id;renderAdmin();return notify('Formação já preparada. Suas edições foram preservadas.');}
  const stageContent=[
   {title:'Fundamentos',cardTitle:'Construa sua base técnica.',cardDescription:'Segurança, mecânica básica, metrologia e documentação.'},
   {title:'Sistemas',cardTitle:'Entenda como tudo funciona.',cardDescription:'Motores diesel, elétrica, eletrônica, hidráulica e trem de força.'},
   {title:'Aplicação',cardTitle:'Pense como um técnico.',cardDescription:'Manutenção, investigação de falhas e estudos de caso virtuais.'}
  ];
  const stages=stageContent.map((item,i)=>({id:'academy-mec-stage-'+(i+1),...item,moduleIds:[]}));
  for(const m of blue.modules){
   const cid='trilha-formacao-'+m.id.toLowerCase(),exists=courses.find(c=>c.id===cid);
   if(exists?.academyId&&exists.academyId!==id)return notify('Um módulo existente pertence a outra Academia.',true);
   if(exists){exists.academyId=id;exists.catalogType=core.MOD;exists.stageId=stages[m.stage-1].id;exists.certificateEnabled=false;}
   else courses.push({id:cid,name:m.name,category:'Academia · Formação de Mecânicos',description:m.description,
    hours:m.hours,status:'draft',format:'series',icon:'⚙️',catalogType:core.MOD,academyId:id,stageId:stages[m.stage-1].id,
    certificateEnabled:false,lessons:m.lessons.map((name,i)=>({id:cid+'-aula-'+String(i+1).padStart(2,'0'),name,url:'',
     description:'Conteúdo técnico em preparação.',minutes:15,supportLinks:[],previewMaterials:[]})),questions:[],passScore:75});
   stages[m.stage-1].moduleIds.push(cid);
  }
  const saved=updateProgram({id,title:'Formação de Mecânicos de Máquinas Pesadas',
   description:'Formação técnica multimarcas 100% online. Projeto pedagógico em revisão.',
   heroKicker:'TRILHA DE CONHECIMENTO · NÍVEL INICIAL AO INTERMEDIÁRIO',
   heroTitle:'Formação de Mecânicos de Máquinas Pesadas',
   heroHighlight:'Mecânicos',
   heroDescription:'Do primeiro contato com a mecânica à análise de sistemas e diagnóstico técnico. Uma jornada completa para quem quer evoluir no universo da linha pesada.',
   stageHeading:'Três etapas. Uma evolução.',
   audience:'Iniciantes e profissionais de manutenção',objectives:'Fundamentos, sistemas e diagnóstico introdutório.',
   price:0,certificateEnabled:false,stages});
  if(saved){save();refresh();notify('Academia criada com 3 etapas e 12 módulos exclusivos em rascunho. Configure as aulas, o Mux e as avaliações antes de publicar.');}
 }
 panel.querySelector('#programSeed').onclick=seedBlueprint;
 function seedDemo(){
  if(!permitted())return;const id='academy-demo-progressao',current=fresh().academies.find(a=>a.id===id);
  if(current){selected=id;renderAdmin();return notify('Academia de demonstração já existe.');}
  const stageId='stage-demo-1',ids=['academy-demo-seguranca','academy-demo-mecanica'];
  const video='https://player.mux.com/hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500';
  for(const [i,cid] of ids.entries())if(!courses.some(c=>c.id===cid))courses.push({
    id:cid,academyId:id,stageId,catalogType:core.MOD,name:i?'TESTE · Mecânica básica':'TESTE · Segurança da oficina',category:'Demonstração da Academia',
    description:'Exemplo fictício para verificar matrículas, sequência e liberação de provas.',hours:.25,format:'single',
    status:'published',certificateEnabled:false,lessons:[{id:cid+'-aula',name:'Aula fictícia '+(i+1),
      description:'Vídeo demonstrativo genérico. Não é uma aula técnica validada.',url:video,minutes:15}],
    questions:[{id:cid+'-questao',text:i?'O que representa torque?':'Qual decisão é segura diante de risco hidráulico?',
      choices:i?['Força aplicada a um braço de alavanca','Temperatura','Pressão atmosférica','Somente velocidade']:['Abrir conexões energizadas','Isolar o equipamento e consultar procedimento autorizado','Ignorar o aviso','Continuar operando'],correct:i?0:1}],
    passScore:100,icon:'🧪'
   });
  const saved=updateProgram({id,title:'TESTE · Academia de Progressão',description:'Formação fictícia de duas etapas para testar desbloqueio de módulos, reprovação e autorização do ADM.',price:0,certificateEnabled:true,
    stages:[{id:stageId,title:'Validação do fluxo',moduleIds:ids}]});
  if(saved){save();refresh();try{store.setStatus(id,'published');}catch(err){notify('Módulos preparados. Aguarde salvar o catálogo, depois publique: '+err.message,true);return;}
    notify('Academia de teste publicada. Vá em Alunos e libere acesso para o aluno de teste.');renderAdmin();}
 }
 panel.querySelector('#programDemo').onclick=seedDemo;
 // Master-only access panel placed inside the EXISTING Alunos section.
 function renderEnrollment(){
  if(!permitted())return;
  const data=store.list(),students=data.students.filter(s=>s.active);
  $('programAccessStudent').innerHTML=students.length?students.map(s=>'<option value="'+e(s.id)+'">'+e(s.name)+' · '+e(s.email)+'</option>').join(''):'<option value="">Crie um aluno primeiro</option>';
  $('programAccessAcademy').innerHTML=data.academies.filter(a=>a.status==='published').map(a=>'<option value="'+e(a.id)+'">'+e(a.title)+'</option>').join('');
  $('programAccessForm').querySelector('button').disabled=!students.length||!data.academies.some(a=>a.status==='published');
  $('programAccessList').innerHTML=data.enrollments.length?data.enrollments.map(entry=>{
   const a=data.academies.find(a=>a.id===entry.academyId),s=data.students.find(s=>s.id===entry.studentId);
   return '<div class="program-enrollment"><div><b>'+e(s?.name||'Aluno')+'</b><small>'+e(a?.title||'Academia')+' · '+(entry.validUntil?'Válido até '+e(entry.validUntil):'Sem prazo')+' · '+e(entry.source)+'</small></div><div><span class="program-status '+(entry.active?'published':'draft')+'">'+(entry.active?'Ativa':'Suspensa')+'</span> <button type="button" class="outline" data-enrollment-student="'+e(entry.studentId)+'" data-enrollment-academy="'+e(entry.academyId)+'" data-enrollment-enabled="'+(entry.active?'false':'true')+'">'+(entry.active?'Suspender':'Reativar')+'</button></div></div>';
  }).join(''):'<p class="muted">Nenhuma matrícula em Academia.</p>';
  $('programRetakeList').innerHTML=data.requests.length?data.requests.slice().reverse().map(r=>{
    const s=data.students.find(s=>s.id===r.studentId),m=courses.find(c=>c.id===r.courseId);
    return '<div class="program-enrollment"><div><b>'+e(s?.name||'Aluno')+'</b><small>'+e(m?.name||'Módulo')+' · Tentativa '+r.forAttempt+' · '+e(r.status)+'</small></div>'+
    (r.status==='pending'?'<div><button type="button" class="primary" data-retake="'+e(r.id)+'" data-decision="approve">Autorizar</button> <button class="outline" type="button" data-retake="'+e(r.id)+'" data-decision="deny">Recusar</button></div>':'')+'</div>';
  }).join(''):'<p class="muted">Nenhuma solicitação de nova tentativa.</p>';
 }
 $('programAccessType').onchange=()=>{$('programAccessDateWrap').hidden=$('programAccessType').value!=='date';};
 $('programAccessForm').onsubmit=event=>{
  event.preventDefault();try{
    const until=$('programAccessType').value==='date'?$('programAccessDate').value:'';
    if($('programAccessType').value==='date'&&!until)throw Error('Escolha a data de validade.');
    store.enroll($('programAccessStudent').value,$('programAccessAcademy').value,true,until,$('programAccessSource').value);
    $('programAccessFeedback').textContent='Acesso à Academia liberado ou renovado. O aluno poderá entrar novamente para carregar os módulos.';
    renderEnrollment();
  }catch(err){$('programAccessFeedback').textContent=err.message;}
 };
 enrollment.onclick=event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.dataset.enrollmentStudent){try{const item=store.list().enrollments.find(x=>x.studentId===b.dataset.enrollmentStudent&&x.academyId===b.dataset.enrollmentAcademy);
    store.enroll(item.studentId,item.academyId,b.dataset.enrollmentEnabled==='true',item.validUntil||'',item.source);
    renderEnrollment();}catch(err){$('programAccessFeedback').textContent=err.message;}}
  else if(b.dataset.retake){try{store.reviewRetake(b.dataset.retake,b.dataset.decision==='approve');renderEnrollment();}
    catch(err){$('programAccessFeedback').textContent=err.message;}}
 };
 const roster=new MutationObserver(()=>{if(permitted()&&!$('adminStudents').hidden)renderEnrollment();});
 roster.observe($('studentRoster'),{subtree:true,childList:true});
 // Student view: overview remains separate from avulsos and does not expose locked lessons.
 function renderStudent(){
  if(!enrolled()){studentPanel.hidden=true;hidePortalFrame();return;}
  studentPanel.hidden=false;
  const {items}=store.studentPrograms(),box=$('studentAcademiesList');box.replaceChildren();
  if(!items.length){box.innerHTML='<p class="muted">Você ainda não possui matrículas em Academias. Seus cursos avulsos continuam disponíveis em Meus Cursos.</p>';hidePortalFrame();return;}
  for(const item of items){
   const button=document.createElement('button');button.className='program-student-card';button.type='button';
   button.innerHTML='<div><span class="tag">'+(item.map.active?'MATRÍCULA ATIVA':'ACESSO EXPIRADO OU SUSPENSO')+'</span><h3>'+e(item.academy.title)+'</h3><p>'+e(item.academy.description)+'</p><small>'+item.map.approved+' de '+item.map.total+' módulos aprovados · '+(item.enrollment.validUntil?'Válido até '+e(item.enrollment.validUntil):'Sem prazo')+'</small></div><span class="program-arrow">→</span>';
   button.onclick=()=>openAcademyPortal(item.academy.id);
   box.append(button);
  }
  if(!opened||!items.some(i=>i.academy.id===opened))opened=items[0].academy.id;
  if(!frame.hidden&&frameReady)sendPortalData();
 }
 function hidePortalFrame(){
  if(portalTimer!==null){clearTimeout(portalTimer);portalTimer=null;}
  frame.hidden=true;
  loading.hidden=true;
  frameReady=false;
  portalRequest=null;
  document.body.classList.remove('academy-immersive');
 }
 function portalProblem(message){
  if(!portalRequest)return;
  if(portalTimer!==null){clearTimeout(portalTimer);portalTimer=null;}
  $('academyPortalLoadingTitle').textContent='Não foi possível abrir a Academia';
  $('academyPortalLoadingMessage').textContent=message||'O painel não respondeu. Tente novamente.';
  $('academyPortalRetry').hidden=false;
  loading.hidden=false;
  frame.style.visibility='hidden';
 }
 function portalLoading(){
  $('academyPortalLoadingTitle').textContent='Abrindo sua Academia';
  $('academyPortalLoadingMessage').textContent='Carregando o painel da formação e verificando sua matrícula.';
  $('academyPortalRetry').hidden=true;
  frame.style.visibility='visible';
  loading.hidden=false;
 }
 $('academyPortalCancel').onclick=()=>{hidePortalFrame();show('studentView');$('myAcademies')?.scrollIntoView({block:'start'});};
 $('academyPortalRetry').onclick=()=>{const id=opened;hidePortalFrame();if(id)openAcademyPortal(id);};
 function preparePortalPayload(academyId){
  if(!enrolled())return null;
  const item=store.studentPrograms().items.find(entry=>entry.academy.id===academyId);
  if(!item)return null;
  const modules=item.map.items;
  const ready=modules.find(m=>m.canOpen&&!m.passed)||null;
  const last=ready&&courses.find(c=>c.id===ready.id);
  const completedLessons=last?new Set(progress[ready.id]||[]):new Set();
  const nextLesson=last?.lessons?.find(l=>!completedLessons.has(l.id))||last?.lessons?.[0]||null;
  const resume=!item.map.active?{status:'blocked',name:'Matrícula indisponível',description:'Consulte a validade da sua matrícula.'}
    :item.map.completed?{status:'completed',name:'Formação concluída',description:'Você concluiu as etapas e avaliações desta formação.'}
    :ready?{status:'available',moduleId:ready.id,started:completedLessons.size>0||ready.attempts>0,
       name:nextLesson?nextLesson.name:ready.name,description:'Módulo: '+ready.name}
    :{status:'blocked',name:'Continue seu desenvolvimento',description:'Consulte sua trilha e os requisitos dos módulos.'};
  const availableCourses=modules.filter(m=>m.canOpen).map(m=>{
   const c=courses.find(x=>x.id===m.id);
   return c?{id:c.id,name:c.name,description:c.description,lessons:(c.lessons||[]).map(l=>({id:l.id,name:l.name}))}:null;
  }).filter(Boolean);
  return {academy:item.academy,map:item.map,enrollment:{active:item.enrollment.active,
   validUntil:item.enrollment.validUntil||null},courses:availableCourses,resume,studentName};
 }
 function sendPortalData(){
  if(frame.hidden||!frameReady||!opened||!enrolled())return;
  const payload=preparePortalPayload(opened);
  if(!payload){hidePortalFrame();return;}
  frame.contentWindow?.postMessage({type:'contrem:academy-data',academyId:opened,request:portalRequest,payload},location.origin);
 }
 function openAcademyPortal(academyId){
  if(!enrolled())return;
  const payload=preparePortalPayload(academyId);
  if(!payload)return;
  show('studentView');
  opened=academyId;
  portalRequest=crypto.randomUUID();
  frameReady=false;
  frame.hidden=false;
  portalLoading();
  document.body.classList.add('academy-immersive');
  const request=portalRequest;
  frame.setAttribute('src','./trilha-formacao/?integrated=1&request='+encodeURIComponent(request));
  if(portalTimer!==null)clearTimeout(portalTimer);
  portalTimer=setTimeout(()=>{
   if(portalRequest===request&&frameReady===false)portalProblem('O painel visual não respondeu ao carregamento. Verifique sua conexão e tente novamente.');
   else if(portalRequest===request&&loading.hidden===false)portalProblem('Os dados da Academia não foram exibidos. Tente novamente.');
  },12000);
  window.scrollTo({top:0,behavior:'auto'});
 }
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==frame.contentWindow||!enrolled())return;
  const msg=event.data;
  if(!portalRequest||msg?.request!==portalRequest)return;
  if(msg.type==='contrem:academy-ready'){frameReady=true;sendPortalData();return;}
  if(msg.type==='contrem:academy-displayed'&&msg.academyId===opened){
   if(portalTimer!==null){clearTimeout(portalTimer);portalTimer=null;}
   frame.style.visibility='visible';
   frame.hidden=false;
   loading.hidden=true;
   document.body.classList.add('academy-immersive');
   return;
  }
  if(msg.type==='contrem:academy-error'){
   portalProblem('A Academia encontrou um problema ao abrir: '+String(msg.message||'falha desconhecida').slice(0,240));
   return;
  }
  if(msg.type!=='contrem:academy-action'||frame.hidden||!opened)return;
  if(msg.action==='back'){hidePortalFrame();show('studentView');$('myAcademies')?.scrollIntoView({block:'start'});return;}
  if(msg.action==='open-module'&&msg.academyId===opened&&typeof msg.moduleId==='string'){
   const item=store.studentPrograms().items.find(x=>x.academy.id===opened);
   if(item?.map.active&&item.map.items.some(m=>m.id===msg.moduleId&&m.canOpen))openModule(opened,msg.moduleId);
  }
 });
 async function openModule(academyId,moduleId){
  if(!enrolled())return;
  const selected=store.studentPrograms().items.find(x=>x.academy.id===academyId);
  if(!selected?.map.active||!selected.map.items.find(m=>m.id===moduleId&&m.canOpen))return alert('Módulo bloqueado ou matrícula sem acesso.');
  if(!courses.some(c=>c.id===moduleId))await window.CONTREM_PREVIEW_SYNC?.reload?.();
  if(!courses.some(c=>c.id===moduleId))return alert('Atualize a sessão do aluno para carregar este módulo.');
  returnToAcademy=academyId;
  openCourse(moduleId);
 }
 function printCert(c){
  const w=window.open('','_blank','width=920,height=740');if(!w)return alert('Permita a abertura de janelas para visualizar.');
  const safe=str=>String(str).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  w.document.write('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Certificado demonstrativo CONTREM</title><style>body{font-family:Georgia,serif;text-align:center;padding:60px;color:#13283d;border:12px double #e69b58}h1{font-size:32px}h2{font-size:38px}p{line-height:1.9}.mark{color:#b54527;font:bold 15px Arial}</style><h1>CONTREM ACADEMIA</h1><p class="mark">DEMONSTRAÇÃO SEM VALIDADE PÚBLICA</p><h2>CERTIFICADO DE CONCLUSÃO</h2><p>Certificamos a conclusão da formação online por</p><h2>'+safe(c.name)+'</h2><p><b>'+safe(c.title)+'</b></p><p>Carga horária: '+safe(c.hours)+'h · Emissão: '+safe(new Date(c.issuedAt).toLocaleDateString('pt-BR'))+'</p><p>Código de teste: '+safe(c.code)+'</p></html>');w.document.close();
 }
 $('refreshAcademies').onclick=async()=>{
  try{await window.CONTREM_PREVIEW_SYNC?.flush?.();await window.CONTREM_PREVIEW_SYNC?.reload?.();renderStudent();}
  catch(err){alert('Não foi possível atualizar: '+err.message);}
 };
 $('studentTab').addEventListener('click',()=>{if(enrolled())renderStudent();});
 studentNav.addEventListener('click',()=>{if(enrolled()){show('studentView');renderStudent();studentPanel.scrollIntoView({behavior:'smooth'});}});
 window.addEventListener('academia:assessment-completed',async()=>{if(!enrolled())return;try{await window.CONTREM_PREVIEW_SYNC?.flush?.();}catch{}renderStudent();});
 window.addEventListener('focus',()=>{if(enrolled())renderStudent();});
 document.getElementById('previewStudentEntry')?.addEventListener('click',()=>setTimeout(renderStudent,400));
 const oldCertificateList=renderCertificateList;
 renderCertificateList=function(){
  oldCertificateList();
  if(!enrolled())return;
  const entries=store.studentPrograms().certificates,holder=$('certificateList');
  for(const item of entries){
   const row=document.createElement('div');row.className='item';
   const title=document.createElement('b');title.textContent=item.title+' · Academia completa';
   const description=document.createElement('span');description.textContent=' · '+item.hours+'h · '+item.code+' ';
   const btn=document.createElement('button');btn.className='outline';btn.type='button';btn.textContent='Abrir certificado';
   btn.onclick=()=>printCert(item);row.append(title,description,btn);holder.append(row);
  }
 };
 const originalRefresh=refresh;
 refresh=function(){originalRefresh();if(enrolled())renderStudent();};
 const originalShow=show;
 show=function(id){
  const result=originalShow(id);
  if(id!=='studentView')hidePortalFrame();
  if(id==='studentView'&&enrolled())renderStudent();
  return result;
 };
 const previousBack=$('back').onclick;
 $('back').onclick=function(event){
  if(returnToAcademy&&selectedCourse?.academyId===returnToAcademy&&enrolled()){
   const academyId=returnToAcademy;
   returnToAcademy=null;
   $('player').src='about:blank';
   openAcademyPortal(academyId);
   return;
  }
  returnToAcademy=null;
  return previousBack?.call(this,event);
 };
 // External guard used by assessment-student.js. All checks are re-evaluated.
 window.CONTREM_PROGRAM_UI={canAttempt:courseId=>store.canAttempt(courseId),consumeRetry:id=>store.consumeRetry(id),requestRetake:id=>store.requestRetake(id),render:renderStudent};
 const search=new URLSearchParams(location.search);
 if(search.get('trilha')==='1'||search.get('academias')==='1')$('login')?.querySelector('.loginbox')?.insertAdjacentHTML('afterbegin','<p class="adm-trilha-external-hint">Após entrar no ADM de teste, abra <b>Academias</b> para gerenciar formações, etapas, módulos e matrículas.</p>');
})();
