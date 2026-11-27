// The interactive course is a dedicated study surface inside the authenticated Academy.
(() => {
 const root=document.documentElement;
 const classView=document.getElementById('classView'),back=document.getElementById('back');
 const course=id=>/^scorm-[a-f0-9-]{36}$/i.test(id||'');
 const header=document.createElement('div');header.className='scorm-focus-header';header.hidden=true;
 header.innerHTML='<strong>CONTREM <span>ACADEMIA</span></strong><div class="scorm-focus-actions"><button type="button" id="scormExpand" class="outline">⛶ Tela cheia</button><button type="button" id="scormLeave" class="primary">Sair do curso →</button></div>';
 classView.prepend(header);
 const expand=header.querySelector('#scormExpand');
 function sync(){
  const active=course(selectedCourse?.id)&&!classView.classList.contains('hidden');
  root.classList.toggle('scorm-focused',active);header.hidden=!active;
  if(active){back.hidden=true;document.getElementById('classCourseHeading').hidden=true;window.scrollTo({top:0,behavior:'instant'});}
  else{back.hidden=false;document.getElementById('classCourseHeading').hidden=false;if(document.fullscreenElement===classView)document.exitFullscreen?.().catch(()=>{});}
  expand.textContent=document.fullscreenElement===classView?'⤡ Sair da tela cheia':'⛶ Tela cheia';
 }
 const previousShow=show;show=function(id){const result=previousShow(id);sync();return result};
 const previousRender=renderClass;renderClass=function(){const result=previousRender();sync();return result};
 header.querySelector('#scormLeave').onclick=()=>back.click();
 expand.onclick=async()=>{try{if(document.fullscreenElement===classView)await document.exitFullscreen();else await classView.requestFullscreen();}catch{expand.textContent='Tela cheia indisponível'}sync()};
 document.addEventListener('fullscreenchange',sync);
 window.addEventListener('contrem:academy-session-ended',()=>{root.classList.remove('scorm-focused');header.hidden=true;if(document.fullscreenElement===classView)document.exitFullscreen?.().catch(()=>{})});
})();
