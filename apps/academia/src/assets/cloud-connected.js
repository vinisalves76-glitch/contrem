// Connected Academy shell. Sandbox authoring and client-graded exams never run here.
(() => {
 'use strict';
 function initialize(config){
  const byId=id=>document.getElementById(id),copy=value=>JSON.parse(JSON.stringify(value));
  const form=byId('cloudLoginForm'),loginStatus=byId('cloudLoginStatus'),bar=byId('cloudBar'),status=byId('cloudStatus');
  let client=null,service=null,identity=null,revision=0,epoch=0,playbackEpoch=0,playbackTimer=null,syncTimer=null,saving=null,dirty=false,conflict=false;
  const owner=()=>identity?.member.role==='admin'&&identity.member.active===true&&identity.user.email?.toLowerCase()==='vinicius.alves@irmen.com.br';
  const message=(text,error=false)=>{status.textContent=text;bar.classList.toggle('sync-error',error);};
  const blocked=()=>message('Este recurso aguarda integração segura e não está disponível nesta versão.',true);
  function stopPlayer(){playbackEpoch++;clearTimeout(playbackTimer);byId('player').src='about:blank';byId('markDone').disabled=true;}
  function signedOut(){
   epoch++;stopPlayer();clearTimeout(syncTimer);service?.clearIdentity?.();identity=null;window.AcademySession=null;dirty=false;conflict=false;saving=null;
   courses=[];progress={};certificates=[];activity={};profile={fullName:'',email:'',company:'',role:''};selectedCourse=null;studentName='';
   byId('app').classList.add('hidden');byId('login').classList.remove('hidden');bar.hidden=true;
   byId('studentRoster').textContent='';byId('studentForm').reset();byId('studentFormStatus').textContent='';byId('studentForm').querySelector('button').disabled=false;byId('cloudPassword').value='';
   byId('courseGrid').textContent='';byId('adminCourses').textContent='';byId('lessonList').textContent='';byId('lessonTitle').textContent='';byId('lessonDesc').textContent='';byId('lessonMaterial').textContent='';byId('learningHistory').textContent='';byId('hello').textContent='';byId('accountName').textContent='';loadProfile();
  }
  // Remove every visible demo entry before attempting any connection.
  document.querySelectorAll('.preview-login-note,.preview-student-login').forEach(node=>node.remove());
  // A release não inclui elementos de entrada demonstrativa.
  document.querySelector('.cloud-login-note').textContent='Use sua conta cadastrada pela administração da CONTREM Academia.';
  document.querySelector('#adminView .admin').hidden=true;
  document.querySelectorAll('#courseForm input,#courseForm textarea,#courseForm button,#lessonForm input,#lessonForm textarea,#lessonForm button,#questionForm input,#questionForm textarea,#questionForm button').forEach(node=>node.disabled=true);
  ['importBackupBtn','importBackupText','exportBackup','cloudBackup','migrateLocalCatalog','downloadPending','resetForm'].forEach(id=>{byId(id).hidden=true;byId(id).onclick=blocked;});
  ['courseForm','lessonForm','questionForm'].forEach(id=>{byId(id).onsubmit=event=>{event.preventDefault();blocked();};});
  // Overwrite legacy global handlers too; hiding their controls is not authorization.
  editCourse=selectLessons=editLesson=deleteCourse=deleteLesson=issueCertificate=printCertificate=removeQuestion=blocked;
  resetForm=()=>{};resetLessonForm=()=>{};
  renderAssessment=()=>{byId('assessmentContent').textContent='Avaliações e certificação estarão disponíveis após validação no servidor.';};
  renderCourseCertificates=()=>{byId('certificateActions').textContent='';byId('courseCertificates').textContent='A conclusão de aulas é autodeclarada e não emite certificado.';};
  renderCertificateList=()=>{byId('certificateList').textContent='Certificados dependem de validação no servidor e não são emitidos nesta etapa.';};
  document.querySelector('#assessmentPanel .row p').textContent='Avaliação e certificação seguras em preparação.';
  document.querySelector('#my-profile .row p').textContent='Seus dados de exibição são vinculados à conta da Academia.';
  const baseShow=show;
  show=function(id){
   if(!identity){byId('app').classList.add('hidden');byId('login').classList.remove('hidden');return;}
   if(id==='adminView'&&!owner())id='studentView';
   if(id!=='classView')stopPlayer();baseShow(id);
   byId('adminStudents').hidden=!(owner()&&id==='adminView');
  };
  function state(){return {profile:copy(profile),progress:copy(progress),activity:copy(activity)};}
  async function flush(){
   if(saving)return saving;
   if(!identity||!dirty||conflict)return;
   if(!navigator.onLine){message('Sem conexão. Não foi possível salvar na conta. Mantenha esta página aberta para tentar novamente.',true);return;}
   const session=identity,version=epoch;
   saving=(async()=>{
    try{
     while(dirty&&identity===session&&epoch===version){
      const value=state();dirty=false;message('Salvando na conta…');
      const row=await service.writeState(value,revision);
      if(identity!==session||epoch!==version)return;revision=row.revision;
     }
     if(identity===session&&epoch===version)message('Progresso autodeclarado e perfil salvos na conta.');
    }catch(error){
     if(identity!==session||epoch!==version)return;
     dirty=true;conflict=error.name==='AcademyConflict';message(conflict?'Seus dados mudaram em outro acesso. Recarregue antes de continuar.':'Não foi possível salvar na conta. Suas alterações estão apenas nesta página; tente novamente.',true);
    }finally{if(identity===session&&epoch===version)saving=null;}
   })();return saving;
  }
  save=function(){if(!identity)return;dirty=true;clearTimeout(syncTimer);syncTimer=setTimeout(flush,250);message('Alterações aguardando salvamento na conta.');};
  touchCourse=function(courseId,lessonId){if(!identity)return;activity[courseId]={lastOpenedAt:new Date().toISOString(),lastLessonId:lessonId||null};save();renderHistoryAndPerformance();};
  saveProfile=function(){
   if(!identity||conflict)return;
   profile={fullName:byId('profileFullName').value.trim(),email:byId('profileEmail').value.trim(),company:byId('profileCompany').value.trim(),role:byId('profileRole').value.trim()};
   studentName=profile.fullName||identity.member.display_name;byId('hello').textContent=studentName;save();byId('profileStatus').textContent='Acompanhe o salvamento no painel da conta.';
  };
  byId('saveProfile').onclick=saveProfile;
  renderClass=function(){
   stopPlayer();if(!identity||!selectedCourse)return;
   const course=selectedCourse,lesson=course.lessons[selectedLesson],version=playbackEpoch,session=identity;
   byId('classCourseTitle').textContent=course.name;byId('classCourseHeading').textContent=course.name;
   byId('lessonList').innerHTML=course.lessons.map((item,index)=>'<button type="button" class="lesson '+(index===selectedLesson?'active':'')+'" '+(index===selectedLesson?'aria-current="step"':'')+' onclick="chooseLesson('+index+')">'+(index+1)+'. '+esc(item.name)+(isDone(item.id)?' ✓':'')+'</button>').join('');
   const done=courseDoneCount(course);byId('classProgress').style.width=(course.lessons.length?done/course.lessons.length*100:0)+'%';byId('classProgressText').textContent=done+' de '+course.lessons.length+' concluídas (autodeclarado)';
   byId('lessonTitle').textContent=lesson?.name||'Nenhuma aula disponível';byId('lessonDesc').textContent=lesson?.description||'';
   byId('lessonMaterial').hidden=false;byId('lessonMaterial').textContent='Materiais de apoio aguardam integração de armazenamento com controle de acesso.';
   byId('lessonVideoStatus').hidden=false;byId('lessonVideoStatus').textContent='Solicitando acesso ao vídeo privado…';
   byId('markDone').textContent=lesson&&isDone(lesson.id)?'Desmarcar conclusão':'Marcar como concluída (autodeclarado)';
   byId('previousLesson').disabled=selectedLesson<=0;byId('nextLesson').disabled=selectedLesson>=course.lessons.length-1;
   renderAssessment();renderCourseCertificates();
   const current=()=>identity===session&&playbackEpoch===version&&selectedCourse===course&&course.lessons[selectedLesson]===lesson;
   if(!lesson?.videoId){byId('lessonVideoStatus').textContent='Esta aula aguarda vínculo seguro com o vídeo no Mux.';return;}
   service.playback(lesson.videoId).then(value=>{
    if(!current())return;
    byId('player').src=value.iframeUrl;byId('lessonVideoStatus').textContent='Reprodução privada autorizada para sua conta.';byId('markDone').disabled=conflict;
    playbackTimer=setTimeout(()=>{if(current())renderClass();},Math.max(1000,Math.min(2147483647,value.expiresAt*1000-Date.now()-60000)));
   }).catch(()=>{if(current())byId('lessonVideoStatus').textContent='Não foi possível autorizar o vídeo privado. Verifique seu acesso e tente novamente.';});
  };
  const retry=document.createElement('button');retry.type='button';retry.className='outline';retry.textContent='Tentar abrir o vídeo novamente';retry.onclick=()=>{if(identity)renderClass();};byId('lessonVideoStatus').after(retry);
  const baseMark=byId('markDone').onclick;byId('markDone').onclick=()=>{if(identity&&!conflict&&!byId('markDone').disabled)baseMark();};
  async function roster(){
   if(!owner())return;const session=identity,version=epoch;
   byId('studentRoster').textContent='Carregando alunos…';
   try{
    const value=await service.listStudents();if(identity!==session||epoch!==version||!owner())return;
    const members=value.members||[],grants=value.grants||[];
    byId('studentRoster').innerHTML=members.length?members.map(member=>'<div class="student-roster-row"><b>'+esc(member.display_name)+'</b><small>'+esc(member.email||'')+'</small> · '+(member.active?'Ativo':'Inativo')+' <button type="button" class="outline" data-member="'+esc(member.id)+'" data-active="'+(!member.active)+'">'+(member.active?'Desativar':'Reativar')+'</button><div>'+courses.map(course=>'<label><input type="checkbox" data-member="'+esc(member.id)+'" data-course="'+esc(course.id)+'" '+(grants.some(grant=>grant.member_id===member.id&&grant.course_id===course.id)?'checked':'')+' '+(!member.active?'disabled':'')+'> '+esc(course.name)+'</label>').join('')+'</div></div>').join(''):'Nenhum aluno cadastrado.';
   }catch{if(identity===session&&epoch===version)byId('studentRoster').textContent='Não foi possível carregar os alunos da Academia.';}
  }
  byId('studentForm').onsubmit=async event=>{
   event.preventDefault();if(!owner())return;const session=identity,version=epoch,button=byId('studentForm').querySelector('button');button.disabled=true;
   byId('studentFormStatus').textContent='Criando conta da Academia…';
   try{await service.createStudent(byId('studentFullName').value.trim(),byId('studentEmail').value.trim(),byId('studentPassword').value);if(identity!==session||epoch!==version)return;byId('studentForm').reset();byId('studentFormStatus').textContent='Conta criada. Entregue as credenciais ao aluno por um canal seguro.';await roster();}
   catch{if(identity===session&&epoch===version)byId('studentFormStatus').textContent='Não foi possível criar a conta. Verifique os dados e tente novamente.';}
   finally{if(identity===session&&epoch===version)button.disabled=false;}
  };
  byId('studentRoster').addEventListener('change',async event=>{
   const target=event.target;if(!owner()||!target.matches('[data-course]'))return;const session=identity,version=epoch;target.disabled=true;
   try{await service.setCourseAccess(target.dataset.member,target.dataset.course,target.checked);if(identity===session&&epoch===version)byId('studentFormStatus').textContent='Acesso atualizado.';}
   catch{if(identity===session&&epoch===version){target.checked=!target.checked;byId('studentFormStatus').textContent='Não foi possível atualizar o acesso.';}}
   finally{if(identity===session&&epoch===version)target.disabled=false;}
  });
  byId('studentRoster').addEventListener('click',async event=>{
   const target=event.target.closest('[data-active]');if(!owner()||!target)return;const session=identity,version=epoch;target.disabled=true;
   try{await service.setStudentActive(target.dataset.member,target.dataset.active==='true');if(identity===session&&epoch===version)await roster();}
   catch{if(identity===session&&epoch===version){target.disabled=false;byId('studentFormStatus').textContent='Não foi possível atualizar o aluno.';}}
  });
  function enter(data){
   // The RPC projection must supply published, granted courses with private video UUIDs.
   validateBackup({app:'VA Academia',schemaVersion:4,courses:data.catalog.courses,progress:{}});
   epoch++;stopPlayer();identity=data;revision=data.state.revision;dirty=false;conflict=false;
   courses=copy(data.catalog.courses);progress=copy(data.state.progress||{});activity=copy(data.state.activity||{});profile=copy(data.state.profile||{});certificates=[];selectedCourse=null;
   window.AcademySession={role:data.member.role,preview:false,userId:data.user.id};studentName=profile.fullName||data.member.display_name;byId('hello').textContent=studentName;
   byId('accountName').textContent=data.member.display_name;byId('studentNav').hidden=false;byId('adminNav').hidden=!owner();byId('adminTab').hidden=!owner();
   byId('adminHeading').textContent='Alunos e acessos';document.querySelector('#adminView > .muted').textContent='Gerencie os acessos reais da Academia. A autoria conectada de cursos aguarda integração.';
   document.querySelector('#adminView > .notice').textContent='Somente contas administrativas autorizadas podem gerenciar alunos.';
   document.querySelector('.demo-chip').textContent='CONTA CONECTADA · ACADEMIA';
   document.querySelector('#adminStudents > .muted').textContent='Cadastre contas reais somente para alunos autorizados e libere os cursos necessários.';
   byId('app').classList.remove('hidden');byId('login').classList.add('hidden');bar.hidden=false;loadProfile();refresh();show('studentView');message('Conta conectada. Progresso das aulas autodeclarado; avaliação e certificação ainda indisponíveis.');
  }
  byId('adminTab').onclick=()=>{if(owner()){show('adminView');roster();}};
  byId('studentsTab').onclick=()=>{if(owner()){show('adminView');roster();}};
  byId('syncNow').onclick=flush;
  byId('reloadCloud').onclick=async()=>{
   if(!identity||saving)return;if(dirty&&!confirm('Recarregar descartará as alterações ainda não salvas nesta página. Continuar?'))return;
   const version=epoch;try{const data=await service.reload();if(epoch===version)enter(data);}catch{if(epoch===version){signedOut();loginStatus.textContent='Sua conta precisa ser validada novamente. Entre para continuar.';}}
  };
  byId('exit').onclick=async()=>{
   if(!identity){signedOut();return;}await flush();
   if(dirty&&!confirm('As alterações ainda não foram salvas na conta. Sair e descartá-las?'))return;
   signedOut();try{await service.signOut();}catch{loginStatus.textContent='A saída remota não foi confirmada. Entre novamente ou encerre a sessão no dispositivo.';}
  };
  form.onsubmit=async event=>{
   event.preventDefault();if(!service)return;const version=++epoch,button=form.querySelector('button');stopPlayer();button.disabled=true;loginStatus.textContent='Validando sua conta…';
   try{const data=await service.signIn(byId('cloudEmail').value.trim(),byId('cloudPassword').value);if(epoch!==version)return;enter(data);byId('cloudPassword').value='';loginStatus.textContent='';}
   catch{if(epoch===version){signedOut();loginStatus.textContent='Não foi possível entrar. Confira as credenciais e a liberação da sua conta na Academia.';}}
   finally{button.disabled=false;}
  };
  window.addEventListener('online',()=>{if(identity&&dirty)flush();});
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  signedOut();
  let url;try{url=new URL(config?.url);}catch{}
  const key=config?.publishableKey,publicKey=typeof key==='string'&&(/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)||(()=>{try{const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return payload.role==='anon'&&payload.ref===url?.hostname.split('.')[0];}catch{return false;}})());
  if(config?.mode!=='connected'||config.preview!==false||!url||url.protocol!=='https:'||url.hostname!=='vwvesygsudhbaqmayhsz.supabase.co'||url.username||url.password||url.port||url.pathname!=='/'||url.search||url.hash||!publicKey||config.playbackFunction!=='academy-playback'||!window.supabase||!window.AcademyCloudService){
   loginStatus.textContent='A conexão segura da Academia ainda não está configurada. O acesso está indisponível.';form.querySelector('button').disabled=true;return;
  }
  try{
   client=window.supabase.createClient(url.origin,key,{auth:{storageKey:'contrem-academia-auth-v1',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
   service=window.AcademyCloudService.create(client,config);
   client.auth.onAuthStateChange((event,session)=>{if(identity&&(event==='SIGNED_OUT'||(session?.user?.id&&session.user.id!==identity.user.id)))signedOut();});
   const initialVersion=epoch;
   client.auth.getSession().then(async({data,error})=>{if(epoch!==initialVersion||error||!data?.session)return;const version=initialVersion;loginStatus.textContent='Retomando sua conta…';try{const value=await service.restore();if(epoch===version){if(value)enter(value);loginStatus.textContent=value?'':'Entre novamente para validar seu acesso à Academia.';}}catch{if(epoch===version){signedOut();loginStatus.textContent='Entre novamente para validar seu acesso à Academia.';}}}).catch(()=>{loginStatus.textContent='Entre novamente para validar seu acesso à Academia.';});
  }catch{service=null;loginStatus.textContent='A conexão segura da Academia não carregou. Recarregue a página.';form.querySelector('button').disabled=true;}
 }
 window.AcademyConnectedUI={initialize};
})();
