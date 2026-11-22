(() => {
 'use strict';
 const config=window.CONTREM_ACADEMY_CONFIG;
 const status=document.getElementById('cloudStatus'),bar=document.getElementById('cloudBar');
 const form=document.getElementById('cloudLoginForm'),loginStatus=document.getElementById('cloudLoginStatus');
 const keys=['va-academia-catalog-v1','va-academia-progress-v1','va-academia-certificates-v1','va-academia-profile-v1','va-academia-activity-v1'];
 let mode='guest',identity=null,service=null,client=null,catalogRevision=0,stateRevision=0;
 let catalogSaved='',stateSaved='',dirtyCatalog=false,dirtyState=false,conflicted=false,timer=null,saving=null,epoch=0;
 const pendingKey=id=>'contrem-academia:'+id+':pending';
 const copy=value=>JSON.parse(JSON.stringify(value));
 const stateJSON=value=>JSON.stringify({profile:value.profile,progress:value.progress,certificates:value.certificates,activity:value.activity});
 function readPending(){try{return JSON.parse(localStorage.getItem(pendingKey(identity.user.id)))||null;}catch{return null;}}
 function snapshot(){return {courses:copy(courses),progress:copy(progress),certificates:copy(certificates),profile:copy(profile),activity:copy(activity)};}
 function savePending(){if(!identity||conflicted)return;localStorage.setItem(pendingKey(identity.user.id),JSON.stringify({...snapshot(),catalogRevision,stateRevision,dirtyCatalog,dirtyState}));}
 function clearPending(){if(identity)localStorage.removeItem(pendingKey(identity.user.id));}
 function message(text,error=false){status.textContent=text;bar.classList.toggle('sync-error',error);}
 function validateCourses(value){validateBackup({app:'VA Academia',schemaVersion:4,courses:value,progress:{}});}
 function permissions(){
  const demoNote=document.querySelector('.demo-course-note');if(demoNote)demoNote.hidden=!courses.some(c=>c.id==='demo-mecanica');
  if(mode!=='cloud')return;
  const admin=identity?.member.role==='admin'&&identity.user.email?.toLowerCase()==='vinicius.alves@irmen.com.br';
  document.getElementById('studentNav').hidden=admin;document.getElementById('adminNav').hidden=!admin;
  document.getElementById('sidebarContext').textContent=admin?'GESTÃO DA ACADEMIA':'AMBIENTE DE APRENDIZAGEM';
  document.getElementById('adminTab').hidden=!admin;
  document.getElementById('adminStudents').hidden=!admin;
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
  epoch++;identity=data;mode='cloud';conflicted=false;dirtyCatalog=false;dirtyState=false;
  catalogRevision=data.catalog.revision;stateRevision=data.state.revision;
  catalogSaved=JSON.stringify(data.catalog.courses);stateSaved=stateJSON(data.state);
  academyStorage.setScope(data.user.id);
  const remote={courses:data.catalog.courses,...data.state};
  const pending=readPending();
  if(pending && ((!pending.dirtyCatalog||pending.catalogRevision===catalogRevision)&&(!pending.dirtyState||pending.stateRevision===stateRevision))){
   putMemory(pending);dirtyCatalog=!!pending.dirtyCatalog&&identity.member.role==='admin';dirtyState=!!pending.dirtyState;
  }else{putMemory(remote);if(pending)conflicted=true;}
  document.getElementById('login').classList.add('hidden');document.getElementById('app').classList.remove('hidden');bar.hidden=false;
  document.getElementById('accountName').textContent=identity.member.display_name||'Conta conectada';
  document.querySelector('.demo-chip').textContent=identity.member.role==='admin'?'ADMINISTRADOR':'ALUNO';
  document.querySelector('#my-profile .row p').textContent='Sua identificação é salva na sua conta.';
  document.querySelector('#adminView > .muted').textContent='Organize seus treinamentos. As alterações são compartilhadas com os alunos da Academia.';
  document.querySelector('#adminView > .notice').textContent='Administração restrita aos administradores da Academia. Avaliações e certificados continuam demonstrativos nesta etapa.';
  document.querySelector('#assessmentPanel .row p').textContent='Responda às questões para registrar o resultado na sua conta. A avaliação continua demonstrativa.';
  document.getElementById('cloudImportHint').hidden=false;
  show(identity.member.role==='admin'?'adminView':'studentView');setAdminSection('courses');permissions();
  if(identity.member.role==='admin')loadStudentRoster();
  message(conflicted?'Há alterações locais e alterações em outro acesso. Baixe a cópia pendente e recarregue os dados.':dirtyCatalog||dirtyState?'Enviando alterações pendentes deste aparelho…':'Conta conectada. Dados carregados.',conflicted);
  if(!conflicted&&(dirtyCatalog||dirtyState))scheduleSync();
 }
 async function flush(){
  if(saving)return saving;
  if(mode!=='cloud'||conflicted||(!dirtyCatalog&&!dirtyState))return;
  if(!navigator.onLine){message('Sem conexão. Alterações guardadas neste aparelho para enviar quando a conexão voltar.',true);savePending();return;}
  const runEpoch=epoch;
  saving=(async()=>{
   try{
    while(mode==='cloud'&&!conflicted&&(dirtyCatalog||dirtyState)){
     const data=snapshot(),catalogWrite=dirtyCatalog&&identity.member.role==='admin',stateWrite=dirtyState;
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
    dirtyCatalog=identity.member.role==='admin'&&JSON.stringify(courses)!==catalogSaved;
    dirtyState=stateJSON(snapshot())!==stateSaved;
    savePending();conflicted=error.name==='AcademyConflict';message(errorText(error),true);permissions();
   }
  })().finally(()=>{saving=null;});
  return saving;
 }
 function scheduleSync(){clearTimeout(timer);timer=setTimeout(flush,250);}
 academyStorage.subscribe(key=>{
  if(mode!=='cloud'||conflicted)return;
  if(key===keys[0])dirtyCatalog=identity.member.role==='admin'&&JSON.stringify(courses)!==catalogSaved;
  else if(keys.includes(key))dirtyState=true;
  savePending();scheduleSync();
 });
 function resetToLogin(){
  epoch++;clearTimeout(timer);mode='guest';identity=null;conflicted=false;dirtyState=false;dirtyCatalog=false;
  academyStorage.setScope(null);bar.hidden=true;
  courses=[];progress={};certificates=[];profile={fullName:'',email:'',company:'',role:''};activity={};
  selectedCourse=null;studentName='Aluno';
  document.getElementById('hello').textContent=studentName;
  document.getElementById('studentNav').hidden=true;
  document.getElementById('adminNav').hidden=true;
  document.getElementById('adminStudents').hidden=true;
  document.getElementById('adminTab').hidden=true;
  document.getElementById('player').src='about:blank';
  document.getElementById('cloudImportHint').hidden=true;
  document.getElementById('cloudPassword').value='';
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login').classList.remove('hidden');
  loginStatus.textContent='';
 }
 function errorText(error){
  if(error.name==='AcademyConflict')return error.message;
  if(!navigator.onLine)return 'Sem conexão. As alterações estão guardadas neste aparelho; conecte-se e tente novamente.';
  if(error.code==='invalid_credentials')return 'Não foi possível entrar. Confira seu e-mail e sua senha.';
  if(error.message?.includes('desativado')||error.message?.includes('ainda não foi liberado'))return error.message;
  return 'Não foi possível concluir a operação. Seus dados locais foram preservados. Verifique a conexão e tente novamente.';
 }
 async function loadStudentRoster(){
  const roster=document.getElementById('studentRoster');if(mode!=='cloud'||identity?.member.role!=='admin')return;
  try{const data=await service.listStudents(),rows=data.members||[],grants=data.grants||[];roster.innerHTML=rows.length?rows.map(m=>'<div class="student-roster-row"><b>'+esc(m.display_name)+'</b> · '+(m.active?'Ativo':'Inativo')+' <button type="button" class="outline" data-member="'+esc(m.id)+'" data-active="'+(!m.active)+'">'+(m.active?'Desativar':'Reativar')+'</button><div class="access-course-list">'+(courses.length?courses.map(c=>'<label><input type="checkbox" data-member="'+esc(m.id)+'" data-course="'+esc(c.id)+'" '+(grants.some(g=>g.member_id===m.id&&g.course_id===c.id)?'checked':'')+' '+(!m.active?'disabled':'')+'> '+esc(c.name)+'</label>').join(''):'Cadastre um treinamento para liberar acesso.')+'</div></div>').join(''):'Nenhum aluno cadastrado.';}catch{roster.textContent='Não foi possível carregar os alunos.';}
 }
 document.getElementById('studentRoster').addEventListener('change',async event=>{
  const el=event.target;if(!el.matches('[data-course]')||mode!=='cloud')return;
  el.disabled=true;try{await service.setCourseAccess(el.dataset.member,el.dataset.course,el.checked);document.getElementById('studentFormStatus').textContent='Acesso ao curso atualizado.';}catch(error){el.checked=!el.checked;document.getElementById('studentFormStatus').textContent=error.message;}finally{el.disabled=false;}
 });
 document.getElementById('studentRoster').addEventListener('click',async event=>{
  const el=event.target.closest('[data-active]');if(!el||mode!=='cloud')return;
  el.disabled=true;try{await service.setStudentActive(el.dataset.member,el.dataset.active==='true');await loadStudentRoster();document.getElementById('studentFormStatus').textContent='Status do aluno atualizado.';}catch(error){document.getElementById('studentFormStatus').textContent=error.message;el.disabled=false;}
 });
 document.getElementById('studentForm').onsubmit=async event=>{
  event.preventDefault();if(mode!=='cloud'||identity?.member.role!=='admin')return;
  const form=event.currentTarget,status=document.getElementById('studentFormStatus'),button=form.querySelector('button');button.disabled=true;status.textContent='Criando acesso…';
  try{const result=await service.createStudent(document.getElementById('studentFullName').value.trim(),document.getElementById('studentEmail').value.trim(),document.getElementById('studentPassword').value);form.reset();status.textContent='Aluno '+result.name+' cadastrado. Entregue o e-mail e a senha inicial a ele.';await loadStudentRoster();}catch(error){status.textContent=error.message||'Não foi possível cadastrar o aluno.';}finally{button.disabled=false;}
 };
 function setAdminSection(section){
  const students=section==='students',view=document.getElementById('adminView');view.classList.toggle('show-students',students);
  document.getElementById('adminHeading').textContent=students?'Alunos':'Treinamentos';
  document.querySelector('#adminView > .muted').textContent=students?'Cadastre alunos e consulte os acessos da Academia.':mode==='cloud'?'Crie cursos, aulas e materiais para os alunos da Academia.':'Entre na sua conta para gerenciar treinamentos.';
  document.getElementById('adminTab').classList.toggle('active',!students);document.getElementById('studentsTab').classList.toggle('active',students);
  document.getElementById('workspaceLabel').textContent=students?'Alunos':'Treinamentos';
 }
 document.getElementById('adminTab').addEventListener('click',()=>setAdminSection('courses'));
 document.getElementById('studentsTab').addEventListener('click',()=>{if(mode!=='cloud'||identity?.member.role!=='admin')return;show('adminView');setAdminSection('students');loadStudentRoster();window.scrollTo({top:0,behavior:'instant'});});
 const baseRefresh=refresh;refresh=function(){baseRefresh();permissions();};
 const baseRenderClass=renderClass;renderClass=function(){baseRenderClass();permissions();};
 const baseShow=show;show=function(id){if(mode!=='cloud'||!identity)return;if(id==='adminView'&&(identity.member.role!=='admin'||identity.user.email?.toLowerCase()!=='vinicius.alves@irmen.com.br'))id='studentView';baseShow(id);permissions();};
 document.getElementById('exit').onclick=async()=>{
  if(mode==='cloud'){
   await flush();
   if((dirtyCatalog||dirtyState||conflicted)&&!confirm('Existem alterações pendentes neste aparelho. Elas ficarão guardadas para a próxima entrada. Deseja sair?'))return;
   try{await service.signOut();}catch{message('Não foi possível encerrar a sessão. Tente novamente.',true);return;}
  }
  resetToLogin();
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
 document.getElementById('migrateLocalCatalog').disabled=true;
 form.onsubmit=async event=>{
  event.preventDefault();if(!service)return;const submit=form.querySelector('button');submit.disabled=true;loginStatus.textContent='Entrando na sua conta…';
  try{const data=await service.signIn(document.getElementById('cloudEmail').value.trim(),document.getElementById('cloudPassword').value);document.getElementById('cloudPassword').value='';await enterCloud(data);loginStatus.textContent='';}
  catch(error){loginStatus.textContent=errorText(error);}
  finally{submit.disabled=false;}
 };
 window.addEventListener('online',()=>{if(mode==='cloud')scheduleSync();});
 if(!config?.url||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)||!config.publishableKey||config.preview===true||!window.supabase||!window.AcademyCloudService){loginStatus.textContent='Não foi possível carregar o acesso à sua conta. Atualize a página ou tente novamente mais tarde.';form.querySelector('button').disabled=true;return;}
 client=window.supabase.createClient(config.url,config.publishableKey,{auth:{storageKey:'contrem-academia-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 service=window.AcademyCloudService.create(client);
 client.auth.onAuthStateChange((event,session)=>{if(mode==='cloud'&&(event==='SIGNED_OUT'||(session?.user?.id&&session.user.id!==identity.user.id)))resetToLogin();});
 client.auth.getSession().then(async({data})=>{if(!data.session)return;loginStatus.textContent='Retomando sua conta…';try{const value=await service.restore();if(value)await enterCloud(value);loginStatus.textContent='';}catch(error){loginStatus.textContent=errorText(error);}});
})();
