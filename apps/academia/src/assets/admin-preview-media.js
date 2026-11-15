// Local-only attachments for the Academy ADM preview. Production uploads use Mux.
(() => {
 'use strict';
 if(!window.CONTREM_ACADEMY_CONFIG?.preview||!window.indexedDB)return;
 const DB='contrem-adm-preview-media-v1',STORE='attachments';
 let opening;
 function database(){
  if(opening)return opening;
  opening=new Promise((resolve,reject)=>{
   const request=indexedDB.open(DB,1);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'});};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||Error('Não foi possível abrir o armazenamento local de anexos.'));
  });
  return opening;
 }
 async function save(file,kind){
  if(!(file instanceof Blob)||!file.size)throw Error('Selecione um arquivo válido.');
  if(!['video','support'].includes(kind))throw Error('Tipo de anexo inválido.');
  const record={id:'attachment-'+crypto.randomUUID(),kind,name:String(file.name||'arquivo'),type:file.type||'application/octet-stream',size:file.size,blob:file,createdAt:Date.now()};
  const db=await database();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Não foi possível salvar o anexo neste navegador.'));tx.onabort=()=>reject(tx.error||Error('O navegador não tem espaço disponível para este anexo.'));});
  return {id:record.id,kind:record.kind,name:record.name,type:record.type,size:record.size};
 }
 async function get(id){
  if(typeof id!=='string'||!/^attachment-[A-Za-z0-9-]+$/.test(id))return null;
  const db=await database(),record=await new Promise((resolve,reject)=>{const request=db.transaction(STORE,'readonly').objectStore(STORE).get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error||Error('Não foi possível abrir o anexo.'));});
  if(!record?.blob)return null;
  return {id:record.id,kind:record.kind,name:record.name,type:record.type,size:record.size,url:URL.createObjectURL(record.blob)};
 }
 async function remove(id){
  if(typeof id!=='string'||!/^attachment-[A-Za-z0-9-]+$/.test(id))return;
  const db=await database();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Não foi possível remover o anexo.'));});
 }
 window.AcademyPreviewMedia={save,get,remove};
 const player=document.getElementById('player'),box=player?.parentElement;
 if(!player||!box)return;
 const localVideo=document.createElement('video');localVideo.id='previewLocalVideo';localVideo.className='preview-local-video';localVideo.controls=true;localVideo.playsInline=true;localVideo.hidden=true;box.append(localVideo);
 let videoId='',videoUrl='',supportId='',supportUrl='';
 const release=url=>{if(url)URL.revokeObjectURL(url);};
 const lessonNow=()=>selectedCourse?.lessons?.[selectedLesson]||null;
 async function renderAttachments(){
  const lesson=lessonNow(),meta=lesson?.previewVideo,material=lesson?.previewMaterial;
  if(meta?.id&&meta.id!==videoId){release(videoUrl);videoId=meta.id;videoUrl='';localVideo.pause?.();localVideo.removeAttribute('src');player.hidden=true;localVideo.hidden=false;
   const expected=meta.id;try{const file=await get(expected);if(!file){$('lessonVideoStatus').hidden=false;$('lessonVideoStatus').textContent='Este vídeo de teste não está mais salvo neste navegador.';$('markDone').disabled=true;return;}if(lessonNow()?.previewVideo?.id!==expected){release(file.url);return;}videoUrl=file.url;localVideo.src=file.url;localVideo.load?.();$('lessonVideoStatus').hidden=true;$('markDone').disabled=false;}catch(error){$('lessonVideoStatus').hidden=false;$('lessonVideoStatus').textContent=error.message||'Não foi possível abrir o vídeo anexado.';$('markDone').disabled=true;}
  }else if(!meta?.id){release(videoUrl);videoUrl='';videoId='';localVideo.pause?.();localVideo.removeAttribute('src');localVideo.hidden=true;player.hidden=false;}
  if(material?.id){
   if(material.id!==supportId){release(supportUrl);supportId=material.id;supportUrl='';const expected=material.id;try{const file=await get(expected);if(!file){$('lessonMaterial').hidden=false;$('lessonMaterial').textContent='Este material de teste não está mais salvo neste navegador.';return;}if(lessonNow()?.previewMaterial?.id!==expected){release(file.url);return;}supportUrl=file.url;}catch(error){$('lessonMaterial').hidden=false;$('lessonMaterial').textContent='Não foi possível abrir o material anexado.';return;}}
   if(supportUrl){const link=document.createElement('a');link.dataset.previewMaterial='true';link.className='buttonLink outline';link.href=supportUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='↗ Abrir material: '+material.name;$('lessonMaterial').append(link);$('lessonMaterial').hidden=false;}
  }else{release(supportUrl);supportUrl='';supportId='';}
 }
 const baseRender=renderClass;
 renderClass=function(){baseRender();renderAttachments();};
 window.addEventListener('beforeunload',()=>{release(videoUrl);release(supportUrl);});
})();
