/* CONTREM Academia · integrated programs UI, homologation only.
   Existing course/lesson/Mux authoring remains in admin-manager.js. */
(() => {
 'use strict';
 if(window.CONTREM_ACADEMY_CONFIG?.preview!==true||!window.CONTREM_PROGRAM_STORE)return;
 const store=window.CONTREM_PROGRAM_STORE,core=window.CONTREM_PROGRAM_CORE;
 const $=id=>document.getElementById(id),e=s=>esc(s??''),date=()=>core.today();
 window.CONTREM_PROGRAM_COURSE_ACCESS=()=>courses;
 let selected=null,opened=null;
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
 studentPanel.innerHTML='<div class="tag">MINHAS ACADEMIAS</div><div class="row"><div><h2>Minhas formações</h2><p class="muted">Trilhas completas, com etapas e módulos liberados conforme sua aprovação.</p></div><button type="button" class="outline" id="refreshAcademies">Atualizar progresso ↻</button></div><div id="studentAcademiesList"></div><div id="studentAcademyDetail" hidden></div>';
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
  const form=document.createElement('form');form.className='program-settings';form.id='programSettings';
  form.innerHTML=`<div class="program-form-grid"><label>Nome da formação<input name="title" maxlength="150" required value="${e(a.title)}"></label>
   <label>Preço de referência (R$)<input name="price" type="number" min="0" step=".01" max="10000000" value="${Number(a.price)||0}"></label>
   <label class="wide">Descrição<textarea name="description" maxlength="4000" rows="2">${e(a.description)}</textarea></label>
   <label>Público-alvo<input name="audience" maxlength="500" value="${e(a.audience)}"></label>
   <label>Objetivos<input name="objectives" maxlength="1200" value="${e(a.objectives)}"></label>
   <label class="program-checkbox wide"><input name="certificateEnabled" type="checkbox" ${a.certificateEnabled?'checked':''}> Emitir certificado da Academia completa após aprovação em todos os módulos</label></div>
   <button type="submit" class="primary">Salvar configurações</button><small>Preço apenas informativo nesta fase. Acesso liberado manualmente em Alunos.</small>`;
  root.append(form);
  const title=document.createElement('h3');title.textContent='Etapas e módulos exclusivos';root.append(title);
  const note=document.createElement('p');note.className='muted';note.textContent='A ordenação das etapas e módulos define a liberação sequencial ao aluno. Para vídeos Mux, apostilas e provas, use Gerenciar aulas do módulo.';root.append(note);
  const stageList=document.createElement('div');stageList.className='program-stage-list';root.append(stageList);
  a.stages.forEach((stage,idx)=>{
   const box=document.createElement('section');box.className='program-stage';
   box.innerHTML='<div class="program-stage-head"><div><span class="tag">ETAPA '+String(idx+1).padStart(2,'0')+'</span><h4>'+e(stage.title)+'</h4></div><div class="program-stage-actions"><button type="button" class="outline" data-stage-up="'+idx+'" '+(idx===0?'disabled':'')+'>↑</button><button type="button" class="outline" data-stage-down="'+idx+'" '+(idx===a.stages.length-1?'disabled':'')+'>↓</button><button type="button" class="outline" data-stage-rename="'+idx+'">Renomear</button></div></div>';
   const list=document.createElement('div');list.className='program-module-list';
   stage.moduleIds.forEach((id,i)=>{
    const c=courses.find(c=>c.id===id);
    const row=document.createElement('div');row.className='program-module';
    row.innerHTML='<div><b>'+String(i+1).padStart(2,'0')+'. '+e(c?.name||'Módulo não encontrado')+'</b><small>'+Number(c?.hours||0)+'h · '+(c?.lessons?.length||0)+' aulas · '+e(c?.status==='published'?'Publicado':'Rascunho')+'</small></div><div class="program-module-actions"><button type="button" class="outline" data-module-up="'+idx+':'+i+'" '+(i===0?'disabled':'')+'>↑</button><button type="button" class="outline" data-module-down="'+idx+':'+i+'" '+(i===stage.moduleIds.length-1?'disabled':'')+'>↓</button><button type="button" class="primary" data-module-edit="'+e(id)+'">Gerenciar aulas →</button></div>';
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
   updateProgram({...a,title:f.get('title'),price:Number(f.get('price')),description:f.get('description'),audience:f.get('audience'),objectives:f.get('objectives'),certificateEnabled:f.has('certificateEnabled')});
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
   if(action){try{if(action==='archive'&&!confirm('Arquivar esta Academia? Matrículas e histórico serão preservados.'))return;
      const updated=store.setStatus(a.id,action==='archive'?'archived':'published');selected=updated.id;notify('Estado da formação: '+updated.status);renderAdmin();}catch(err){notify(err.message,true);}return;}
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
  const stages=[1,2,3].map((n)=>({id:'academy-mec-stage-'+n,title:['Fundamentos','Sistemas das máquinas','Aplicação e diagnóstico'][n-1],moduleIds:[]}));
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
  const saved=updateProgram({id,title:'Formação de Mecânicos de Máquinas Pesadas',description:'Formação técnica multimarcas 100% online. Projeto pedagógico em revisão.',audience:'Iniciantes e profissionais de manutenção',objectives:'Fundamentos, sistemas e diagnóstico introdutório.',price:0,certificateEnabled:false,stages});
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
  if(!enrolled()){studentPanel.hidden=true;return;}
  studentPanel.hidden=false;
  const {items}=store.studentPrograms(),box=$('studentAcademiesList');box.replaceChildren();
  if(!items.length){box.innerHTML='<p class="muted">Você ainda não possui matrículas em Academias. Seus cursos avulsos continuam disponíveis em Meus Cursos.</p>';$('studentAcademyDetail').hidden=true;return;}
  for(const item of items){
   const button=document.createElement('button');button.className='program-student-card';button.type='button';
   button.innerHTML='<div><span class="tag">'+(item.map.active?'MATRÍCULA ATIVA':'ACESSO EXPIRADO OU SUSPENSO')+'</span><h3>'+e(item.academy.title)+'</h3><p>'+e(item.academy.description)+'</p><small>'+item.map.approved+' de '+item.map.total+' módulos aprovados · '+(item.enrollment.validUntil?'Válido até '+e(item.enrollment.validUntil):'Sem prazo')+'</small></div><span class="program-arrow">→</span>';
   button.onclick=()=>{opened=item.academy.id;renderStudentDetail();};
   box.append(button);
  }
  if(!opened||!items.some(i=>i.academy.id===opened))opened=items[0].academy.id;
  renderStudentDetail();
 }
 function renderStudentDetail(){
  if(!enrolled()||!opened)return;
  const data=store.studentPrograms(),item=data.items.find(i=>i.academy.id===opened),root=$('studentAcademyDetail');
  if(!item){root.hidden=true;return;}root.hidden=false;root.replaceChildren();
  const heading=document.createElement('div');heading.className='program-student-heading';
  heading.innerHTML='<div><span class="tag">MAPA DA FORMAÇÃO</span><h3>'+e(item.academy.title)+'</h3><p>'+item.map.approved+' de '+item.map.total+' módulos aprovados</p></div><span class="program-progress-pct">'+(item.map.total?Math.round(100*item.map.approved/item.map.total):0)+'%</span>';root.append(heading);
  const progressBar=document.createElement('div');progressBar.className='program-progress-track';const fill=document.createElement('span');fill.style.width=(item.map.total?Math.round(100*item.map.approved/item.map.total):0)+'%';progressBar.append(fill);root.append(progressBar);
  const labels={blocked:'Bloqueado',expired:'Acesso indisponível',approved:'Aprovado',available:'Disponível','awaiting-exam':'Pronto para prova',failed:'Reprovado · nova tentativa necessária','retry-pending':'Aguardando ADM Master','retry-approved':'Nova tentativa autorizada'};
  for(const stage of item.academy.stages){
   const block=document.createElement('section');block.className='program-student-stage';
   const title=document.createElement('h4');title.textContent=stage.title;block.append(title);
   for(const id of stage.moduleIds){
    const m=item.map.items.find(x=>x.id===id);if(!m)continue;
    const row=document.createElement('div');row.className='program-student-module'+(m.canOpen?' unlocked':' locked');
    row.innerHTML='<div><b>'+e(m.name)+'</b><small>'+e(labels[m.status])+' · '+m.lessons+' aulas · '+m.hours+'h</small></div>';
    const actions=document.createElement('div');actions.className='program-student-actions';
    if(m.canOpen){const open=document.createElement('button');open.type='button';open.className='primary';open.textContent=m.passed?'Revisar módulo →':'Abrir módulo →';open.onclick=()=>openModule(item.academy.id,id);actions.append(open);}
    if(m.canOpen&&m.status==='failed'){
     const request=document.createElement('button');request.type='button';request.className='outline';request.textContent='Solicitar nova tentativa';
     request.onclick=async()=>{try{await window.CONTREM_PREVIEW_SYNC?.flush?.();store.requestRetake(id);renderStudent();}catch(err){alert(err.message);}};actions.append(request);
    }
    row.append(actions);block.append(row);
   }
   root.append(block);
  }
  const certificate=data.certificates.find(c=>c.academyId===item.academy.id);
  const certArea=document.createElement('div');certArea.className='program-certificate';
  const certMessage=item.academy.certificateEnabled?'Certificado da Academia habilitado pelo ADM Master.':'Esta Academia não emite certificado final.';
  certArea.innerHTML='<b>Certificação da formação</b><p>'+e(certMessage)+'</p>';
  if(certificate){const b=document.createElement('button');b.type='button';b.className='outline';b.textContent='Visualizar certificado de demonstração';b.onclick=()=>printCert(certificate);certArea.append(b);}
  else if(item.academy.certificateEnabled&&item.map.completed&&item.map.active){
   const b=document.createElement('button');b.type='button';b.className='primary';b.textContent='Emitir certificado de demonstração';
   b.onclick=async()=>{try{await window.CONTREM_PREVIEW_SYNC?.flush?.();const cert=store.issueCertificate(item.academy.id);printCert(cert);renderStudent();}catch(err){alert(err.message);}};certArea.append(b);
  }
  root.append(certArea);
 }
 async function openModule(academyId,moduleId){
  if(!enrolled())return;
  const selected=store.studentPrograms().items.find(x=>x.academy.id===academyId);
  if(!selected?.map.active||!selected.map.items.find(m=>m.id===moduleId&&m.canOpen))return alert('Módulo bloqueado ou matrícula sem acesso.');
  if(!courses.some(c=>c.id===moduleId))await window.CONTREM_PREVIEW_SYNC?.reload?.();
  if(!courses.some(c=>c.id===moduleId))return alert('Atualize a sessão do aluno para carregar este módulo.');
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
 window.addEventListener('academia:assessment-completed',()=>{if(enrolled())setTimeout(renderStudent,450);});
 window.addEventListener('focus',()=>{if(enrolled())renderStudent();});
 document.getElementById('previewStudentEntry')?.addEventListener('click',()=>setTimeout(renderStudent,400));
 const originalRefresh=refresh;
 refresh=function(){originalRefresh();if(enrolled())renderStudent();};
 const originalShow=show;
 show=function(id){const result=originalShow(id);if(id==='studentView'&&enrolled())renderStudent();return result;};
 // External guard used by assessment-student.js. All checks are re-evaluated.
 window.CONTREM_PROGRAM_UI={canAttempt:courseId=>store.canAttempt(courseId),consumeRetry:id=>store.consumeRetry(id),requestRetake:id=>store.requestRetake(id),render:renderStudent};
 const search=new URLSearchParams(location.search);
 if(search.get('trilha')==='1'||search.get('academias')==='1')$('login')?.querySelector('.loginbox')?.insertAdjacentHTML('afterbegin','<p class="adm-trilha-external-hint">Após entrar no ADM de teste, abra <b>Academias</b> para gerenciar formações, etapas, módulos e matrículas.</p>');
})();
