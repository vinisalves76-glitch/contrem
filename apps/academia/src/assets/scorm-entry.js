// Authoring stays inside the existing Academy workspace and navigation.
(() => {
 const adminNav=document.getElementById('adminNav'),button=document.createElement('button');
 button.type='button';button.hidden=true;button.id='scormAuthoringTab';button.innerHTML='<span aria-hidden="true">✦</span> Studio';adminNav.append(button);
 const panel=document.createElement('section');panel.id='scormAuthoringPanel';panel.hidden=true;panel.setAttribute('aria-label','CONTREM Studio');
 panel.style.cssText='padding:0;width:100%;min-height:75vh';document.getElementById('app').append(panel);
 let session=null,frame=null,loadedKey=null,needsReload=false;
 const baseShow=show;
 const close=()=>{panel.hidden=true;button.classList.remove('active')};
 show=function(id){close();return baseShow(id)};
 function open(draft,duplicate=false,academyId=null,copyAcademy=false){
  if(!['admin','content_admin'].includes(session?.role))return;
  if(window.AcademyAdminEdits&&!window.AcademyAdminEdits.canLeave())return;
  ['studentView','adminView','classView'].forEach(id=>document.getElementById(id).classList.add('hidden'));
  document.querySelectorAll('#adminNav button').forEach(b=>b.classList.remove('active'));button.classList.add('active');
  document.getElementById('workspaceLabel').textContent=academyId?'Studio · Academia':draft?'Editar treinamento':'Studio';panel.hidden=false;
  if(!frame){frame=document.createElement('iframe');frame.id='scormAuthoringFrame';frame.title='CONTREM Studio';frame.style.cssText='display:block;width:100%;height:850px;min-height:700px;border:0';panel.append(frame)}
  const key=academyId?(copyAcademy?'academy-copy:':'academy:')+academyId:duplicate?'copy:'+draft:draft||'create';
  if(duplicate||copyAcademy||loadedKey!==key){
   loadedKey=key;
   frame.src='/academia/criador-ia/?embedded=1&'+(academyId?'studioMode=academies&'+(copyAcademy?'academyCopy=':'academyId=')+encodeURIComponent(academyId):draft?(duplicate?'copy=':'draft=')+encodeURIComponent(draft):'start=home');
  }
  window.scrollTo({top:0,behavior:'instant'});
 }
 button.onclick=()=>open();
 window.CONTREM_AUTHORING_NAV={openCreate:()=>open(),openDraft:id=>{if(/^[a-f0-9-]{36}$/i.test(id||''))open(id)},openCopy:id=>{if(/^[a-f0-9-]{36}$/i.test(id||''))open(id,true)},
  openAcademy:id=>{if(/^academy-[a-z0-9-]{3,150}$/i.test(id||''))open(null,false,id)},
  openAcademyCopy:id=>{if(/^academy-[a-z0-9-]{3,150}$/i.test(id||''))open(null,false,id,true)}};
 adminNav.addEventListener('click',async event=>{
  const target=event.target.closest('button');if(!target||target===button||panel.hidden||!needsReload)return;
  event.preventDefault();event.stopImmediatePropagation();close();needsReload=false;
  await document.getElementById('reloadCloud').onclick();target.click();
 },true);
 window.addEventListener('message',event=>{
  if(!frame||event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='contrem:authoring-height'){
   const height=Number(event.data.height);if(Number.isFinite(height))frame.style.height=Math.max(700,Math.min(30000,height))+'px';
  }
  if(event.data?.type==='contrem:authoring-published')needsReload=true;
  if(event.data?.type==='contrem:studio-academy-saved')void window.CONTREM_CONNECTED_PROGRAMS?.refreshAdmin?.();
  if(event.data?.type==='contrem:studio-open-trainings')document.getElementById('adminTab')?.click();
 });
 window.addEventListener('contrem:academy-session-ready',event=>{
  session=event.detail;button.hidden=!['admin','content_admin'].includes(session.role);
  const query=new URLSearchParams(location.search),draft=query.get('authoringDraft');
  if(!['admin','content_admin'].includes(session.role))return;
  if(draft&&/^[a-f0-9-]{36}$/i.test(draft))open(draft);else if(query.get('criarComIA')==='1')open();else return;
  query.delete('authoringDraft');query.delete('criarComIA');history.replaceState(null,'',location.pathname+(query.size?'?'+query:'')+location.hash);
 });
 window.addEventListener('contrem:academy-session-ended',()=>{session=null;close();button.hidden=true;frame?.remove();frame=null;loadedKey=null;needsReload=false});
})();
