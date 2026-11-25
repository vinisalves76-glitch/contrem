(() => {
 'use strict';
 const config=window.CONTREM_ACADEMY_CONFIG;
 window.AcademySession=null;
 const status=document.getElementById('cloudStatus'),bar=document.getElementById('cloudBar'),syncAlert=document.getElementById('cloudSyncAlert');
 const form=document.getElementById('cloudLoginForm'),loginStatus=document.getElementById('cloudLoginStatus');
 const keys=['va-academia-catalog-v1','va-academia-progress-v1','va-academia-certificates-v1','va-academia-profile-v1','va-academia-activity-v1'];
 let mode=config?.preview?'demo':'guest',identity=null,service=null,client=null,catalogRevision=0,stateRevision=0;
 let catalogSaved='',stateSaved='',dirtyCatalog=false,dirtyState=false,conflicted=false,timer=null,saving=null,epoch=0;
 const demoAdminNotice=document.querySelector('#adminView > .notice').textContent;
 const isMaster=()=>mode==='cloud'&&identity?.member.role==='admin'&&identity.user.email?.toLowerCase()==='vinicius.alves@irmen.com.br';
 const isEditor=()=>isMaster()||(mode==='cloud'&&identity?.member.role==='content_admin');
 const pendingKey=id=>(config?.preview?'contrem-adm-preview-pending:':'contrem-academia:')+id+':pending';
 const copy=value=>JSON.parse(JSON.stringify(value));
 const stateJSON=value=>JSON.stringify({profile:value.profile,progress:value.progress,certificates:value.certificates,activity:value.activity});
 function readPending(){try{return JSON.parse(localStorage.getItem(pendingKey(identity.user.id)))||null;}catch{return null;}}
 function snapshot(){return {courses:copy(courses),progress:copy(progress),certificates:copy(certificates),profile:copy(profile),activity:copy(activity)};}
 function savePending(){if(!identity||conflicted)return;localStorage.setItem(pendingKey(identity.user.id),JSON.stringify({...snapshot(),catalogRevision,stateRevision,dirtyCatalog,dirtyState}));}
 function clearPending(){if(identity)localStorage.removeItem(pendingKey(identity.user.id));}
 function message(text,error=false){
  status.textContent=config?.preview?text.replaceAll('na sua conta','neste navegador de teste').replace('Conta conectada. Dados carregados.','Prévia isolada. Dados de teste carregados.'):text;
  bar.classList.toggle('sync-error',error);
  // Não exibir a faixa permanente de status. Avisar somente em caso de falha, conflito ou modo offline.
  syncAlert.textContent=error?status.textContent:'';
  syncAlert.hidden=!error;
 }
 function validateCourses(value){validateBackup({app:'VA Academia',schemaVersion:4,courses:value,progress:{}});}
 function permissions(){
  const demoNote=document.querySelector('.demo-course-note');if(demoNote)demoNote.hidden=!courses.some(c=>c.id==='demo-mecanica');
  if(mode!=='cloud')return;
  const editor=isEditor(),master=isMaster();
  document.getElementById('studentNav').hidden=editor;document.getElementById('adminNav').hidden=!editor;
  document.getElementById('sidebarContext').textContent=editor?'GESTÃO DA ACADEMIA':'AMBIENTE DE APRENDIZAGEM';
  document.getElementById('adminTab').hidden=!editor;
  document.getElementById('studentsTab').hidden=!editor;
  document.getElementById('staffTab').hidden=!master;document.getElementById('studioTab').hidden=!editor;
  document.getElementById('adminStudents').hidden=!editor;
  document.getElementById('studentForm').hidden=!master;
  document.getElementById('adminStaff').hidden=!master;
  document.getElementById('adminView').classList.toggle('content-admin',identity?.member.role==='content_admin');
  document.getElementById('migrateLocalCatalog').hidden=true;
  document.getElementById('downloadPending').hidden=!readPending();
  for(const selector of ['#adminView input','#adminView textarea','#adminView select','#adminView form button','#adminCourses button','#markDone','#assessmentContent input','#assessmentContent button','#certificateActions button','#my-profile input','#saveProfile']){
   document.querySelectorAll(selector).forEach(el=>{
    if(conflicted){if(!el.disabled){el.dataset.cloudDisabled='true';el.disabled=true;}}
    else if(el.dataset.cloudDisabled){el.disabled=false;delete el.dataset.cloudDisabled;}
   });
  }
  // Full backup imports replace a catalog: keep them in the local demonstration flow.
  ['importBackupBtn','importBackupText'].forEach(id=>{document.getElementById(id).disabled=true;});
 }
 function putMemory(data){
  validateCourses(data.courses);
  if(!Object.values(data.progress||{}).every(Array.isArray))throw Error('O progresso da conta está em formato inválido.');
  courses=copy(data.courses);progress=copy(data.progress||{});certificates=copy(data.certificates||[]);profile=copy(data.profile||{});activity=copy(data.activity||{});
  selectedCourse=null;studentName=profile.fullName||identity?.member.display_name||'Aluno';
  academyStorage.quiet(()=>{
   [courses,progress,certificates,profile,activity].forEach((value,i)=>academyStorage.setItem(keys[i],JSON.stringify(value)));
  });
  document.getElementById('hello').textContent=studentName;document.getElementById('lessonForm').classList.add('hidden');
  loadProfile();resetForm();refresh();
 }
 async function enterCloud(data){
  validateCourses(data.catalog.courses);
  epoch++;identity=data;mode='cloud';window.AcademySession={role:data.member.role,preview:!!config?.preview,userId:data.user.id};conflicted=false;dirtyCatalog=false;dirtyState=false;
  catalogRevision=data.catalog.revision;stateRevision=data.state.revision;
  catalogSaved=JSON.stringify(data.catalog.courses);stateSaved=stateJSON(data.state);
  academyStorage.setScope(data.user.id);
  const remote={courses:data.catalog.courses,...data.state};
  const pending=readPending();
  if(pending && ((!pending.dirtyCatalog||pending.catalogRevision===catalogRevision)&&(!pending.dirtyState||pending.stateRevision===stateRevision))){
   putMemory(pending);dirtyCatalog=!!pending.dirtyCatalog&&isEditor();dirtyState=!!pending.dirtyState;
  }else{putMemory(remote);if(pending)conflicted=true;}
  document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');bar.hidden=false;
  document.getElementById('accountName').textContent=identity.member.display_name||'Conta conectada';
  document.querySelector('.demo-chip').textContent=isMaster()?'ADM MASTER':isEditor()?'ADM DE CONTEÚDO':'ALUNO';
  document.querySelector('#my-profile .row p').textContent='Sua identificação é salva na sua conta.';
  document.querySelector('#adminView > .muted').textContent='Organize seus treinamentos. As alterações são compartilhadas com os alunos da Academia.';
  document.querySelector('#adminView > .notice').textContent='Os cursos editados ficam em revisão até que o ADM Master publique. Avaliações e certificados ainda não têm validação oficial.';
  document.querySelector('#assessmentPanel .row p').textContent='Responda às questões para registrar o resultado na sua conta. A avaliação continua demonstrativa.';
  const importHint=document.getElementById('cloudImportHint');
  importHint.hidden=true;
  importHint.textContent='Cursos criados na prévia Developer ficam naquele navegador. Exporte o backup JSON na origem onde os cursos foram criados; depois use "Importar cursos do Developer" acima. Os cursos serão importados como rascunhos, sem apagar os existentes.';
  document.getElementById('cloudBackup').hidden=identity.member.role!=='admin';
  show(isEditor()?'adminView':'studentView');setAdminSection('courses');permissions();
  if(isEditor())loadStudentRoster();
  if(isMaster())loadStaffRoster();
  message(conflicted?'Há alterações locais e alterações em outro acesso. Baixe a cópia pendente e recarregue os dados.':dirtyCatalog||dirtyState?'Enviando alterações pendentes deste aparelho…':'Conta conectada. Dados carregados.',conflicted);
  if(!conflicted&&(dirtyCatalog||dirtyState))scheduleSync();
  window.dispatchEvent(new CustomEvent('contrem:academy-session-ready',{detail:{
   role:data.member.role,memberId:data.member.id,name:data.member.display_name||'Aluno',
   email:data.user.email||'',company:profile.company||'',jobTitle:profile.role||''
  }}));
 }
 async function flush(){
  if(saving)return saving;
  if(mode!=='cloud'||conflicted||(!dirtyCatalog&&!dirtyState))return;
  if(!navigator.onLine){message('Sem conexão. Alterações guardadas neste aparelho para enviar quando a conexão voltar.',true);savePending();return;}
  const runEpoch=epoch;
  saving=(async()=>{
   try{
    while(mode==='cloud'&&!conflicted&&(dirtyCatalog||dirtyState)){
     const data=snapshot(),catalogWrite=dirtyCatalog&&isEditor(),stateWrite=dirtyState;
     dirtyCatalog=false;dirtyState=false;message('Salvando na sua conta…');
     if(catalogWrite&&JSON.stringify(data.courses)!==catalogSaved){
      validateCourses(data.courses);const row=await service.writeCatalog(data.courses,catalogRevision);
      if(epoch!==runEpoch)return;catalogRevision=row.revision;catalogSaved=JSON.stringify(data.courses);
     }
     if(stateWrite&&stateJSON(data)!==stateSaved){
      const row=await service.writeState(data,stateRevision);
      if(epoch!==runEpoch)return;stateRevision=row.revision;stateSaved=stateJSON(data);
     }
     if(dirtyCatalog||dirtyState)savePending();else clearPending();
    }
    if(epoch===runEpoch){message('Salvo na sua conta.');permissions();}
   }catch(error){
    if(epoch!==runEpoch)return;
    dirtyCatalog=isEditor()&&JSON.stringify(courses)!==catalogSaved;
    dirtyState=stateJSON(snapshot())!==stateSaved;
    savePending();conflicted=error.name==='AcademyConflict';message(errorText(error),true);permissions();
   }
  })().finally(()=>{saving=null;});
  return saving;
 }
 function scheduleSync(){clearTimeout(timer);timer=setTimeout(flush,250);}
 academyStorage.subscribe(key=>{
  if(mode!=='cloud'||conflicted)return;
  if(key===keys[0])dirtyCatalog=isEditor()&&JSON.stringify(courses)!==catalogSaved;
  else if(keys.includes(key))dirtyState=true;
  savePending();scheduleSync();
 });
 function resetToDemo(){
  window.dispatchEvent(new Event('contrem:academy-session-ended'));
  epoch++;clearTimeout(timer);mode=config?.preview?'demo':'guest';window.AcademySession=null;identity=null;conflicted=false;dirtyState=false;dirtyCatalog=false;
  academyStorage.setScope(null);bar.hidden=true;syncAlert.hidden=true;syncAlert.textContent='';
  courses=config?.preview?read(KEY,demo):[];progress=config?.preview?read(PK,{}):{};certificates=config?.preview?read(CK,[]):[];profile=config?.preview?read(PROFILE_KEY,{fullName:'',email:'',company:'',role:''}):{fullName:'',email:'',company:'',role:''};activity=config?.preview?read(ACTIVITY_KEY,{}):{};
  selectedCourse=null;studentName=profile.fullName||(config?.preview?'Aluno demonstração':'Aluno');document.getElementById('hello').textContent=studentName;
  document.getElementById('studentNav').hidden=false;document.getElementById('adminNav').hidden=!config?.preview;document.getElementById('sidebarContext').textContent='AMBIENTE DE APRENDIZAGEM';document.getElementById('adminTab').hidden=!config?.preview;document.getElementById('adminStudents').hidden=true;document.getElementById('adminStaff').hidden=true;document.getElementById('staffTab').hidden=true;document.getElementById('studioTab').hidden=true;document.getElementById('studentForm').hidden=false;document.getElementById('adminView').classList.remove('content-admin');setAdminSection('courses');document.querySelector('.demo-chip').textContent=config?.preview?'DEMONSTRAÇÃO · DADOS LOCAIS':'CONTREM ACADEMIA · CONECTADA';
  document.getElementById('player').src='about:blank';
  document.querySelector('#my-profile .row p').textContent='Nome e dados de exibição ficam salvos somente neste navegador.';
  document.querySelector('#adminView > .muted').textContent='Demonstração: as alterações são salvas somente neste navegador.';
  document.querySelector('#adminView > .notice').textContent=demoAdminNotice;
  document.querySelector('#assessmentPanel .row p').textContent='Responda às questões para registrar seu resultado neste navegador.';
  document.getElementById('cloudImportHint').hidden=true;
  document.getElementById('cloudBackup').hidden=true;
  document.querySelectorAll('[data-cloud-disabled]').forEach(el=>{el.disabled=false;delete el.dataset.cloudDisabled;});
  ['importBackupBtn','importBackupText'].forEach(id=>{document.getElementById(id).disabled=!config?.preview;});
  loadProfile();refresh();show('studentView');document.getElementById('app').classList.add('hidden');document.getElementById('login').classList.remove('hidden');
 }
 function errorText(error){
  if(error.name==='AcademyConflict')return error.message;
  if(!navigator.onLine)return 'Sem conexão. As alterações estão guardadas neste aparelho; conecte-se e tente novamente.';
  if(error.code==='invalid_credentials')return 'Não foi possível entrar. Confira seu e-mail e sua senha.';
  if(error.message?.includes('desativado')||error.message?.includes('ainda não foi liberado'))return error.message;
  if(config?.preview)return error.message||'Não foi possível concluir a operação na prévia.';
  return 'Não foi possível concluir a operação. Seus dados locais foram preservados. Verifique a conexão e tente novamente.';
 }
 async function loadStudentRoster(){
  const roster=document.getElementById('studentRoster');if(mode!=='cloud'||!isEditor())return;
  roster.textContent='Carregando alunos e permissões…';
  try{
   const data=await service.listStudents(),rows=data.members||[],grants=data.grants||[];
   let academyPrograms=[],academyEnrollments=[],academyError='';
   if(isMaster()){
    try{
     const academyData=await service.listAcademyAccess();
     academyPrograms=Array.isArray(academyData.programs)?academyData.programs:[];
     academyEnrollments=Array.isArray(academyData.enrollments)?academyData.enrollments:[];
    }catch(error){academyError=error.message||'Falha na consulta às Academias.';}
   }
   const enrolled=(memberId,programId)=>academyEnrollments.find(entry=>entry.member_id===memberId&&entry.program_id===programId);
   const today=new Date().toISOString().slice(0,10);
   const courseList=member=>'<section class="access-roster-group" aria-label="Cursos Avulsos do aluno">'+
    '<div class="access-roster-group-title"><strong>Cursos Avulsos</strong><small>'+courses.length+' cadastrados</small></div>'+
    '<div class="access-roster-options">'+(courses.length?courses.map(course=>{
     const granted=grants.some(g=>g.member_id===member.id&&g.course_id===course.id);
     const isDraft=course.status!=='published';
     return '<label class="access-roster-option"><input type="checkbox" data-member="'+esc(member.id)+'" data-course="'+esc(course.id)+'" '+
      (granted?'checked ':'')+(!member.active||(!isMaster()&&isDraft)?'disabled ':'')+
      '><span>'+esc(course.name)+'<small class="'+(isDraft?'roster-draft':'roster-published')+'">'+
      (isDraft?'Rascunho · ainda não disponível para assistir':'Publicado')+'</small></span></label>';
    }).join(''):'<p class="access-roster-empty">Nenhum Curso Avulso cadastrado.</p>')+'</div></section>';
   const academyList=member=>{
    if(!isMaster())return '<section class="access-roster-group" aria-label="Academias"><div class="access-roster-group-title"><strong>Academias</strong></div><p class="access-roster-empty">A matrícula em Academias é gerenciada somente pelo ADM Master.</p></section>';
    if(academyError)return '<section class="access-roster-group"><div class="access-roster-group-title"><strong>Academias</strong></div><p class="access-roster-error">Não foi possível consultar as Academias: '+esc(academyError)+
      '</p><button type="button" class="outline" data-retry-academy>Recarregar Academias</button></section>';
    return '<section class="access-roster-group" aria-label="Academias do aluno">'+
      '<div class="access-roster-group-title"><strong>Academias</strong><small>'+academyPrograms.length+' cadastradas</small></div>'+
      '<div class="access-roster-options">'+(academyPrograms.length?academyPrograms.map(program=>{
       const enrollment=enrolled(member.id,program.id);
       const published=program.status==='published';
       const granted=enrollment?.active===true;
       const expired=granted&&enrollment.expires_on&&enrollment.expires_on<today;
       const status=program.status==='published'?'Publicada':program.status==='archived'?'Arquivada':'Rascunho';
       return '<label class="access-roster-option"><input type="checkbox" data-member="'+esc(member.id)+
        '" data-academy="'+esc(program.id)+'" data-expires="'+esc(enrollment?.expires_on||'')+'" '+
        (granted?'checked ':'')+(!member.active||program.status==='archived'?'disabled ':'')+
        '><span>'+esc(program.title)+'<small class="'+(published?'roster-published':'roster-draft')+'">'+
        esc(status)+(expired?' · matrícula vencida; revise a validade em Academias':'')+
        (program.status==='draft'?' · pré-matrícula; acesso somente após publicar':'')+
        (program.status==='archived'?' · sem novas matrículas':'')+'</small></span></label>';
      }).join(''):'<p class="access-roster-empty">Nenhuma Academia cadastrada.</p>')+'</div></section>';
   };
   roster.innerHTML=rows.length?rows.map(member=>
     '<article class="student-roster-row"><div class="student-roster-heading"><div><b>'+esc(member.display_name)+'</b>'+
     '<small class="roster-email">'+(member.email?esc(member.email):'E-mail indisponível')+'</small>'+
     '<span class="student-roster-status">'+(member.active?'Ativo':'Inativo')+'</span></div>'+
     '<div class="student-roster-actions"><button type="button" class="outline" '+(!isMaster()?'hidden ':'')+'data-member="'+esc(member.id)+
     '" data-active="'+(!member.active)+'">'+(member.active?'Desativar aluno':'Reativar aluno')+'</button>'+
     (isMaster()?'<button type="button" class="outline" data-password-member="'+esc(member.id)+'">Redefinir senha</button>':'')+
     '</div></div>'+
     (isMaster()?'<div class="student-password-panel" data-password-panel="'+esc(member.id)+'" hidden>'+
       '<p>A senha atual não pode ser consultada. Defina uma nova senha para o aluno.</p>'+
       '<div class="student-password-fields"><label>Nova senha<input type="password" data-new-password autocomplete="new-password" minlength="8" maxlength="128" placeholder="Mínimo de 8 caracteres"></label>'+
       '<label>Confirmar nova senha<input type="password" data-confirm-password autocomplete="new-password" minlength="8" maxlength="128"></label></div>'+
       '<div class="student-password-actions"><button type="button" class="outline" data-show-password="'+esc(member.id)+'">Mostrar/Ocultar</button>'+
       '<button type="button" class="primary" data-submit-password="'+esc(member.id)+'">Salvar nova senha</button></div>'+
       '<p class="student-password-result" role="status" data-password-status="'+esc(member.id)+'"></p>'+
      '</div>':'')+
     '<div class="access-roster-groups">'+courseList(member)+academyList(member)+'</div></article>'
    ).join(''):'Nenhum aluno cadastrado.';
  }catch(error){
   roster.textContent='Não foi possível carregar os alunos: '+(error.message||'verifique sua conexão.');
  }
 }
 document.getElementById('studentRoster').addEventListener('change',async event=>{
  const el=event.target;if(mode!=='cloud'||!el.matches('[data-course],[data-academy]'))return;
  const enabled=el.checked,memberId=el.dataset.member,status=document.getElementById('studentFormStatus');
  el.disabled=true;status.textContent='Atualizando acesso…';
  try{
   if(el.dataset.course)await service.setCourseAccess(memberId,el.dataset.course,enabled);
   else{
    if(!isMaster())throw Error('Somente o ADM Master libera matrículas das Academias.');
    await service.setAcademyAccess(memberId,el.dataset.academy,enabled,el.dataset.expires||'');
   }
   status.textContent=el.dataset.course?'Acesso ao Curso Avulso atualizado.':
     enabled?'Matrícula da Academia liberada.':'Acesso à Academia suspenso.';
  }catch(error){el.checked=!enabled;status.textContent=error.message||'Não foi possível alterar o acesso.';}
  finally{el.disabled=false;}
 });
 document.getElementById('studentRoster').addEventListener('click',async event=>{
  if(event.target.closest('[data-retry-academy]')){await loadStudentRoster();return;}
  const resetButton=event.target.closest('[data-password-member]');
  const revealButton=event.target.closest('[data-show-password]');
  const submitButton=event.target.closest('[data-submit-password]');
  const memberId=resetButton?.dataset.passwordMember||revealButton?.dataset.showPassword||submitButton?.dataset.submitPassword;
  if(memberId){
   if(!isMaster()||mode!=='cloud')return;
   const panel=document.querySelector('#studentRoster [data-password-panel="'+memberId+'"]');
   if(!panel)return;
   if(resetButton){panel.hidden=!panel.hidden;return;}
   const password=panel.querySelector('[data-new-password]');
   const confirmPassword=panel.querySelector('[data-confirm-password]');
   const status=panel.querySelector('[data-password-status]');
   if(revealButton){
    const nextType=password.type==='password'?'text':'password';
    password.type=nextType;confirmPassword.type=nextType;
    return;
   }
   if(submitButton){
    if(password.readOnly)return;
    const value=password.value;
    if(value.length<8||value.length>128){status.textContent='A nova senha deve ter entre 8 e 128 caracteres.';return;}
    if(value!==confirmPassword.value){status.textContent='As senhas informadas não coincidem.';return;}
    submitButton.disabled=true;status.textContent='Atualizando senha…';
    try{
     await service.resetStudentPassword(memberId,value);
     password.readOnly=true;confirmPassword.value='';confirmPassword.disabled=true;
     status.textContent='Senha redefinida. Ela ficará disponível neste campo apenas até atualizar ou sair desta página. Entregue-a diretamente ao aluno.';
     submitButton.textContent='Senha atualizada';
    }catch(error){status.textContent=error.message||'Não foi possível redefinir a senha.';submitButton.disabled=false;}
    return;
   }
  }
  const el=event.target.closest('[data-active]');if(!el||mode!=='cloud'||!isMaster())return;
  el.disabled=true;try{await service.setStudentActive(el.dataset.member,el.dataset.active==='true');await loadStudentRoster();document.getElementById('studentFormStatus').textContent='Status do aluno atualizado.';}catch(error){document.getElementById('studentFormStatus').textContent=error.message;el.disabled=false;}
 });
 document.getElementById('studentForm').onsubmit=async event=>{
  event.preventDefault();if(mode!=='cloud'||!isMaster())return;
  const form=event.currentTarget,status=document.getElementById('studentFormStatus'),button=form.querySelector('button');button.disabled=true;status.textContent='Criando acesso…';
  try{const result=await service.createStudent(document.getElementById('studentFullName').value.trim(),
   document.getElementById('studentEmail').value.trim(),document.getElementById('studentPassword').value,
   document.getElementById('studentCompany').value.trim(),document.getElementById('studentJobTitle').value.trim());form.reset();status.textContent='Aluno '+result.name+' cadastrado. Entregue o e-mail e a senha inicial a ele.';await loadStudentRoster();}catch(error){status.textContent=error.message||'Não foi possível cadastrar o aluno.';}finally{button.disabled=false;}
 };
 async function loadStaffRoster(){
  if(!isMaster())return;
  const roster=document.getElementById('staffRoster');
  try{
   const staff=await service.listStaff();
   roster.innerHTML=staff.length?staff.map(m=>'<div class="student-roster-row"><b>'+esc(m.name)+'</b> <small class="roster-email">'+esc(m.email)+'</small> · '+(m.active?'Ativo':'Inativo')+' <button type="button" class="outline" data-staff-id="'+esc(m.id)+'" data-staff-active="'+(!m.active)+'">'+(m.active?'Desativar':'Reativar')+'</button></div>').join(''):'Nenhum funcionário cadastrado.';
  }catch(error){roster.textContent=error.message||'Não foi possível carregar funcionários.';}
 }
 document.getElementById('staffCreateForm').onsubmit=async event=>{
  event.preventDefault();if(!isMaster())return;
  const form=event.currentTarget,button=form.querySelector('button'),status=document.getElementById('staffFormStatus');
  button.disabled=true;status.textContent='Criando login do funcionário…';
  try{
   const name=document.getElementById('staffName').value.trim();
   const email=document.getElementById('staffEmail').value.trim();
   const password=document.getElementById('staffPassword').value;
   const created=await service.createContentAdmin(name,email,password);
   form.reset();document.getElementById('staffPassword').value='';
   status.textContent='Login de '+created.name+' criado. Entregue o e-mail e a senha inicial ao funcionário.';
   await loadStaffRoster();
  }catch(error){status.textContent=error.message||'Não foi possível cadastrar o funcionário.';}
  finally{button.disabled=false;}
 };
 document.getElementById('staffRoster').addEventListener('click',async event=>{
  const button=event.target.closest('[data-staff-id]');if(!button||!isMaster())return;
  button.disabled=true;
  try{await service.setStaffActive(button.dataset.staffId,button.dataset.staffActive==='true');await loadStaffRoster();}
  catch(error){document.getElementById('staffFormStatus').textContent=error.message;button.disabled=false;}
 });
 function setAdminSection(section){
  if(section==='staff'&&!isMaster())section='courses';
  const students=section==='students',staff=section==='staff',view=document.getElementById('adminView');
  view.classList.toggle('show-students',students);
  view.classList.toggle('show-staff',staff);
  document.getElementById('adminHeading').textContent=students?'Alunos':staff?'Funcionários':'Treinamentos';
  document.querySelector('#adminView > .muted').textContent=students?'Consulte alunos e libere Cursos Avulsos e Academias em um só lugar.':staff?'Gerencie as contas e os acessos dos funcionários.':mode==='cloud'?'Crie cursos e aulas. Somente o ADM Master publica treinamentos.':'Demonstração: alterações salvas neste navegador.';
  document.getElementById('adminTab').classList.toggle('active',section==='courses');
  document.getElementById('studentsTab').classList.toggle('active',students);
  document.getElementById('staffTab').classList.toggle('active',staff);
  document.getElementById('workspaceLabel').textContent=students?'Alunos':staff?'Funcionários':'Treinamentos';
 }
 document.getElementById('adminTab').addEventListener('click',()=>setAdminSection('courses'));
 document.getElementById('studentsTab').addEventListener('click',()=>{if(!isEditor())return;show('adminView');setAdminSection('students');loadStudentRoster();window.scrollTo({top:0,behavior:'instant'});});
 document.getElementById('staffTab').addEventListener('click',()=>{if(!isMaster())return;show('adminView');setAdminSection('staff');loadStaffRoster();window.scrollTo({top:0,behavior:'instant'});});
 // Explicit publication actions. A local edit alone never changes the student-facing catalog.
 window.AcademyCloudPublishing={
  async publish(courseId){
   if(!isMaster())throw Error('Somente o ADM Master pode publicar.');
   await flush();
   if(conflicted||dirtyCatalog)throw Error('Salve as informações do curso antes de publicar.');
   return service.publishCourse(courseId);
  },
  async unpublish(courseId){
   if(!isMaster())throw Error('Somente o ADM Master pode despublicar.');
   await flush();
   if(conflicted||dirtyCatalog)throw Error('Salve as informações do curso antes de retirar a publicação.');
   return service.unpublishCourse(courseId);
  }
 };
 const baseRefresh=refresh;refresh=function(){baseRefresh();permissions();};
 const baseRenderClass=renderClass;
 let playbackGeneration=0;
 renderClass=function(){
  baseRenderClass();
  if(config?.mode==='connected'&&config.preview===false&&mode==='cloud'&&!isEditor()){
   const sequence=++playbackGeneration,lesson=selectedCourse?.lessons?.[selectedLesson],session=identity;
   const player=document.getElementById('player'),videoStatus=document.getElementById('lessonVideoStatus');
   player.src='about:blank';document.getElementById('markDone').disabled=true;
   if(lesson?.videoId && /^[a-f0-9-]{36}$/i.test(lesson.videoId)){
    videoStatus.hidden=false;videoStatus.textContent='Autorizando vídeo privado no Mux...';
    service.playback(lesson.videoId).then(value=>{
     if(sequence!==playbackGeneration||identity!==session||mode!=='cloud'||selectedCourse?.lessons?.[selectedLesson]!==lesson)return;
     player.src=value.iframeUrl;videoStatus.hidden=true;document.getElementById('markDone').disabled=false;
    }).catch(()=>{if(sequence===playbackGeneration&&identity===session){videoStatus.hidden=false;videoStatus.textContent='Vídeo privado ainda não autorizado. Confira o vínculo Mux e sua matrícula.';}});
   }else {videoStatus.hidden=false;videoStatus.textContent='Aula ainda sem vídeo privado vinculado no Mux.';}
  }else{
   playbackGeneration++;
   if(config?.mode==='connected'&&mode==='cloud'&&isEditor()&&selectedCourse){
    const note=document.getElementById('lessonVideoStatus');
    note.hidden=false;note.textContent='Prévia administrativa do link Mux cadastrado. O aluno usa somente reprodução privada autorizada.';
   }
  }
  permissions();
 };
 const baseShow=show;show=function(id){if(mode==='cloud'&&(id==='adminView'||id==='studioView')&&!isEditor())id='studentView';baseShow(id);permissions();};
 const demoButton=document.getElementById('enter'),demoPanel=document.getElementById('demoAccess');
 if(!config?.preview){
  if(demoPanel)demoPanel.hidden=true;
  if(demoButton){demoButton.disabled=true;demoButton.onclick=()=>{};}
  document.querySelectorAll('.preview-login-note,.preview-student-login').forEach(node=>node.remove());
 } else {const demoEnter=demoButton.onclick;demoButton.onclick=()=>{if(mode==='cloud')return;demoEnter();};}
 document.getElementById('exit').onclick=async()=>{
  if(mode==='cloud'){
   await flush();
   if((dirtyCatalog||dirtyState||conflicted)&&!confirm('Existem alterações pendentes neste aparelho. Elas ficarão guardadas para a próxima entrada. Deseja sair?'))return;
   try{await service.signOut();}catch{message('Não foi possível encerrar a sessão. Tente novamente.',true);return;}
  }
  resetToDemo();
 };
 const baseSaveProfile=saveProfile;saveProfile=function(){baseSaveProfile();if(mode==='cloud')document.getElementById('profileStatus').textContent='Alterações preparadas. Acompanhe o salvamento no painel da conta.';};
 document.getElementById('saveProfile').onclick=saveProfile;
 document.getElementById('syncNow').onclick=flush;
 document.getElementById('cloudBackup').onclick=exportBackup;
 document.getElementById('downloadPending').onclick=()=>{
  const data=readPending();if(!data)return;
  const payload={app:'VA Academia',schemaVersion:4,exportedAt:new Date().toISOString(),courses:data.courses,progress:data.progress,certificates:data.certificates,profile:data.profile,activity:data.activity};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='contrem-alteracoes-pendentes.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 document.getElementById('reloadCloud').onclick=async()=>{
  if(mode!=='cloud'||saving)return;
  if(readPending()&&!confirm('Recarregar substituirá as alterações pendentes deste aparelho pelos dados da conta. Baixe a cópia pendente antes, se precisar preservá-las. Continuar?'))return;
  try{const data=await service.reload();clearPending();await enterCloud(data);}catch(error){message(errorText(error),true);}
 };
 // Explicit import from a Developer backup. Never promotes local test identities or assessment results.
 const migrate=document.getElementById('migrateLocalCatalog');
 migrate.textContent='Importar cursos do Developer (arquivo JSON)';
 const courseImport=document.createElement('input');courseImport.type='file';courseImport.accept='.json,application/json';courseImport.hidden=true;migrate.after(courseImport);
 migrate.onclick=()=>{if(mode!=='cloud'||identity?.member.role!=='admin'||conflicted||saving)return;courseImport.value='';courseImport.click();};
 courseImport.onchange=async()=>{
  if(mode!=='cloud'||identity?.member.role!=='admin'||conflicted||saving)return;
  try{
   const file=courseImport.files?.[0];if(!file)return;
   if(file.size>15*1024*1024)throw Error('Backup muito grande (máximo 15 MB); divida a exportação antes de importar.');
   const data=JSON.parse(await file.text());
   if(data.app!=='VA Academia'||!Array.isArray(data.courses))throw Error('Selecione o backup exportado pela CONTREM Academia Developer.');
   validateCourses(data.courses);
   const ids=new Set(courses.map(c=>c.id));
   const added=data.courses.filter(c=>!ids.has(c.id)).map(c=>({...copy(c),status:'draft'}));
   if(!added.length){message('Todos os cursos do backup já estão no sistema. Nenhum foi substituído.');return;}
   if(!confirm('Importar '+added.length+' cursos como rascunhos? Seus cursos existentes serão preservados. Os arquivos físicos e as notas dos alunos não serão importados.'))return;
   courses=[...courses,...added];save();refresh();await flush();
   if(!conflicted&&!dirtyCatalog)message(added.length+' cursos importados como rascunhos. Revise vídeos privados e materiais antes de publicar.');
  }catch(error){message(errorText(error),true);}
 };

 form.onsubmit=async event=>{
  event.preventDefault();if(!service)return;const submit=form.querySelector('button');submit.disabled=true;loginStatus.textContent='Entrando na sua conta…';
  try{const data=await service.signIn(document.getElementById('cloudEmail').value.trim(),document.getElementById('cloudPassword').value);document.getElementById('cloudPassword').value='';await enterCloud(data);loginStatus.textContent='';}
  catch(error){loginStatus.textContent=errorText(error);}
  finally{submit.disabled=false;}
 };
 window.addEventListener('online',()=>{if(mode==='cloud')scheduleSync();});
 if(config?.preview){
  if(!window.AcademyAdminPreviewService){loginStatus.textContent='A prévia não carregou. Recarregue a página.';return;}
  service=window.AcademyAdminPreviewService.create();
  const testAccess=document.createElement('div');testAccess.className='preview-login-note';
  testAccess.innerHTML='<b>ÁREA DO ALUNO · CONTA DE TESTE</b><p>Entre como Aluno de teste pelo botão abaixo, sem e-mail ou senha. Três cursos já vêm prontos, incluindo desafios por aula e prova final com caso prático. Basta entrar e abrir um curso. Seu progresso, provas e certificados ficam salvos aqui.</p><button type="button" id="previewStudentEntry" class="outline">Entrar como aluno de teste →</button><p>Não precisa cadastrar aulas nem informar vídeo. Para conferir a administração dos cursos, clique em Sair e abra o painel ADM de teste.</p><p id="previewStudentStatus" role="status" aria-live="polite"></p>';
  form.before(testAccess);
  document.getElementById('previewStudentEntry').onclick=async()=>{
   const button=document.getElementById('previewStudentEntry'),status=document.getElementById('previewStudentStatus');
   button.disabled=true;status.textContent='Preparando o aluno de teste…';
   try{
    const data=await service.startTestStudent();
    if(!data.catalog.courses.length){await service.signOut();status.textContent='Os cursos de teste existentes estão em rascunho. Abra o ADM para publicá-los; suas edições foram preservadas.';return;}
    await enterCloud(data);status.textContent='';
   }catch(error){status.textContent=errorText(error);}
   finally{button.disabled=false;}
  };

  document.getElementById('previewAdminEntry').onclick=async()=>{try{await enterCloud(await service.startAdmin());}catch(error){loginStatus.textContent=errorText(error);}};
  service.restore().then(data=>data&&enterCloud(data)).catch(error=>{loginStatus.textContent=errorText(error);});
  return;
 }
 if(!config||config.mode!=='connected'||config.preview!==false||config.url!=='https://vwvesygsudhbaqmayhsz.supabase.co'||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey||'')||!window.supabase||!window.AcademyCloudService){loginStatus.textContent='A conexão segura da Academia não está disponível. Não há acesso por demonstração.';form.querySelector('button').disabled=true;return;}
 client=window.supabase.createClient(config.url,config.publishableKey,{auth:{storageKey:'contrem-academia-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 service=window.AcademyCloudService.create(client);
 window.AcademyCloudMediaClient=client; // publishable key only; Storage and Auth enforce RLS.
 client.auth.onAuthStateChange((event,session)=>{if(mode==='cloud'&&(event==='SIGNED_OUT'||(session?.user?.id&&session.user.id!==identity.user.id)))resetToDemo();});
 client.auth.getSession().then(async({data})=>{if(!data.session)return;loginStatus.textContent='Retomando sua conta…';try{const value=await service.restore();if(value)await enterCloud(value);loginStatus.textContent='';}catch(error){loginStatus.textContent=errorText(error);}});
})();
