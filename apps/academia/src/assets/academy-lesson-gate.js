/* CONTREM Academia · sequential lesson progression with Mux playhead evidence.
   Preview-only state. A server must validate completion and signed playback in production. */
(() => {
 'use strict';
 if(window.CONTREM_ACADEMY_CONFIG?.preview!==true||!window.CONTREM_PROGRAM_CORE)return;
 const core=window.CONTREM_PROGRAM_CORE,$=id=>document.getElementById(id);
 const isAcademy=()=>!!selectedCourse?.academyId&&window.AcademySession?.role==='student'&&window.AcademySession?.preview;
 const state=()=>({progress});
 const current=()=>isAcademy()?window.CONTREM_PROGRAM_STORE?.studentPrograms()?.items.find(item=>item.academy.id===selectedCourse.academyId)?.map.items.find(item=>item.id===selectedCourse.id):null;
 const firstPending=()=>core.nextLessonIndex(selectedCourse,state());
 const canSelect=i=>!isAcademy()||Number.isInteger(i)&&i>=0&&i<=firstPending();
 let token=0;
 const originalRender=renderClass,originalChoose=chooseLesson,originalMark=$('markDone').onclick;
 const watchFor=(courseId,lessonId)=>{
  const current=activity[courseId]||{},items=current.videoWatch||{};
  return items[lessonId]||{duration:0,seen:[],complete:false};
 };
 const saveWatch=(courseId,lessonId,watch)=>{
  activity[courseId]={...(activity[courseId]||{}),videoWatch:{...(activity[courseId]?.videoWatch||{}),[lessonId]:watch}};
  academyStorage.setItem(ACTIVITY_KEY,JSON.stringify(activity));
 };
 function concludeVideo(courseId,lessonId){
  if(!isAcademy()||selectedCourse.id!==courseId||selectedCourse.lessons[selectedLesson]?.id!==lessonId)return;
  progress[courseId]=Array.from(new Set([...(progress[courseId]||[]),lessonId]));
  save();
  void window.CONTREM_PREVIEW_SYNC?.flush?.().catch(()=>{});
  const hasExercise=!!selectedCourse.lessons[selectedLesson]?.questions?.length;
  $('lessonVideoStatus').hidden=false;
  $('lessonVideoStatus').textContent=hasExercise?'Vídeo assistido! Conclua e seja aprovado na atividade desta aula para liberar a próxima.':'Vídeo assistido! A próxima aula será liberada.';
  renderClass();
  refresh();
  window.dispatchEvent(new CustomEvent('academia:lesson-video-completed',{detail:{courseId,lessonId}}));
 }
 function attachPlayer(){
  const c=selectedCourse,lesson=c?.lessons?.[selectedLesson];
  if(!isAcademy()||!lesson||!core.validMux(lesson.url))return;
  const status=$('lessonVideoStatus');status.hidden=false;
  if((progress[c.id]||[]).includes(lesson.id)){
   status.textContent=lesson.questions?.length&&!core.lessonCompleted(c,lesson,state())?
    'Vídeo assistido. Conclua a atividade da aula para continuar.':'Vídeo assistido e registrado nesta prévia.';
   return;
  }
  if(!window.playerjs?.Player){status.textContent='Rastreamento de vídeo indisponível. Verifique a conexão e atualize a página. A próxima aula permanece bloqueada.';return;}
  const ownToken=++token,courseId=c.id,lessonId=lesson.id,frame=$('player');
  const initial=watchFor(courseId,lessonId),seen=new Set(Array.isArray(initial.seen)?initial.seen.filter(n=>Number.isInteger(n)&&n>=0&&n<40000):[]);
  let duration=Number(initial.duration)||0,previous=null,lastSaved=0,ended=false;
  const stillCurrent=()=>ownToken===token&&isAcademy()&&selectedCourse.id===courseId&&selectedCourse.lessons[selectedLesson]?.id===lessonId;
  const player=new window.playerjs.Player(frame);
  const capture=(sample)=>{
   if(!stillCurrent())return;
   const seconds=Number(sample?.seconds),d=Number(sample?.duration);
   if(Number.isFinite(d)&&d>0&&d<144000)duration=d;
   if(!Number.isFinite(seconds)||seconds<0||!duration)return;
   if(previous!==null&&seconds>previous&&seconds-previous<=3.5){
    for(let second=Math.floor(previous);second<=Math.floor(seconds)&&second<Math.ceil(duration);second++)seen.add(second);
   }
   previous=seconds;
   const now=Date.now();
   if(now-lastSaved>4500){lastSaved=now;saveWatch(courseId,lessonId,{duration,seen:[...seen],complete:false});}
  };
  player.on('ready',()=>{
   if(!stillCurrent())return;
   player.on('timeupdate',capture);
   player.on('seeked',()=>{previous=null;});
   player.on('ended',()=>{
    if(!stillCurrent())return;ended=true;
    const watched=seen.size/Math.max(1,Math.ceil(duration));
    const completed=duration>0&&watched>=.90;
    saveWatch(courseId,lessonId,{duration,seen:[...seen],complete:completed});
    if(completed)concludeVideo(courseId,lessonId);
    else{
     status.hidden=false;
     status.textContent='Você chegou ao final, mas ainda faltam trechos do vídeo. Assista às partes não vistas antes de concluir esta aula.';
    }
   });
  });
 }
 function enhance(){
  if(!isAcademy())return;
  const c=selectedCourse,map=current();
  if(!map?.canOpen){
   $('player').src='about:blank';
   $('markDone').disabled=true;
   $('markDone').textContent='Módulo não liberado';
   return;
  }
  const index=firstPending();
  if(selectedLesson>index){selectedLesson=index;originalRender();}
  const buttons=$('lessonList').querySelectorAll('button');
  buttons.forEach((button,i)=>{
   const locked=i>index||!core.validMux(c.lessons[i]?.url);
   button.disabled=locked;
   button.setAttribute('aria-disabled',String(locked));
   if(locked)button.title=i>index?'Conclua a aula e sua atividade anterior antes de avançar.':'Vídeo ainda não disponibilizado pelo ADM.';
  });
  $('nextLesson').disabled=selectedLesson>=index||!core.validMux(c.lessons[selectedLesson+1]?.url);
  $('markDone').disabled=true;
  $('markDone').textContent='Conclusão automática pelo vídeo';
  const l=c.lessons[selectedLesson];
  if(!core.validMux(l?.url)){
   $('lessonVideoStatus').hidden=false;
   $('lessonVideoStatus').textContent='Aguardando liberação do vídeo pelo ADM. Esta aula ainda não pode ser concluída.';
   $('player').src='about:blank';return;
  }
  attachPlayer();
 }
 renderClass=function(){
  if(isAcademy()&&selectedLesson>firstPending())selectedLesson=firstPending();
  ++token;
  originalRender();
  enhance();
 };
 chooseLesson=function(i){
  if(isAcademy()&&!canSelect(i))return;
  originalChoose(i);
 };
 $('markDone').onclick=function(){
  if(isAcademy())return;
  return originalMark?.call(this);
 };
 const next=$('nextLesson'),prevNext=next.onclick;
 next.onclick=function(event){
  if(isAcademy()&&!canSelect(selectedLesson+1))return;
  return prevNext?.call(this,event);
 };
 const previousAssessment=renderAssessment;
 renderAssessment=function(){
  const result=previousAssessment?.();
  if(isAcademy()){
   const c=selectedCourse,l=c.lessons[selectedLesson],watched=(progress[c.id]||[]).includes(l?.id);
   if(!watched){
    $('assessmentContent').textContent='Assista ao vídeo completo antes de iniciar a atividade desta aula ou a prova do módulo.';
   }else if(!core.lessonDone(c,state())){
    const final=$('assessmentFinalScope');
    if(final){final.disabled=true;final.title='Conclua todas as aulas e atividades antes da prova final.';}
    const currentStart=$('assessmentStart');
    if(currentStart&&!l.questions?.length){currentStart.disabled=true;currentStart.title='A prova final só libera após todas as aulas.';}
   }
  }
  return result;
 };
 window.CONTREM_LESSON_GATE={canSelect,firstPending,watchFor};
})();