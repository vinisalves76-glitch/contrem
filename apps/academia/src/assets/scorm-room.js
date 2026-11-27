// SCORM authored content is delivered by an authenticated runtime; video lessons keep Mux.
(() => {
 const isScorm=c=>/^scorm-[a-f0-9-]{36}$/i.test(c?.id||'');
 const base=renderClass;
 renderClass=function(){
  base();const scorm=isScorm(selectedCourse),box=document.getElementById('player').closest('.video');
  box?.classList.toggle('scorm-room',scorm);document.getElementById('markDone').hidden=scorm;
  if(!scorm){document.getElementById('assessmentPanel').hidden=false;return;}
  const player=document.getElementById('player');player.src='/academia/scorm-player/?course='+encodeURIComponent(selectedCourse.id);player.title='Treinamento interativo CONTREM';
  document.getElementById('lessonVideoStatus').hidden=true;document.getElementById('assessmentPanel').hidden=true;
  document.getElementById('markDone').disabled=true;
 };
 const style=document.createElement('style');style.textContent='.video.scorm-room{aspect-ratio:auto;min-height:78vh;background:#f2f4f6}.video.scorm-room iframe{min-height:78vh}';document.head.append(style);
 document.getElementById('adminCourses').addEventListener('click',event=>{
  const button=event.target.closest('[data-course-edit],[data-course-copy]');
  const id=button?.dataset.courseEdit||button?.dataset.courseCopy;
  if(!id||!isScorm({id}))return;
  event.preventDefault();event.stopImmediatePropagation();
  window.CONTREM_AUTHORING_NAV?.openDraft(id.slice(6));
 },true);
 window.addEventListener('message',event=>{
  const player=document.getElementById('player');
  if(event.origin!==location.origin||event.source!==player.contentWindow||event.data?.type!=='contrem:scorm-state'||event.data.courseId!==selectedCourse?.id)return;
  if(event.data.passed){window.AcademyCloudReloadLearning?.().catch(()=>{});const note=document.getElementById('lessonVideoStatus');note.hidden=false;note.textContent='Treinamento concluído e salvo na sua conta. Atualize o painel para visualizar o progresso.';}
 });
 window.addEventListener('contrem:academy-session-ready',event=>{
  if(['admin','content_admin'].includes(event.detail.role)&&new URLSearchParams(location.search).has('matricular'))document.getElementById('studentsTab').click();
 });
})();
