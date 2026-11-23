// Local-only supporting materials for the Academy ADM preview.
(() => {
 'use strict';
 const connected=window.CONTREM_ACADEMY_CONFIG?.mode==='connected' && window.CONTREM_ACADEMY_CONFIG?.preview===false;
 if(!connected&&!window.CONTREM_ACADEMY_CONFIG?.preview)return;
 const remote=()=>window.AcademyCloudMediaClient?.storage?.from('academy-materials');
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
  const max=connected?50:['mp4','webm'].includes(extension)?500:50;
  if(file.size>max*1024*1024)throw Error('Este arquivo excede o limite de '+max+' MB.');
  return {name:safeName(name),type:types[0],size:file.size};
 }
 function materialsFor(lesson){
  const values=Array.isArray(lesson?.previewMaterials)?lesson.previewMaterials:lesson?.previewMaterial?[lesson.previewMaterial]:[];
  const seen=new Set();return values.filter(item=>item&&typeof item.id==='string'&&!seen.has(item.id)&&(seen.add(item.id),true)).slice(0,MAX_FILES);
 }
 function supportLinksFor(lesson){
  const values=[...(Array.isArray(lesson?.supportLinks)?lesson.supportLinks:[]),...(lesson?.materialUrl?[{title:lesson.materialTitle||'Material de apoio',url:lesson.materialUrl}]:[])],seen=new Set(),links=[];
  for(const value of values){
   if(!value||typeof value.url!=='string'||value.url.length>2000)continue;
   try{const url=new URL(value.url.trim());if(url.protocol!=='https:'||url.username||url.password||!url.hostname||['localhost','127.0.0.1'].includes(url.hostname)||seen.has(url.href))continue;seen.add(url.href);links.push({title:(String(value.title||'Material de apoio').trim().slice(0,150)||'Material de apoio'),url:url.href});}catch{}
   if(links.length===20)break;
  }return links;
 }
 function database(){
  if(!window.indexedDB)return Promise.reject(Error('Armazenamento local indisponível neste navegador.'));
  if(opening)return opening;
  opening=new Promise((resolve,reject)=>{
   const request=indexedDB.open(DB,1);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'});};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||Error('Não foi possível abrir o armazenamento local de anexos.'));
  });
  return opening;
 }
 async function save(file,kind,academyFolder=''){
  const metadata=validate(file,kind);
  if(connected){
   if(!['admin','content_admin'].includes(window.AcademySession?.role))throw Error('Somente a equipe da Academia pode anexar materiais.');
   // Reutiliza a MESMA validação e o MESMO bucket privado do construtor de cursos.
   // O diretório da Academia é isolado do catálogo de Cursos Avulsos.
   if(academyFolder&&!/^academy-asset-[A-Za-z0-9_-]{3,360}$/.test(academyFolder))
    throw Error('Diretório de materiais da Academia inválido.');
   const courseId=academyFolder||document.getElementById('editId')?.value||'';
   if(!/^[A-Za-z0-9_-]+$/.test(courseId))throw Error('Salve o curso antes de enviar materiais.');
   const storage=remote();if(!storage)throw Error('Armazenamento privado não conectado. Faça login novamente.');
   const id=courseId+'/attachment-'+crypto.randomUUID();
   const uploaded=await storage.upload(id,file,{contentType:metadata.type,upsert:false,cacheControl:'3600'});
   if(uploaded.error)throw Error('Não foi possível enviar o material privado: '+uploaded.error.message);
   return {id,kind:'support',...metadata};
  }
  const record={id:'attachment-'+crypto.randomUUID(),kind,...metadata,blob:file,createdAt:Date.now()};
  const db=await database();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Não foi possível salvar o anexo neste navegador.'));tx.onabort=()=>reject(tx.error||Error('O navegador não tem espaço disponível para este anexo.'));});
  return {id:record.id,kind:record.kind,name:record.name,type:record.type,size:record.size};
 }
 async function get(id){
  if(connected){
   if(typeof id!=='string'||!/^[A-Za-z0-9_-]+\/attachment-[0-9a-f-]{36}$/i.test(id)||!window.AcademySession)return null;
   const storage=remote();if(!storage)return null;
   const signed=await storage.createSignedUrl(id,120,{download:false});
   if(signed.error||!signed.data?.signedUrl)return null;
   return {id,name:'Material de apoio',url:signed.data.signedUrl,size:0};
  }
  if(typeof id!=='string'||!/^attachment-[A-Za-z0-9-]+$/.test(id))return null;
  const db=await database(),record=await new Promise((resolve,reject)=>{const request=db.transaction(STORE,'readonly').objectStore(STORE).get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(request.error||Error('Não foi possível abrir o anexo.'));});
  if(!record?.blob)return null;
  // Recheck old records before offering downloads; do not render file content inline.
  const metadata=validate(record.blob,'support',record.name);
  return {id:record.id,kind:record.kind,...metadata,url:URL.createObjectURL(record.blob)};
 }
 async function remove(id){
  if(connected){
   if(window.AcademySession?.role!=='admin'||typeof id!=='string'||!/^[A-Za-z0-9_-]+\/attachment-[0-9a-f-]{36}$/i.test(id))return;
   const storage=remote();if(!storage)throw Error('Armazenamento privado indisponível.');
   const deleted=await storage.remove([id]);if(deleted.error)throw deleted.error;return;
  }
  if(typeof id!=='string'||!/^attachment-[A-Za-z0-9-]+$/.test(id))return;
  const db=await database();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||Error('Não foi possível remover o anexo.'));});
 }
 window.AcademyPreviewMedia={save,get,remove,validate,materialsFor,supportLinksFor,MAX_FILES};
 if(!document.getElementById('player'))return;
 let generation=0,urls=[];
 const release=url=>{if(url)URL.revokeObjectURL(url);};
 function clearDownloads(){generation++;urls.forEach(release);urls=[];document.querySelector('[data-preview-materials]')?.remove();}
 const lessonNow=()=>selectedCourse?.lessons?.[selectedLesson]||null;
 async function renderAttachments(){
  clearDownloads();const expected=generation,course=selectedCourse,lesson=lessonNow();
  $('lessonMaterial').textContent='';$('lessonMaterial').hidden=!course;
  if(!course)return;
  const holder=document.createElement('div');holder.dataset.previewMaterials='true';
  const note=document.createElement('p');note.className='muted';note.textContent=connected?'Materiais privados da Academia: acesso conforme sua matrícula.':'Baixe os arquivos ou abra os links externos. Os anexos desta prévia ficam salvos somente neste navegador.';holder.append(note);
  $('lessonMaterial').append(holder);
  async function renderGroup(source,label,scope){
   const materials=materialsFor(source),links=supportLinksFor(source),group=document.createElement('section');group.dataset.materialScope=scope;
   const title=document.createElement('h3');title.textContent=label;group.append(title);holder.append(group);
   const list=document.createElement('ul');group.append(list);
   if(!materials.length&&!links.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Nenhum material de apoio cadastrado.';group.append(empty);return;}
   links.forEach(material=>{const row=document.createElement('li'),link=document.createElement('a');link.className='buttonLink outline';link.dataset.supportLink='true';link.href=material.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Abrir link: '+material.title;row.append(link);list.append(row);});
   await Promise.all(materials.map(async material=>{
    const row=document.createElement('li');row.textContent=safeName(material.name)+' · Carregando…';list.append(row);
    let file;try{file=await get(material.id);}catch{file=null;}
    if(expected!==generation||selectedCourse!==course||lessonNow()!==lesson){release(file?.url);return;}
    row.textContent='';
    if(!file){row.textContent=safeName(material.name)+' · Arquivo indisponível neste navegador. Solicite o anexo ao administrador desta prévia.';return;}
    if(!connected)urls.push(file.url);
    const link=document.createElement('a');link.dataset.previewMaterial='true';link.className='buttonLink outline';link.href=file.url;link.download=connected?material.name:file.name;link.textContent='Baixar '+material.name+' ('+(material.size/1024/1024).toFixed(1)+' MB)';row.append(link);
   }));
  }
  await Promise.all([renderGroup(course,'Materiais do curso completo','course'),renderGroup(lesson,'Materiais desta aula','lesson')]);
 }
 const baseRender=renderClass;renderClass=function(){baseRender();renderAttachments();};
 const baseShow=show;show=function(id){if(id!=='classView')clearDownloads();return baseShow(id);};
 window.addEventListener('beforeunload',clearDownloads);
})();
