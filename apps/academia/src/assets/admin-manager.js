// Course authoring UI shared with the existing Academy shell.
(() => {
 'use strict';
 const byId=id=>document.getElementById(id);
 const isAdmin=()=>window.AcademySession?.role==='admin';
 const makeId=prefix=>prefix+'-'+crypto.randomUUID();
 let filter='',statusFilter='all',tab='details';
 const current=()=>courses.find(c=>c.id===byId('editId').value)||null;
 const typeOf=c=>c.format==='single'?'single':'series';
 const notice=(text,error=false)=>{byId('adminFeedback').textContent=text;byId('adminFeedback').classList.toggle('error',error);};
 function readiness(c){
  if(!c.name.trim()||!String(c.description||'').trim())return 'Preencha o nome e a descrição do curso.';
  if(!c.lessons.length)return 'Cadastre pelo menos uma aula antes de publicar.';
  if(typeOf(c)==='single'&&c.lessons.length!==1)return 'Um curso de aula única deve ter exatamente uma aula.';
  if(c.lessons.some(l=>!l.name.trim()||!videoId(l.url)))return 'Cadastre o título e o vídeo Mux de todas as aulas antes de publicar.';
  return '';
 }
 const grid=byId('adminView').querySelector(':scope > .admin');
 const oldPanel=grid.firstElementChild;
 const courseForm=byId('courseForm'),lessonForm=byId('lessonForm'),questionForm=byId('questionForm');
 const assessment=document.createElement('details');assessment.className='admin-assessment';
 assessment.innerHTML='<summary>Avaliação do curso <small>Opcional · demonstrativa</small></summary><p class="muted">Selecione um curso para organizar sua avaliação.</p>';
 ['passScore','questionForm','questionAdminList'].forEach(id=>{const el=byId(id);assessment.append(id==='passScore'?el.parentElement:el);});
 grid.className='admin adm-workspace';
 grid.innerHTML='<aside class="panel adm-library"><div class="row"><h2>Seus cursos</h2><button class="primary" id="newAdminCourse" type="button">+ Novo curso</button></div><label class="sr-only" for="adminCourseSearch">Buscar curso</label><input id="adminCourseSearch" type="search" placeholder="Buscar por curso ou categoria"><label class="sr-only" for="adminStatusFilter">Filtrar cursos</label><select id="adminStatusFilter"><option value="all">Todos os cursos</option><option value="draft">Rascunhos</option><option value="published">Publicados na prévia</option></select><div id="adminCourses"></div></aside><section class="panel adm-editor"><div class="adm-editor-head"><div><small class="tag">CONSTRUTOR DE CURSOS</small><h2 id="formTitle">Novo curso</h2></div><span id="editingStatus" class="adm-badge">Novo rascunho</span></div><div class="adm-steps" role="tablist" aria-label="Etapas do curso"><button type="button" data-admin-tab="details" role="tab">1. Informações</button><button type="button" data-admin-tab="lessons" role="tab">2. Aulas</button><button type="button" data-admin-tab="review" role="tab">3. Revisão</button></div><div id="admDetails" role="tabpanel"></div><div id="admLessons" role="tabpanel" hidden><div class="row"><div><h3>Conteúdo do curso</h3><p id="lessonHint" class="muted">Salve o curso para adicionar aulas.</p></div><button type="button" id="newAdminLesson" class="outline">+ Adicionar aula</button></div><ol id="adminLessonOrder" class="adm-lesson-order"></ol></div><div id="admReview" role="tabpanel" hidden><div id="adminReviewContent"></div><div class="adm-review-actions"><button type="button" id="adminPublish" class="primary">Publicar na prévia</button><button type="button" id="adminUnpublish" class="outline">Voltar a rascunho</button></div></div><p id="adminFeedback" role="status" aria-live="polite"></p></section>';
 byId('admDetails').append(courseForm);
 byId('admLessons').append(lessonForm,assessment);
 // Keep original IDs and handlers; arrange the existing forms around the authoring flow.
 byId('courseIcon').parentElement.hidden=true;
 byId('courseName').maxLength=150;byId('courseCategory').maxLength=100;byId('courseDescription').maxLength=4000;
 byId('courseHours').min='0.25';byId('courseHours').step='0.25';
 byId('courseHours').parentElement.insertAdjacentHTML('afterend','<div class="field"><label for="courseFormat">Formato do curso</label><select id="courseFormat"><option value="series">Série de aulas</option><option value="single">Aula única</option></select><small class="muted">Aula única para um conteúdo direto; série para uma sequência de aulas.</small></div>');
 courseForm.querySelector('button.primary').textContent='Salvar informações';
 byId('resetForm').textContent='Novo curso';
 byId('lessonUrl').required=false;
 byId('lessonUrl').insertAdjacentHTML('afterend','<small class="muted">Pode ficar vazio no rascunho. Para publicar, use um vídeo público do Mux nesta etapa.</small>');
 byId('lessonName').maxLength=180;
 byId('lessonDescription').maxLength=4000;
 byId('lessonName').parentElement.insertAdjacentHTML('afterend','<div class="field"><label for="lessonMinutes">Duração estimada (minutos, opcional)</label><input id="lessonMinutes" type="number" min="1" max="10000" step="1"></div>');
 const stats=document.createElement('div');stats.id='admStats';stats.className='adm-stats';
 grid.before(stats);
 byId('adminView').querySelector(':scope > .notice').textContent='Ambiente de teste: cursos, logins e liberações ficam somente neste navegador. A publicação aqui libera o curso apenas aos alunos de teste.';
 byId('adminStudents').querySelector(':scope > .muted').textContent='Crie um login de teste com dados fictícios e uma senha de pelo menos 8 caracteres. Depois libere os cursos desejados. O aluno entra por esta mesma prévia e neste navegador.';
 byId('demoAccess').hidden=true;
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
  byId('newAdminLesson').disabled=!c||(typeOf(c)==='single'&&c.lessons.length>=1);
  byId('lessonHint').textContent=c?c.name+' · '+(typeOf(c)==='single'?'Aula única':'Série de aulas'):'Salve as informações para começar a adicionar aulas.';
  byId('adminLessonOrder').innerHTML=c?.lessons.length?c.lessons.map((l,i)=>'<li><span class="adm-order">'+(i+1)+'</span><div class="adm-lesson-info"><b>'+esc(l.name)+'</b><small>'+ (videoId(l.url)?'Vídeo cadastrado':'Vídeo pendente')+(l.minutes?' · '+Number(l.minutes)+' min':'')+'</small></div><div class="adm-lesson-actions"><button type="button" class="outline" data-lesson-edit="'+i+'">Editar</button><button type="button" class="outline" data-move="'+i+':-1" aria-label="Subir aula '+(i+1)+'" '+(i===0?'disabled':'')+'>↑</button><button type="button" class="outline" data-move="'+i+':1" aria-label="Descer aula '+(i+1)+'" '+(i===c.lessons.length-1?'disabled':'')+'>↓</button><button type="button" class="danger" data-lesson-delete="'+i+'" aria-label="Remover aula '+(i+1)+'">Remover</button></div></li>').join(''):'<li class="adm-empty"><b>A sequência começa aqui.</b><span>Adicione a primeira aula e organize o conteúdo do curso.</span></li>';
  byId('adminReviewContent').innerHTML=c?'<div class="adm-review-title"><span class="adm-badge">'+(typeOf(c)==='single'?'Aula única':'Série de aulas')+'</span><h3>'+esc(c.name)+'</h3><p>'+esc(c.description)+'</p></div><dl class="adm-review-meta"><div><dt>Categoria</dt><dd>'+esc(c.category||'Sem categoria')+'</dd></div><div><dt>Carga horária</dt><dd>'+Number(c.hours||8)+' horas</dd></div><div><dt>Conteúdo</dt><dd>'+c.lessons.length+' aula(s)</dd></div></dl><p class="'+(readiness(c)?'notice':'adm-ready')+'">'+esc(readiness(c)||'Tudo pronto. Publique e libere o acesso no módulo Alunos.')+'</p><button type="button" id="adminStudentPreview" class="outline">Visualizar sala do aluno →</button>':'<div class="adm-empty">Salve um curso para revisar e publicar.</div>';
  byId('adminPublish').disabled=!c||!!readiness(c)||c.status==='published';
  byId('adminUnpublish').hidden=c?.status!=='published';
  byId('adminStudentPreview')?.addEventListener('click',()=>openCourse(c.id));
 }
 function renderLibrary(){
  byId('admStats').innerHTML=[['Cursos',courses.length],['Rascunhos',courses.filter(c=>c.status!=='published').length],['Publicados na prévia',courses.filter(c=>c.status==='published').length],['Aulas',courses.reduce((n,c)=>n+c.lessons.length,0)]].map(([label,n])=>'<div><small>'+label+'</small><strong>'+n+'</strong></div>').join('');
  const list=courses.filter(c=>(statusFilter==='all'||(c.status||'draft')===statusFilter)&&(c.name+' '+(c.category||'')).toLocaleLowerCase('pt-BR').includes(filter));
  byId('adminCourses').innerHTML=list.length?list.map(c=>'<article class="adm-course-card '+(current()?.id===c.id?'editing':'')+'"><div class="row"><span class="adm-badge '+(c.status==='published'?'published':'')+'">'+(c.status==='published'?'Publicado':'Rascunho')+'</span><small>'+ (typeOf(c)==='single'?'Aula única':'Série de aulas')+'</small></div><h3>'+esc(c.name)+'</h3><p>'+esc(c.category||'Sem categoria')+' · '+c.lessons.length+' aula(s) · '+Number(c.hours||8)+'h</p><div class="adm-card-actions"><button type="button" class="outline" data-course-edit="'+esc(c.id)+'">Gerenciar curso →</button><button type="button" class="outline" data-course-copy="'+esc(c.id)+'" aria-label="Duplicar '+esc(c.name)+'">Duplicar</button><button type="button" class="danger" data-course-delete="'+esc(c.id)+'">Excluir</button></div></article>').join(''):'<div class="adm-empty"><b>'+ (courses.length?'Nenhum resultado.':'Seu primeiro curso começa aqui.')+'</b><span>'+ (courses.length?'Ajuste a busca ou o filtro.':'Clique em Novo curso e organize seu treinamento.')+'</span></div>';
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
 function openEditor(id,section='details'){
  if(!isAdmin())return;
  const c=courses.find(c=>c.id===id);if(!c)return;
  selectedCourse=c;byId('editId').value=c.id;byId('courseName').value=c.name;byId('courseCategory').value=c.category||'';
  byId('courseDescription').value=c.description||'';byId('courseHours').value=c.hours||8;
  byId('coursePhoto').value=c.photo||'';byId('courseIcon').value=c.icon||'⚙️';byId('courseFormat').value=typeOf(c);
  byId('formTitle').textContent='Editar curso';lessonForm.classList.add('hidden');resetLessonForm();renderQuestionAdmin();notice('');chooseTab(section);renderLibrary();
 }
 editCourse=id=>openEditor(id);
 selectLessons=id=>openEditor(id,'lessons');
 const oldReset=resetForm;resetForm=function(){
  oldReset();byId('courseFormat').value='series';selectedCourse=null;lessonForm.classList.add('hidden');byId('lessonMinutes').value='';notice('');chooseTab('details');renderLibrary();
 };
 byId('resetForm').onclick=resetForm;byId('newAdminCourse').onclick=()=>{if(isAdmin()){resetForm();byId('courseName').focus();}};
 courseForm.onsubmit=event=>{
  event.preventDefault();if(!isAdmin())return;
  const c=current(),format=byId('courseFormat').value;
  if(format==='single'&&c?.lessons.length>1){notice('Este curso já tem várias aulas. Mantenha série de aulas ou remova as aulas extras antes de mudar o formato.',true);return;}
  const photo=byId('coursePhoto').value.trim(),name=byId('courseName').value.trim();
  if(!name){notice('Informe o nome do curso.',true);return;}
  if(photo&&!safeHttps(photo)){notice('Informe um link HTTPS válido para a capa.',true);return;}
  const data={name,category:byId('courseCategory').value.trim(),description:byId('courseDescription').value.trim(),hours:Number(byId('courseHours').value),photo,icon:'⚙️',format,status:'draft'};
  const id=c?.id||makeId('course');
  if(c)Object.assign(c,data);else courses.push({id,...data,lessons:[]});
  save();openEditor(id,'lessons');refresh();notice('Informações salvas como rascunho. Adicione as aulas e revise antes de publicar.');
 };
 byId('newAdminLesson').onclick=()=>{
  const c=current();if(!isAdmin()||!c||typeOf(c)==='single'&&c.lessons.length)return;
  selectedCourse=c;resetLessonForm();byId('lessonMinutes').value='';lessonForm.classList.remove('hidden');byId('lessonName').focus();
 };
 const oldEditLesson=editLesson;editLesson=function(id,i){
  if(!isAdmin())return;openEditor(id,'lessons');oldEditLesson(id,i);chooseTab('lessons');byId('lessonMinutes').value=current().lessons[i]?.minutes||'';
 };
 byId('cancelLessonEdit').onclick=()=>{resetLessonForm();byId('lessonMinutes').value='';lessonForm.classList.add('hidden');};
 lessonForm.onsubmit=event=>{
  event.preventDefault();if(!isAdmin())return;
  const c=current();if(!c)return;
  const editId=byId('editLessonId').value,lesson=c.lessons.find(l=>l.id===editId),raw=byId('lessonUrl').value.trim(),mux=videoId(raw);
  if(editId&&!lesson){notice('A aula não existe mais. Abra o curso novamente.',true);return;}
  if(!lesson&&typeOf(c)==='single'&&c.lessons.length){notice('Este curso é de aula única. Para adicionar outras aulas, altere o formato nas informações.',true);return;}
  if(raw&&!mux){notice('Use um Playback ID ou endereço público válido do Mux.',true);return;}
  const name=byId('lessonName').value.trim(),materialUrl=byId('lessonMaterialUrl').value.trim();
  if(!name){notice('Informe o título da aula.',true);return;}
  if(materialUrl&&!safeHttps(materialUrl)){notice('Use um endereço HTTPS válido para o material.',true);return;}
  const data={name,url:mux?'https://player.mux.com/'+mux:'',description:byId('lessonDescription').value.trim(),materialTitle:byId('lessonMaterialTitle').value.trim(),materialUrl,minutes:Number(byId('lessonMinutes').value)||null};
  if(lesson)Object.assign(lesson,data);else c.lessons.push({id:makeId('lesson'),...data});
  c.status='draft';save();resetLessonForm();byId('lessonMinutes').value='';lessonForm.classList.add('hidden');refresh();notice('Aula salva. Revise o curso para publicar na prévia.');
 };
 byId('adminCourses').addEventListener('click',event=>{
  if(!isAdmin())return;const b=event.target.closest('button');if(!b)return;
  if(b.dataset.courseEdit)openEditor(b.dataset.courseEdit);
  if(b.dataset.courseCopy){const original=courses.find(c=>c.id===b.dataset.courseCopy);if(!original)return;const c=JSON.parse(JSON.stringify(original));c.id=makeId('course');c.name+=' (cópia)';c.status='draft';c.lessons.forEach(l=>{l.id=makeId('lesson');});courses.push(c);save();openEditor(c.id);refresh();notice('Cópia criada como rascunho.');}
  if(b.dataset.courseDelete){const id=b.dataset.courseDelete;deleteCourse(id);if(!courses.some(c=>c.id===id))resetForm();refresh();}
 });
 byId('adminLessonOrder').addEventListener('click',event=>{
  if(!isAdmin())return;const c=current(),b=event.target.closest('button');if(!c||!b)return;
  if(b.dataset.lessonEdit!==undefined){editLesson(c.id,Number(b.dataset.lessonEdit));return;}
  if(b.dataset.lessonDelete!==undefined){const n=c.lessons.length;deleteLesson(c.id,Number(b.dataset.lessonDelete));if(c.lessons.length!==n){c.status='draft';save();refresh();}return;}
  if(b.dataset.move){const [i,delta]=b.dataset.move.split(':').map(Number),to=i+delta;if(to<0||to>=c.lessons.length)return;[c.lessons[i],c.lessons[to]]=[c.lessons[to],c.lessons[i]];c.status='draft';save();refresh();notice('Ordem das aulas atualizada.');}
 });
 byId('adminPublish').onclick=()=>{const c=current();if(!isAdmin()||!c)return;const error=readiness(c);if(error){notice(error,true);return;}c.status='published';save();refresh();notice('Curso publicado na prévia. Agora libere o acesso em Alunos.');};
 byId('adminUnpublish').onclick=()=>{const c=current();if(!isAdmin()||!c)return;c.status='draft';save();refresh();notice('Curso voltou a rascunho e não será listado na próxima entrada do aluno.');};
 byId('adminCourseSearch').oninput=e=>{filter=e.target.value.trim().toLocaleLowerCase('pt-BR');renderLibrary();};
 byId('adminStatusFilter').onchange=e=>{statusFilter=e.target.value;renderLibrary();};
 document.querySelectorAll('[data-admin-tab]').forEach(b=>b.onclick=()=>chooseTab(b.dataset.adminTab));
 const oldShow=show;show=function(id){oldShow(id);if(id==='adminView'&&isAdmin())renderLibrary();};
 chooseTab('details');renderLibrary();
})();
