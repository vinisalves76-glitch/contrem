// Local-only supporting materials for the Academy ADM preview.
(() => {
 'use strict';
 if(!window.CONTREM_ACADEMY_CONFIG?.preview||!window.indexedDB)return;
 const DB='contrem-adm-preview-media-v1',STORE='attachments',MAX_FILES=20;
 const TYPES={pdf:['application/pdf'],png:['image/png'],jpg:['image/jpeg'],jpeg:['image/jpeg'],webp:['image/webp'],gif:['image/gif'],doc:['application/msword'],docx:['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],odt:['application/vnd.oasis.opendocument.text'],xls:['application/vnd.ms-excel'],xlsx:['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],ods:['application/vnd.oasis.opendocument.spreadsheet'],ppt:['application/vnd.ms-powerpoint'],pptx:['application/vnd.openxmlformats-officedocument.presentationml.presentation'],odp:['application/vnd.oasis.opendocument.presentation'],txt:['text/plain'],epub:['application/epub+zip'],mp4:['video/mp4'],webm:['video/webm']};
 let opening;
 const safeName=value=>{const name=String(value||'arquivo').replace(/[\x00-\x1f\x7f/\\:]/g,'_')||'arquivo';return name.length<=200?name:name.slice(0,180)+name.slice(name.lastIndexOf('.')).slice(0,20);};
 function validate(file,kind='support',name=file?.name){
  if(!(file instanceof Blob)||!file.size)throw Error('Selecione um arquivo válido, com conteúdo.');
  if(kind!=='support')throw Error('Vídeos das aulas devem ser cadastrados pelo link do Mux.');
  const extension=String(name||'').split('.').pop().toLowerCase(),types=Object.hasOwn(TYPES,extension)?TYPES[extension]:null;
  if(!types)throw Error('Formato não permitido. Use PDF, documentos, apresentações, planilhas, EPUB, imagens ou vídeos MP4/WebM.');
  const mime=String(file.type||'').toLowerCase();
  if(mime&&mime!=='application/octet-stream'&&!types.includes(mime))throw Error('O tipo do arquivo não corresponde à extensão permitida.');
  const max=['mp4','webm'].includes(extension)?500:50;
  if(file.size>max*1024*1024)throw Error('Este arquivo excede o limite de '+max+' MB.');
  return {name:safeName(name),type:types[0],size:file.size};
 }
 function materialsFor(lesson){
  const values=Array.isArray(lesson?.previewMaterials)?lesson.previewMaterials:lesson?.previewMaterial?[lesson.previewMaterial]:[];
  const seen=new Set();return values.filter(item=>item&&typeof item.id==='string'&&!seen.has(item.id)&&(seen.add(item.id),true)).slice(0,MAX_FILES);
 }
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
  const metadata=validate(file,kind);
  const record={id:'attachment-'+crypto.randomUUID(),kind,...metadata,blob:file,createdAt:Date.now()};
  const db=await database();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Não foi possível salvar o anexo neste navegador.'));tx.onabort=()=>reject(tx.error||Error('O navegador não tem espaço disponível para este anexo.'));});
  return {id:record.id,kind:record.kind,name:record.name,type:record.type,size:record.size};
 }
 async function get(id){
  if(typeof id!=='string'||!/^attachment-[A-Za-z0-9-]+$/.test(id))return null;
  const db=await database(),record=await new Promise((resolve,reject)=>{const request=db.transaction(STORE,'readonly').objectStore(STORE).get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error||Error('Não foi possível abrir o anexo.'));});
  if(!record?.blob)return null;
  // Recheck old records before offering downloads; do not render file content inline.
  const metadata=validate(record.blob,'support',record.name);
  return {id:record.id,kind:record.kind,...metadata,url:URL.createObjectURL(record.blob)};
 }
 async function remove(id){
  if(typeof id!=='string'||!/^attachment-[A-Za-z0-9-]+$/.test(id))return;
  const db=await database();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Não foi possível remover o anexo.'));});
 }
 window.AcademyPreviewMedia={save,get,remove,validate,materialsFor,MAX_FILES};
 if(!document.getElementById('player'))return;
 let generation=0,urls=[];
 const release=url=>{if(url)URL.revokeObjectURL(url);};
 function clearDownloads(){generation++;urls.forEach(release);urls=[];document.querySelector('[data-preview-materials]')?.remove();}
 const lessonNow=()=>selectedCourse?.lessons?.[selectedLesson]||null;
 async function renderAttachments(){
  clearDownloads();const expected=generation,lesson=lessonNow(),materials=materialsFor(lesson);
  if(!materials.length)return;
  const holder=document.createElement('div');holder.dataset.previewMaterials='true';
  const title=document.createElement('h3');title.textContent='Materiais de apoio';holder.append(title);
  const note=document.createElement('p');note.className='muted';note.textContent='Anexos de teste salvos somente neste navegador. Clique em Baixar para guardar uma cópia.';holder.append(note);
  const list=document.createElement('ul');holder.append(list);
  $('lessonMaterial').append(holder);$('lessonMaterial').hidden=false;
  await Promise.all(materials.map(async material=>{
   // Insert placeholders first so asynchronous reads preserve the author's order.
   const row=document.createElement('li');row.textContent=safeName(material.name)+' · Carregando…';list.append(row);
   let file;
   try{file=await get(material.id);}catch{file=null;}
   if(expected!==generation||lessonNow()!==lesson){release(file?.url);return;}
   row.textContent='';
   if(!file){row.textContent=safeName(material.name)+' · Arquivo indisponível neste navegador. Solicite o anexo ao administrador desta prévia.';return;}
   urls.push(file.url);
   const link=document.createElement('a');link.dataset.previewMaterial='true';link.className='buttonLink outline';link.href=file.url;link.download=file.name;link.textContent='Baixar '+file.name+' ('+(file.size/1024/1024).toFixed(1)+' MB)';row.append(link);
  }));
 }
 const baseRender=renderClass;renderClass=function(){baseRender();renderAttachments();};
 const baseShow=show;show=function(id){if(id!=='classView')clearDownloads();return baseShow(id);};
 window.addEventListener('beforeunload',clearDownloads);
})();
