// Course authoring UI shared with the existing Academy shell.
(() => {
 'use strict';
 const byId=id=>document.getElementById(id);
 const isMaster=()=>window.AcademySession?.role==='admin';
 const isAdmin=()=>isMaster()||window.AcademySession?.role==='content_admin';
 const makeId=prefix=>prefix+'-'+crypto.randomUUID();
 const externalEdits=new Map();
 window.AcademyAdminEdits={register(name,check,discard){externalEdits.set(name,{check,discard});},canLeave:()=>confirmDiscard(),changed:()=>updateEditStatus()};
 let filter='',statusFilter='all',tab='details',courseBaseline=null,lessonBaseline=null,selectedPhoto='',selectedMaterials=[],selectedLinks=[],uploading=false,attachmentGeneration=0,materialScope='lesson',courseMaterialsBaseline=null;
 const courseFields=['courseName','courseCategory','courseDescription','courseHours','courseFormat'];
 const lessonFields=['lessonName','lessonUrl','lessonDescription','lessonMaterialTitle','lessonMaterialUrl','lessonMinutes'];
 const fingerprint=fields=>JSON.stringify({values:fields.map(id=>byId(id).value),photo:fields===courseFields?selectedPhoto:null,material:fields===lessonFields?selectedMaterials:null,links:fields===lessonFields?selectedLinks:null});
 const materialsFingerprint=()=>JSON.stringify({files:selectedMaterials,links:selectedLinks,title:byId('lessonMaterialTitle').value,url:byId('lessonMaterialUrl').value});
 function pendingEdits(){
  return {
   course:isAdmin()&&courseBaseline!==null&&fingerprint(courseFields)!==courseBaseline,
   external:isAdmin()&&Array.from(externalEdits.values()).some(hook=>hook.check()),
   courseMaterials:isAdmin()&&materialScope==='course'&&courseMaterialsBaseline!==null&&materialsFingerprint()!==courseMaterialsBaseline,
   lesson:isAdmin()&&lessonBaseline!==null&&!byId('lessonForm').classList.contains('hidden')&&fingerprint(lessonFields)!==lessonBaseline
  };
 }
 function hasPendingEdits(){if(uploading)return true;const pending=pendingEdits();return pending.course||pending.lesson||pending.courseMaterials||pending.external;}
 function confirmDiscard(lessonOnly=false){
  if(uploading){notice('Aguarde o envio dos materiais antes de mudar de aula ou sair.',true);return false;}
  const pending=pendingEdits();
  if(!(pending.external||pending.lesson||pending.courseMaterials||!lessonOnly&&pending.course))return true;
  const accepted=confirm('Existem alterações não salvas '+(lessonOnly?'nesta aula':'no curso ou na aula')+'. Deseja descartá-las e continuar?');
  if(accepted)externalEdits.forEach(hook=>{if(hook.check())hook.discard?.();});return accepted;
 }
 function updateEditStatus(){
  const pending=pendingEdits(),dirty=pending.course||pending.lesson||pending.courseMaterials||pending.external,c=current();
  byId('adminEditStatus').textContent=uploading?'Guardando materiais no armazenamento…':dirty?(pending.courseMaterials?'Materiais do curso com alterações não salvas.':pending.course&&pending.lesson?'Curso e aula com alterações não salvas.':pending.course?'Informações do curso com alterações não salvas.':'Aula com alterações não salvas.'):'';
  byId('adminPublish').disabled=!isMaster()||uploading||dirty||!c||!!readiness(c)||c.status==='published';
  byId('adminUnpublish').disabled=!isMaster()||uploading||dirty;
  byId('saveLesson').disabled=uploading;byId('saveCourseMaterials').disabled=uploading;byId('lessonMaterialFile').disabled=uploading;
  byId('editingStatus').classList.toggle('pending',!!dirty);
 }
 function savedBaseline(part='all'){
  if(part!=='lesson')courseBaseline=fingerprint(courseFields);
  if(part!=='course')lessonBaseline=fingerprint(lessonFields);
  updateEditStatus();
 }
 const current=()=>courses.find(c=>c.id===byId('editId').value)||null;
 const typeOf=c=>c.format==='single'?'single':'series';
 const notice=(text,error=false)=>{byId('adminFeedback').textContent=text;byId('adminFeedback').classList.toggle('error',error);};
 function readiness(c){
  if(!c.name.trim()||!String(c.description||'').trim())return 'Preencha o nome e a descrição do curso.';
  if(!c.lessons.length)return 'Cadastre pelo menos uma aula antes de publicar.';
  if(typeOf(c)==='single'&&c.lessons.length!==1)return 'Um curso de aula única deve ter exatamente uma aula.';
  if(c.lessons.some(l=>!l.name.trim()||!videoId(l.url)))return 'Informe o link do player ou Playback ID do Mux em todas as aulas antes de publicar.';
  return '';
 }
 const grid=byId('adminView').querySelector(':scope > .admin');
 const oldPanel=grid.firstElementChild;
 const courseForm=byId('courseForm'),lessonForm=byId('lessonForm'),questionForm=byId('questionForm');
 const assessment=document.createElement('details');assessment.className='admin-assessment';
 assessment.innerHTML='<summary>Avaliação do curso <small>Opcional · demonstrativa</small></summary><p class="muted">Selecione um curso para organizar sua avaliação.</p>';
 ['passScore','questionForm','questionAdminList'].forEach(id=>{const el=byId(id);assessment.append(id==='passScore'?el.parentElement:el);});
 grid.className='admin adm-workspace';
 grid.innerHTML='<aside class="panel adm-library"><div class="row"><h2>Seus cursos</h2><button class="primary" id="newAdminCourse" type="button">+ Novo curso</button></div><label class="sr-only" for="adminCourseSearch">Buscar curso</label><input id="adminCourseSearch" type="search" placeholder="Buscar por curso ou categoria"><label class="sr-only" for="adminStatusFilter">Filtrar cursos</label><select id="adminStatusFilter"><option value="all">Todos os cursos</option><option value="draft">Rascunhos</option><option value="published">Publicados na prévia</option></select><div id="adminCourses"></div></aside><section class="panel adm-editor"><div class="adm-editor-head"><div><small class="tag">CONSTRUTOR DE CURSOS</small><h2 id="formTitle">Novo curso</h2></div><span id="editingStatus" class="adm-badge">Novo rascunho</span></div><div class="adm-steps" role="tablist" aria-label="Etapas do curso"><button type="button" data-admin-tab="details" role="tab">1. Informações</button><button type="button" data-admin-tab="lessons" role="tab">2. Aulas e materiais</button><button type="button" data-admin-tab="review" role="tab">3. Revisão</button></div><div id="admDetails" role="tabpanel"></div><div id="admLessons" role="tabpanel" hidden><div class="row"><div><h3>Conteúdo do curso</h3><p id="lessonHint" class="muted">Salve o curso para adicionar aulas.</p></div><button type="button" id="newAdminLesson" class="outline">+ Adicionar aula</button></div><ol id="adminLessonOrder" class="adm-lesson-order"></ol></div><div id="admReview" role="tabpanel" hidden><div id="adminReviewContent"></div><div class="adm-review-actions"><button type="button" id="adminPublish" class="primary">Publicar na prévia</button><button type="button" id="adminUnpublish" class="outline">Voltar a rascunho</button></div></div><p id="adminFeedback" role="status" aria-live="polite"></p></section>';
 byId('admDetails').append(courseForm);
 const testSetup=document.createElement('details');
 testSetup.className='panel';
 testSetup.innerHTML='<summary>Criar aulas e provas de teste</summary><p>Cria dois cursos publicados nesta prévia: uma aula única e uma série com três aulas, com avaliações de quatro questões e nota mínima de 75%. O mesmo vídeo será usado nas quatro aulas.</p><label for="testMuxUrl">Link ou Playback ID público do Mux para o teste</label><input id="testMuxUrl" placeholder="https://player.mux.com/SEU_PLAYBACK_ID"><button type="button" class="outline" id="createTestCourses">Criar cursos de teste</button><p>Depois, em Alunos, crie um login fictício e libere os dois cursos. Os dados ficam neste navegador.</p>';
 grid.before(testSetup);
 if(window.CONTREM_ACADEMY_CONFIG?.mode==='connected'){
  testSetup.hidden=true;
  byId('adminPublish').textContent='Publicar curso';
  byId('adminStatusFilter').querySelector('option[value="published"]').textContent='Publicados';
 }
 byId('createTestCourses').onclick=()=>{
  if(!isMaster()||!window.AcademySession?.preview)return;
  if(hasPendingEdits()){notice('Salve as alterações em edição antes de criar os cursos de teste.',true);return;}
  const playback=videoId(byId('testMuxUrl').value);
  if(!playback){notice('Informe um link público do Mux ou Playback ID válido para testar o vídeo.',true);return;}
  const additions=window.AcademyAdminPreviewService.buildTestCourses(playback).filter(d=>!courses.some(c=>c.id===d.id));
  if(!additions.length){notice('Os dois cursos de teste já existem. Você pode editá-los na lista.');return;}
  courses.push(...additions);save();refresh();
  notice(additions.length+' curso(s) de teste criado(s). Em Alunos, libere o acesso para um login fictício.');
 };

 byId('admLessons').append(lessonForm,assessment);
 byId('adminFeedback').insertAdjacentHTML('beforebegin','<p id="adminEditStatus" class="adm-edit-status" role="status" aria-live="polite"></p>');
 // Keep original IDs and handlers; arrange the existing forms around the authoring flow.
 byId('courseIcon').parentElement.hidden=true;
 const photoField=byId('coursePhoto').parentElement;
 photoField.innerHTML='<label for="coursePhotoFile">Foto de capa</label><input id="coursePhotoFile" type="file" accept="image/jpeg,image/png,image/webp"><small class="muted">Escolha uma foto JPG, PNG ou WebP. A imagem será ajustada para a capa do curso.</small><div class="adm-cover-preview" id="admCoverPreview" hidden><img id="coursePhotoPreview" alt="Prévia da foto de capa"><button type="button" id="removeCoursePhoto" class="outline">Remover foto</button></div>';
 byId('courseName').maxLength=150;byId('courseCategory').maxLength=100;byId('courseDescription').maxLength=4000;
 byId('courseHours').min='0.25';byId('courseHours').step='0.25';
 byId('courseHours').parentElement.insertAdjacentHTML('afterend','<div class="field"><label for="courseFormat">Formato do curso</label><select id="courseFormat"><option value="series">Série de aulas</option><option value="single">Aula única</option></select><small class="muted">Aula única para um conteúdo direto; série para uma sequência de aulas.</small></div>');
 courseForm.querySelector('button.primary').textContent='Salvar informações';
 byId('resetForm').textContent='Novo curso';
 byId('lessonUrl').required=false;
 byId('lessonUrl').parentElement.querySelector('label').textContent='Link do vídeo Mux (URL ou Playback ID)';
 byId('lessonUrl').placeholder='https://stream.mux.com/ID.m3u8 ou ID do Playback';
 byId('lessonUrl').insertAdjacentHTML('afterend','<small class="muted">Cole o link do player Mux ou o Playback ID do vídeo processado no Mux.</small>');
 const materialsSection=document.createElement('section');materialsSection.id='lessonSupportSection';materialsSection.className='adm-materials-section';materialsSection.setAttribute('aria-labelledby','lessonSupportHeading');
 materialsSection.innerHTML='<h3 id="lessonSupportHeading" tabindex="-1">Materiais de apoio</h3><b id="supportScopeLabel">Somente esta aula</b><p>Adicione arquivos para baixar ou links externos para o aluno abrir, como vídeos do YouTube, manuais e apresentações. O vídeo principal da aula continua no Mux.</p><div class="adm-material-group"><h4>Arquivos para baixar</h4><button type="button" id="attachSupportFiles" class="primary">+ Anexar arquivos</button><label for="lessonMaterialFile">Escolha um ou vários arquivos</label><input id="lessonMaterialFile" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.odt,.xls,.xlsx,.ods,.ppt,.pptx,.odp,.txt,.epub,.mp4,.webm"><small>Até 20 arquivos por aula ou curso. Documentos, livros PDF/EPUB, slides e imagens: até 50 MB cada. Vídeos de apoio MP4/WebM: até 500 MB cada. Anexos salvos somente neste navegador da prévia.</small><div id="lessonMaterialAttachment" class="adm-attachment-status" aria-live="polite">Nenhum material anexado.</div></div><div id="supportLinkEditor" class="adm-material-group"><h4>Links externos</h4><p>Até 20 links HTTPS por aula ou curso. Exemplo: https://www.youtube.com/watch?v=...</p></div>';
 byId('saveLesson').before(materialsSection);
 const linkEditor=byId('supportLinkEditor');
 byId('lessonMaterialTitle').parentElement.querySelector('label').textContent='Nome do link';
 byId('lessonMaterialTitle').maxLength=150;byId('lessonMaterialTitle').placeholder='Ex.: Vídeo complementar no YouTube';
 byId('lessonMaterialUrl').parentElement.querySelector('label').textContent='Endereço do link (HTTPS)';
 byId('lessonMaterialUrl').maxLength=2000;byId('lessonMaterialUrl').placeholder='https://www.youtube.com/watch?v=...';
 linkEditor.append(byId('lessonMaterialTitle').parentElement,byId('lessonMaterialUrl').parentElement);
 linkEditor.insertAdjacentHTML('beforeend','<div class="row"><button type="button" id="addSupportLink" class="outline">+ Adicionar link</button><button type="button" id="clearSupportLink" class="outline">Limpar campos do link</button></div><p id="supportSaveHint" class="muted">Depois de adicionar arquivos ou links, clique em Salvar aula.</p><div id="supportLinksList" aria-live="polite"></div>');
 const courseMaterialsForm=document.createElement('form');courseMaterialsForm.id='courseMaterialsForm';courseMaterialsForm.hidden=true;
 courseMaterialsForm.innerHTML='<h3>Materiais do curso completo</h3><p>Apostila, manual ou link comum a todas as aulas. Estes materiais ficam no curso e aparecem em cada aula, sem duplicar arquivos.</p><button id="saveCourseMaterials" type="submit" class="primary">Salvar materiais do curso</button> <button id="cancelCourseMaterials" type="button" class="outline">Fechar materiais do curso</button>';
 byId('admLessons').append(courseMaterialsForm);
 const courseMaterialsEntry=document.createElement('div');courseMaterialsEntry.className='adm-course-materials-entry';courseMaterialsEntry.innerHTML='<button type="button" class="primary" id="openCourseMaterials">Materiais do curso completo</button><p>Para apostilas e arquivos comuns a todas as aulas. Para um material específico, use Materiais de apoio na aula desejada.</p>';
 byId('adminLessonOrder').before(courseMaterialsEntry);
 function setMaterialScope(scope){
  materialScope=scope;
  byId('supportScopeLabel').textContent=scope==='course'?'Curso completo · disponível em todas as aulas':'Somente esta aula';
  byId('supportSaveHint').textContent=scope==='course'?'Depois de adicionar arquivos ou links, clique em Salvar materiais do curso.':'Depois de adicionar arquivos ou links, clique em Salvar aula.';
  byId(scope==='course'?'saveCourseMaterials':'saveLesson').before(materialsSection);
  courseMaterialsForm.hidden=scope!=='course';
 }
 byId('openCourseMaterials').onclick=()=>{
  const c=current();if(!isAdmin())return;
  if(!c){notice('Salve as informações do curso antes de adicionar os materiais.',true);return;}
  if(!confirmDiscard())return;
  openEditor(c.id,'lessons',true);lessonForm.classList.add('hidden');setMaterialScope('course');
  selectedMaterials=(Array.isArray(c.previewMaterials)?c.previewMaterials:c.previewMaterial?[c.previewMaterial]:[]).map(file=>({...file}));selectedLinks=linksForLesson(c);
  byId('lessonMaterialTitle').value='';byId('lessonMaterialUrl').value='';renderAttachmentStatus();renderSupportLinks();courseMaterialsBaseline=materialsFingerprint();updateEditStatus();materialsSection.scrollIntoView({behavior:'smooth',block:'start'});byId('lessonSupportHeading').focus();
 };
 courseMaterialsForm.onsubmit=event=>{
  event.preventDefault();if(!isAdmin()||materialScope!=='course')return;
  if(uploading){notice('Aguarde os materiais terminarem de salvar.',true);return;}
  if(byId('lessonMaterialTitle').value.trim()||byId('lessonMaterialUrl').value.trim()){notice('Clique em Adicionar link ou limpe os campos antes de salvar os materiais do curso.',true);return;}
  const c=current();if(!c)return;
  c.previewMaterials=selectedMaterials.map(file=>({...file}));c.supportLinks=selectedLinks.map(link=>({...link}));c.materialTitle='';c.materialUrl='';delete c.previewMaterial;c.status='draft';
  save();courseMaterialsBaseline=materialsFingerprint();refresh();notice('Materiais do curso salvos. Revise e publique para liberar aos alunos.');
 };
 byId('cancelCourseMaterials').onclick=()=>{if(!confirmDiscard(true))return;resetLessonForm();lessonForm.classList.add('hidden');updateEditStatus();};
 courseMaterialsForm.addEventListener('input',updateEditStatus);courseMaterialsForm.addEventListener('change',updateEditStatus);
 byId('attachSupportFiles').onclick=()=>{if(!uploading)byId('lessonMaterialFile').click();};
 byId('admLessons').querySelector('.row').insertAdjacentHTML('afterend','<p class="adm-materials-hint">Para anexar arquivos ou adicionar um link, clique em <b>Materiais de apoio</b> na aula desejada.</p>');
 byId('lessonName').maxLength=180;
 byId('lessonDescription').maxLength=4000;
 byId('lessonName').parentElement.insertAdjacentHTML('afterend','<div class="field"><label for="lessonMinutes">Duração estimada (minutos, opcional)</label><input id="lessonMinutes" type="number" min="1" max="10000" step="1"></div>');
 const stats=document.createElement('div');stats.id='admStats';stats.className='adm-stats';
 grid.before(stats);
 byId('adminView').querySelector(':scope > .notice').textContent='Ambiente de teste: cursos, logins e liberações ficam somente neste navegador. A publicação aqui libera o curso apenas aos alunos de teste.';
 byId('adminStudents').querySelector(':scope > .muted').textContent=window.CONTREM_ACADEMY_CONFIG?.mode==='connected'
  ?'Cadastre os alunos reais e conceda acesso aos cursos publicados. Cada aluno entra com sua conta da Academia.'
  :'Crie um login de teste com dados fictícios e uma senha de pelo menos 8 caracteres. Depois libere os cursos desejados. O aluno entra por esta mesma prévia e neste navegador.';
 // A release de produção não possui o formulário de acesso fictício.
 // Nunca interromper o construtor quando este elemento não existir.
 if(byId('demoAccess'))byId('demoAccess').hidden=true;
 byId('cloudImportHint').hidden=true;
 function chooseTab(value){
  tab=value;
  ['details','lessons','review'].forEach(t=>{
   const b=document.querySelector('[data-admin-tab="'+t+'"]');
   b.classList.toggle('selected',t===value);b.setAttribute('aria-selected',String(t===value));
   byId({details:'admDetails',lessons:'admLessons',review:'admReview'}[t]).hidden=t!==value;
  });
  renderEditor();
 }
 function renderEditor(){
  const c=current();byId('editingStatus').textContent=c?(c.status==='published'?'Publicado na prévia':'Rascunho'):'Novo rascunho';
  byId('editingStatus').classList.toggle('published',c?.status==='published');
  byId('newAdminLesson').disabled=false;
  byId('lessonHint').textContent=c?c.name+' · '+(typeOf(c)==='single'?'Aula única':'Série de aulas'):'Preencha e salve as informações do curso para começar a adicionar aulas.';
  byId('adminLessonOrder').innerHTML=c?.lessons.length?c.lessons.map((l,i)=>'<li><span class="adm-order">'+(i+1)+'</span><div class="adm-lesson-info"><b>'+esc(l.name)+'</b><small>'+ (videoId(l.url)?'Vídeo Mux cadastrado':'Link do Mux pendente')+((l.previewMaterials?.length||l.previewMaterial)?' · Materiais anexados':'')+(l.minutes?' · '+Number(l.minutes)+' min':'')+'</small></div><div class="adm-lesson-actions"><button type="button" class="primary" data-lesson-materials="'+i+'">Materiais de apoio</button><button type="button" class="outline" data-lesson-edit="'+i+'">Editar aula</button><button type="button" class="outline" data-move="'+i+':-1" aria-label="Subir aula '+(i+1)+'" '+(i===0?'disabled':'')+'>↑</button><button type="button" class="outline" data-move="'+i+':1" aria-label="Descer aula '+(i+1)+'" '+(i===c.lessons.length-1?'disabled':'')+'>↓</button><button type="button" class="danger" data-lesson-delete="'+i+'" aria-label="Remover aula '+(i+1)+'">Remover</button></div></li>').join(''):'<li class="adm-empty"><b>A sequência começa aqui.</b><span>Adicione a primeira aula e organize o conteúdo do curso.</span></li>';
  byId('adminReviewContent').innerHTML=c?'<div class="adm-review-title"><span class="adm-badge">'+(typeOf(c)==='single'?'Aula única':'Série de aulas')+'</span><h3>'+esc(c.name)+'</h3><p>'+esc(c.description)+'</p></div><dl class="adm-review-meta"><div><dt>Categoria</dt><dd>'+esc(c.category||'Sem categoria')+'</dd></div><div><dt>Carga horária</dt><dd>'+Number(c.hours||8)+' horas</dd></div><div><dt>Conteúdo</dt><dd>'+c.lessons.length+' aula(s)</dd></div></dl><p class="'+(readiness(c)?'notice':'adm-ready')+'">'+esc(readiness(c)||'Tudo pronto. Publique e libere o acesso no módulo Alunos.')+'</p><button type="button" id="adminStudentPreview" class="outline">Visualizar sala do aluno →</button>':'<div class="adm-empty">Salve um curso para revisar e publicar.</div>';
  byId('adminPublish').hidden=!isMaster();byId('adminPublish').disabled=!isMaster()||!c||!!readiness(c)||c.status==='published';
  byId('adminUnpublish').hidden=!isMaster()||c?.status!=='published';
  byId('adminStudentPreview')?.addEventListener('click',()=>openCourse(c.id));
  updateEditStatus();
 }
 function renderLibrary(){
  byId('admStats').innerHTML=[['Cursos',courses.length],['Rascunhos',courses.filter(c=>c.status!=='published').length],['Publicados na prévia',courses.filter(c=>c.status==='published').length],['Aulas',courses.reduce((n,c)=>n+c.lessons.length,0)]].map(([label,n])=>'<div><small>'+label+'</small><strong>'+n+'</strong></div>').join('');
  const list=courses.filter(c=>(statusFilter==='all'||(c.status||'draft')===statusFilter)&&(c.name+' '+(c.category||'')).toLocaleLowerCase('pt-BR').includes(filter));
  byId('adminCourses').innerHTML=list.length?list.map(c=>'<article class="adm-course-card '+(current()?.id===c.id?'editing':'')+'">'+(c.photo?'<img class="adm-course-thumb" src="'+esc(c.photo)+'" alt="">':'')+'<div class="row"><span class="adm-badge '+(c.status==='published'?'published':'')+'">'+(c.status==='published'?'Publicado':'Rascunho')+'</span><small>'+ (typeOf(c)==='single'?'Aula única':'Série de aulas')+'</small></div><h3>'+esc(c.name)+'</h3><p>'+esc(c.category||'Sem categoria')+' · '+c.lessons.length+' aula(s) · '+Number(c.hours||8)+'h</p><div class="adm-card-actions"><button type="button" class="outline" data-course-edit="'+esc(c.id)+'">Gerenciar curso →</button><button type="button" class="outline" data-course-copy="'+esc(c.id)+'" aria-label="Duplicar '+esc(c.name)+'">Duplicar</button><button type="button" class="danger" data-course-delete="'+esc(c.id)+'">Excluir</button></div></article>').join(''):'<div class="adm-empty"><b>'+ (courses.length?'Nenhum resultado.':'Seu primeiro curso começa aqui.')+'</b><span>'+ (courses.length?'Ajuste a busca ou o filtro.':'Clique em Novo curso e organize seu treinamento.')+'</span></div>';
  renderEditor();
 }
 const oldRefresh=refresh;refresh=function(){
  oldRefresh();renderLibrary();
  if(window.AcademySession?.preview){
   document.querySelector('.demo-chip').textContent='PRÉVIA ISOLADA · '+(isAdmin()?'ADM':'ALUNO');
   byId('cloudImportHint').hidden=true;
   byId('downloadPending').hidden=true;
  }
 };
 function openEditor(id,section='details',discardChecked=false){
  if(!isAdmin())return;
  const c=courses.find(c=>c.id===id);if(!c)return;
  if(!discardChecked&&!confirmDiscard())return false;
  selectedCourse=c;byId('editId').value=c.id;byId('courseName').value=c.name;byId('courseCategory').value=c.category||'';
  byId('courseDescription').value=c.description||'';byId('courseHours').value=c.hours||8;
  selectedPhoto=c.photo||'';showCoverPreview(selectedPhoto);byId('coursePhotoFile').value='';byId('courseIcon').value=c.icon||'⚙️';byId('courseFormat').value=typeOf(c);
  byId('formTitle').textContent='Editar curso';lessonForm.classList.add('hidden');resetLessonForm();renderQuestionAdmin();notice('');savedBaseline();chooseTab(section);renderLibrary();return true;
 }
 editCourse=id=>openEditor(id);
 selectLessons=id=>openEditor(id,'lessons');
 const oldReset=resetForm;resetForm=function(){
  oldReset();byId('courseFormat').value='series';selectedPhoto='';showCoverPreview('');byId('coursePhotoFile').value='';selectedCourse=null;lessonForm.classList.add('hidden');byId('lessonMinutes').value='';notice('');savedBaseline();chooseTab('details');renderLibrary();
 };
 function newCourse(){if(isAdmin()&&confirmDiscard()){resetForm();byId('courseName').focus();}}
 byId('resetForm').onclick=newCourse;byId('newAdminCourse').onclick=newCourse;
 courseForm.onsubmit=event=>{
  event.preventDefault();if(!isAdmin())return;
  if(uploading||pendingEdits().lesson||pendingEdits().courseMaterials){notice('Salve a aula em edição ou cancele suas alterações antes de salvar as informações do curso.',true);chooseTab('lessons');return;}
  const c=current(),format=byId('courseFormat').value;
  if(format==='single'&&c?.lessons.length>1){notice('Este curso já tem várias aulas. Mantenha série de aulas ou remova as aulas extras antes de mudar o formato.',true);return;}
  const photo=selectedPhoto,name=byId('courseName').value.trim();
  if(!name){notice('Informe o nome do curso.',true);return;}
  const hours=Number(byId('courseHours').value);
  if(!Number.isFinite(hours)||hours<0.25||hours>500||!Number.isInteger(hours*4)){notice('Informe uma carga horária de 0,25 a 500 horas, em intervalos de 0,25.',true);return;}
  const data={name,category:byId('courseCategory').value.trim(),description:byId('courseDescription').value.trim(),hours:Number(byId('courseHours').value),photo,icon:'⚙️',format,status:'draft'};
  const id=c?.id||makeId('course');
  if(c)Object.assign(c,data);else courses.push({id,...data,lessons:[]});
  save();openEditor(id,'lessons',true);refresh();notice('Informações salvas como rascunho. Adicione as aulas e revise antes de publicar.');
 };
 function showCoverPreview(source){
  const preview=byId('admCoverPreview'),image=byId('coursePhotoPreview');
  preview.hidden=!source;
  if(source)image.src=source;else image.removeAttribute('src');
 }
 function fileAsDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Não foi possível ler a foto.'));reader.readAsDataURL(blob);});}
 async function prepareCover(file){
  if(!file)return '';
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Escolha uma imagem JPG, PNG ou WebP.');
  if(file.size>12*1024*1024)throw new Error('A foto deve ter até 12 MB.');
  const bitmap=await createImageBitmap(file),scale=Math.min(1,1400/bitmap.width,1000/bitmap.height),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const context=canvas.getContext('2d');if(!context){bitmap.close?.();throw new Error('Este navegador não conseguiu preparar a foto.');}
  context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
  let quality=.84,blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
  while(blob&&blob.size>700*1024&&quality>.5){quality-=.1;blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));}
  if(!blob||blob.size>700*1024)throw new Error('Não foi possível reduzir a foto para o tamanho permitido. Escolha uma imagem menor.');
  return fileAsDataUrl(blob);
 }
 byId('coursePhotoFile').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  try{selectedPhoto=await prepareCover(file);showCoverPreview(selectedPhoto);notice('Foto de capa carregada. Salve as informações para guardar no curso.');updateEditStatus();}
  catch(error){event.target.value='';notice(error.message,true);}
 });
 byId('removeCoursePhoto').onclick=()=>{selectedPhoto='';byId('coursePhotoFile').value='';showCoverPreview('');updateEditStatus();};
 function linksForLesson(lesson){
  const values=[...(Array.isArray(lesson.supportLinks)?lesson.supportLinks:[]),...(lesson.materialUrl?[{title:lesson.materialTitle||'Material de apoio',url:lesson.materialUrl}]:[])],seen=new Set();
  return values.filter(link=>link&&typeof link.url==='string').map(link=>({title:(String(link.title||'Material de apoio').trim().slice(0,150)||'Material de apoio'),url:safeHttps(link.url)})).filter(link=>link.url&&link.url.length<=2000&&!seen.has(link.url)&&(seen.add(link.url),true)).slice(0,20);
 }
 function renderSupportLinks(){
  const holder=byId('supportLinksList');holder.textContent='';
  if(!selectedLinks.length){holder.textContent='Nenhum link adicionado.';return;}
  const list=document.createElement('ul');selectedLinks.forEach((link,index)=>{
   const row=document.createElement('li'),label=document.createElement('span'),button=document.createElement('button');label.textContent=link.title+' · '+link.url;
   button.type='button';button.className='outline';button.dataset.removeSupportLink=String(index);button.textContent='Remover link';button.setAttribute('aria-label','Remover link '+link.title);
   button.onclick=()=>{if(uploading)return;selectedLinks.splice(index,1);renderSupportLinks();updateEditStatus();};row.append(label,button);list.append(row);
  });holder.append(list);
 }
 byId('addSupportLink').onclick=()=>{
  if(!isAdmin()||uploading)return;
  const title=byId('lessonMaterialTitle').value.trim(),url=safeHttps(byId('lessonMaterialUrl').value);
  if(!title||title.length>150){notice('Informe um nome para o link, com até 150 caracteres.',true);return;}
  if(!url||url.length>2000){notice('Use um endereço HTTPS válido, sem usuário ou senha, com até 2.000 caracteres.',true);return;}
  if(selectedLinks.some(link=>link.url===url)){notice('Este link já foi adicionado à aula.',true);return;}
  if(selectedLinks.length>=20){notice('Este conjunto de materiais permite até 20 links.',true);return;}
  selectedLinks.push({title,url});byId('lessonMaterialTitle').value='';byId('lessonMaterialUrl').value='';renderSupportLinks();updateEditStatus();notice(materialScope==='course'?'Link adicionado. Clique em Salvar materiais do curso.':'Link adicionado. Clique em Salvar aula para guardar os materiais.');
 };
 byId('clearSupportLink').onclick=()=>{if(uploading)return;byId('lessonMaterialTitle').value='';byId('lessonMaterialUrl').value='';updateEditStatus();};
 function renderAttachmentStatus(){
  const container=byId('lessonMaterialAttachment');container.textContent='';
  if(!selectedMaterials.length){container.textContent='Nenhum material anexado.';return;}
  const list=document.createElement('ul');
  selectedMaterials.forEach((material,index)=>{
   const row=document.createElement('li'),name=document.createElement('span'),button=document.createElement('button');
   name.textContent=material.name+' · '+(material.size/1024/1024).toFixed(1)+' MB ';
   button.type='button';button.className='outline';button.textContent='Remover';button.setAttribute('aria-label','Remover '+material.name);button.dataset.removeMaterial=String(index);button.disabled=uploading;
   button.onclick=()=>{if(uploading)return;selectedMaterials.splice(index,1);renderAttachmentStatus();updateEditStatus();};
   row.append(name,button);list.append(row);
  });container.append(list);
 }
 async function attachLocalFiles(files){
  if(!isAdmin()||!files.length||uploading)return;
  const media=window.AcademyPreviewMedia;
  if(!media){notice('Anexos locais indisponíveis neste navegador. Recarregue a prévia e tente novamente.',true);return;}
  if(files.length+selectedMaterials.length>media.MAX_FILES){notice('Este conjunto de materiais permite até 20 arquivos.',true);byId('lessonMaterialFile').value='';return;}
  try{files.forEach(file=>media.validate(file,'support'));}catch(error){notice(error.message,true);byId('lessonMaterialFile').value='';return;}
  const expected=++attachmentGeneration,scope=materialScope,courseId=current()?.id,lessonId=byId('editLessonId').value;
  uploading=true;renderAttachmentStatus();updateEditStatus();
  try{
   for(const file of files){
    const metadata=await media.save(file,'support');
    if(expected!==attachmentGeneration||scope!==materialScope||!isAdmin()||current()?.id!==courseId||byId('editLessonId').value!==lessonId)return;
    selectedMaterials.push(metadata);renderAttachmentStatus();
   }
   notice(window.CONTREM_ACADEMY_CONFIG?.mode==='connected'?(materialScope==='course'?'Materiais enviados ao armazenamento privado. Clique em Salvar materiais do curso.':'Materiais enviados ao armazenamento privado. Salve a aula para vinculá-los ao curso.'):(materialScope==='course'?'Materiais guardados nesta prévia. Clique em Salvar materiais do curso.':'Materiais guardados nesta prévia. Salve a aula para vinculá-los ao curso.'));
  }catch(error){if(expected===attachmentGeneration)notice(error.message||'O navegador não conseguiu guardar este anexo.',true);}
  finally{if(expected===attachmentGeneration){uploading=false;byId('lessonMaterialFile').value='';renderAttachmentStatus();updateEditStatus();}}
 }
 byId('lessonMaterialFile').addEventListener('change',event=>attachLocalFiles(Array.from(event.target.files||[])));
 const oldResetLesson=resetLessonForm;resetLessonForm=function(){attachmentGeneration++;uploading=false;courseMaterialsBaseline=null;setMaterialScope('lesson');oldResetLesson();byId('lessonUrl').value='';byId('lessonMinutes').value='';selectedMaterials=[];selectedLinks=[];renderSupportLinks();byId('lessonMaterialFile').value='';renderAttachmentStatus();savedBaseline('lesson');};
 byId('newAdminLesson').onclick=()=>{
  if(!isAdmin())return;
  let c=current();
  if(!c){
   if(pendingEdits().lesson||pendingEdits().courseMaterials){notice('Salve ou cancele a aula em edição antes de continuar.',true);chooseTab('lessons');return;}
   courseForm.onsubmit({preventDefault(){}});c=current();
   if(!c){notice('Preencha e salve as informações do curso antes de adicionar aulas.',true);chooseTab('details');byId('courseName').focus();return;}
  }
  if(typeOf(c)==='single'&&c.lessons.length){notice('Este curso está configurado como aula única. Altere para Série de aulas nas informações para adicionar outra aula.',true);chooseTab('details');byId('courseFormat').focus();return;}
  if(!confirmDiscard(true))return;
  selectedCourse=c;resetLessonForm();byId('lessonMinutes').value='';lessonForm.classList.remove('hidden');byId('lessonName').focus();
 };
 editLesson=function(id,i){
  if(!isAdmin())return;const c=courses.find(c=>c.id===id),lesson=c?.lessons[i];if(!lesson)return;
  if(current()?.id!==id){if(!openEditor(id,'lessons'))return;}else if(!confirmDiscard(true))return;
  setMaterialScope('lesson');courseMaterialsBaseline=null;
  selectedCourse=c;byId('editLessonId').value=lesson.id;byId('lessonName').value=lesson.name;byId('lessonUrl').value=lesson.url;
  byId('lessonDescription').value=lesson.description||'';byId('lessonMaterialTitle').value='';
  byId('lessonMaterialUrl').value='';selectedLinks=linksForLesson(lesson);renderSupportLinks();byId('lessonMinutes').value=lesson.minutes||'';selectedMaterials=(Array.isArray(lesson.previewMaterials)?lesson.previewMaterials:lesson.previewMaterial?[lesson.previewMaterial]:[]).map(material=>({...material}));byId('lessonMaterialFile').value='';renderAttachmentStatus();
  byId('lessonFormTitle').textContent='Editar aula';lessonForm.classList.remove('hidden');savedBaseline('lesson');chooseTab('lessons');byId('lessonName').focus();return true;
 };
 byId('cancelLessonEdit').onclick=()=>{if(!confirmDiscard(true))return;resetLessonForm();lessonForm.classList.add('hidden');updateEditStatus();};
 lessonForm.onsubmit=event=>{
  event.preventDefault();if(!isAdmin()||materialScope!=='lesson')return;
  if(uploading){notice('Aguarde os materiais terminarem de salvar antes de salvar a aula.',true);return;}
  const c=current();if(!c)return;
  const editId=byId('editLessonId').value,lesson=c.lessons.find(l=>l.id===editId),raw=byId('lessonUrl').value.trim(),mux=videoId(raw);
  if(editId&&!lesson){notice('A aula não existe mais. Abra o curso novamente.',true);return;}
  if(!lesson&&typeOf(c)==='single'&&c.lessons.length){notice('Este curso é de aula única. Para adicionar outras aulas, altere o formato nas informações.',true);return;}
  if(raw&&!mux){notice('Use um Playback ID ou endereço público válido do Mux.',true);return;}
  const name=byId('lessonName').value.trim(),materialUrl=byId('lessonMaterialUrl').value.trim();
  if(!name){notice('Informe o título da aula.',true);return;}
  if(materialUrl&&!safeHttps(materialUrl)){notice('Use um endereço HTTPS válido para o material.',true);return;}
  if(byId('lessonMaterialTitle').value.trim()||materialUrl){notice('Clique em Adicionar link para incluí-lo na lista, ou limpe os campos do link antes de salvar a aula.',true);byId('addSupportLink').focus();return;}
  const minutesText=byId('lessonMinutes').value,minutes=Number(minutesText);
  if(minutesText&&(!Number.isInteger(minutes)||minutes<1||minutes>10000)){notice('Informe uma duração de 1 a 10.000 minutos inteiros, ou deixe o campo vazio.',true);return;}
  const data={name,url:mux?'https://player.mux.com/'+mux:'',description:byId('lessonDescription').value.trim(),materialTitle:'',materialUrl:'',supportLinks:selectedLinks.map(link=>({...link})),previewMaterials:selectedMaterials.map(material=>({...material})),minutes:Number(byId('lessonMinutes').value)||null};
  if(lesson){Object.assign(lesson,data);delete lesson.previewMaterial;}else c.lessons.push({id:makeId('lesson'),...data});
  c.status='draft';save();resetLessonForm();byId('lessonMinutes').value='';lessonForm.classList.add('hidden');refresh();notice('Aula salva. Revise o curso para publicar na prévia.');
 };
 byId('adminCourses').addEventListener('click',event=>{
  if(!isAdmin())return;const b=event.target.closest('button');if(!b)return;
  if(b.dataset.courseEdit)openEditor(b.dataset.courseEdit);
  if(b.dataset.courseCopy){if(!confirmDiscard())return;const original=courses.find(c=>c.id===b.dataset.courseCopy);if(!original)return;const c=JSON.parse(JSON.stringify(original));c.id=makeId('course');c.name+=' (cópia)';c.status='draft';c.lessons.forEach(l=>{l.id=makeId('lesson');});courses.push(c);save();openEditor(c.id,'details',true);refresh();notice('Cópia criada como rascunho.');}
  if(b.dataset.courseDelete){if(!isMaster()){notice('Somente o ADM Master pode excluir cursos.',true);return;}const id=b.dataset.courseDelete,wasCurrent=current()?.id===id;if(wasCurrent&&!confirmDiscard())return;deleteCourse(id);if(wasCurrent&&!courses.some(c=>c.id===id))resetForm();refresh();}
 });
 byId('adminLessonOrder').addEventListener('click',event=>{
  if(!isAdmin())return;if(uploading){notice('Aguarde os materiais antes de alterar as aulas.',true);return;}const c=current(),b=event.target.closest('button');if(!c||!b)return;
  if(b.dataset.lessonMaterials!==undefined){if(editLesson(c.id,Number(b.dataset.lessonMaterials))){byId('lessonSupportSection').scrollIntoView({behavior:'smooth',block:'start'});byId('lessonSupportHeading').focus();}return;}
  if(b.dataset.lessonEdit!==undefined){editLesson(c.id,Number(b.dataset.lessonEdit));return;}
  if(b.dataset.lessonDelete!==undefined){if(!isMaster()){notice('O ADM de Conteúdo não pode excluir aulas.',true);return;}const n=c.lessons.length;deleteLesson(c.id,Number(b.dataset.lessonDelete));if(c.lessons.length!==n){c.status='draft';save();refresh();}return;}
  if(b.dataset.move){const [i,delta]=b.dataset.move.split(':').map(Number),to=i+delta;if(to<0||to>=c.lessons.length)return;[c.lessons[i],c.lessons[to]]=[c.lessons[to],c.lessons[i]];c.status='draft';save();refresh();notice('Ordem das aulas atualizada.');}
 });
 byId('adminPublish').onclick=async()=>{
   const c=current();if(!isMaster()||!c)return;
   if(hasPendingEdits()){notice('Salve as alterações do curso e da aula antes de publicar.',true);chooseTab(pendingEdits().course?'details':'lessons');return;}
   const error=readiness(c);if(error){notice(error,true);return;}
   const originalStatus=c.status,id=c.id;
   c.status='published';save();refresh();
   if(window.CONTREM_ACADEMY_CONFIG?.mode==='connected'&&window.AcademyCloudPublishing){
    try{await window.AcademyCloudPublishing.publish(id);notice('Curso publicado pelo ADM Master. Agora libere a matrícula em Alunos.');}
    catch(e){c.status=originalStatus;save();refresh();notice(e.message||'Não foi possível publicar o curso.',true);}
   }else notice('Curso publicado na prévia. Agora libere o acesso em Alunos.');
  };
 byId('adminUnpublish').onclick=async()=>{
   const c=current();if(!isMaster()||!c||hasPendingEdits())return;
   const id=c.id; c.status='draft';save();refresh();
   if(window.CONTREM_ACADEMY_CONFIG?.mode==='connected'&&window.AcademyCloudPublishing){
    try{await window.AcademyCloudPublishing.unpublish(id);notice('Curso retirado de publicação.');}
    catch(e){c.status='published';save();refresh();notice(e.message||'Não foi possível retirar a publicação.',true);}
   }else notice('Curso voltou a rascunho e não será listado na próxima entrada do aluno.');
  };
 byId('adminCourseSearch').oninput=e=>{filter=e.target.value.trim().toLocaleLowerCase('pt-BR');renderLibrary();};
 byId('adminStatusFilter').onchange=e=>{statusFilter=e.target.value;renderLibrary();};
 document.querySelectorAll('[data-admin-tab]').forEach(b=>b.onclick=()=>chooseTab(b.dataset.adminTab));
 const oldShow=show;show=function(id){oldShow(id);if(id==='adminView'&&isAdmin())renderLibrary();};
 [courseForm,lessonForm].forEach(form=>{form.addEventListener('input',updateEditStatus);form.addEventListener('change',updateEditStatus);});
 ['exit','reloadCloud'].forEach(id=>{const button=byId(id),previous=button.onclick;button.onclick=event=>{if(!confirmDiscard()){event?.preventDefault?.();return;}return previous?.call(button,event);};});
 window.addEventListener('beforeunload',event=>{if(hasPendingEdits()){event.preventDefault();event.returnValue='';}});
 savedBaseline();chooseTab('details');renderLibrary();
})();
