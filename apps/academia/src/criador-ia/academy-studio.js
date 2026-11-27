/* CONTREM Studio · Academias editor. Preview saves in user-scoped browser storage only. */
(async()=>{
 'use strict';
 const cloud=await window.CONTREM_AUTHORING_BOOT;
 if(!cloud)return;
 const core=window.CONTREM_STUDIO_ACADEMY_CORE;
 if(!core)return;
 const byId=id=>document.getElementById(id);
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const localOnly=location.hostname!=='contrem.vercel.app'||window.CONTREM_ACADEMY_CONFIG?.preview===true;
 const localKey='contrem-studio-academias-preview:'+cloud.userId;
 const courseRoot=byId('root');
 const tabs=document.createElement('nav');
 tabs.id='studioModeNav';tabs.setAttribute('aria-label','Tipo de conteúdo no Studio');
 tabs.innerHTML='<button type="button" class="selected" data-studio-mode="courses" aria-pressed="true">Treinamentos</button><button type="button" data-studio-mode="academies" aria-pressed="false">Academias</button>';
 courseRoot.before(tabs);
 const root=document.createElement('section');root.id='studioAcademiesView';root.hidden=true;
 courseRoot.after(root);
 const alert=message=>{const t=byId('studioAcademyMessage');if(t){t.textContent=message;t.hidden=!message;}else{const toast=byId('toast');if(toast){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3600);}}};
 let mode='courses',records=[],editing=null,baseline='',loading=false;
 function fromLocal(){
  try{const data=JSON.parse(localStorage.getItem(localKey)||'[]');
   return Array.isArray(data)?data.filter(item=>item&&typeof item.id==='string'&&item.definition&&typeof item.definition==='object').slice(0,60):[];
  }catch{return [];}
 }
 function localSave(){localStorage.setItem(localKey,JSON.stringify(records.slice(0,60)));}
 const state=()=>editing?.definition;
 const dirty=()=>!!editing&&JSON.stringify(editing.definition)!==baseline;
 const isReadOnly=()=>!localOnly&&editing?.status==='published'&&cloud.role!=='admin';
 const btn=(name,action,cls='secondary')=>'<button type="button" class="'+cls+'" data-academy-action="'+action+'">'+name+'</button>';
 async function api(action,body={}){
  if(localOnly)throw Error('A prévia não grava dados no banco conectado.');
  const {data,error}=await cloud.client.functions.invoke('academy-programs',{body:{action,...body}});
  if(error){
   let detail='';try{const result=await error.context?.json?.();detail=result?.error||'';}catch{}
   throw Error(detail||error.message||'Não foi possível concluir a operação.');
  }
  if(data?.error)throw Error(data.error);
  return data;
 }
 async function load(){
  if(localOnly){records=fromLocal();return;}
  const response=await api('list');records=Array.isArray(response.programs)?response.programs:[];
 }
 const formatDate=value=>{
  const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString('pt-BR');
 };
 function setMode(next){
  if(mode===next)return;
  if(mode==='academies'&&dirty()&&!confirm('Existem alterações não salvas na Academia. Deseja sair sem salvar?'))return;
  mode=next;
  for(const el of tabs.querySelectorAll('button')){const active=el.dataset.studioMode===mode;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));}
  root.hidden=mode!=='academies';courseRoot.hidden=mode==='academies';
  if(mode==='academies'){
   renderList();
   if(!loading)load().then(()=>{
    const params=new URLSearchParams(location.search);
    const id=params.get('academyId')||params.get('academyCopy');
    if(!id){if(!editing)renderList();return;}
    const row=records.find(p=>p.id===id);
    if(!row){alert('Academia não encontrada nesta conta. Volte a Treinamentos e atualize a lista.');return;}
    if(params.has('academyCopy')){
     const cloned=core.fromJSON({academy:row.definition});
     cloned.definition.title+=' (cópia)';
     startEditing(cloned);
    }else startEditing(row);
    params.delete('academyId');params.delete('academyCopy');
    history.replaceState(null,'',location.pathname+'?'+params.toString());
   }).catch(e=>alert(e.message));
  }
  requestAnimationFrame(()=>root.scrollIntoView({block:'start',behavior:'smooth'}));
 }
 tabs.addEventListener('click',e=>{const b=e.target.closest('[data-studio-mode]');if(b)setMode(b.dataset.studioMode);});
 function stats(){
  return '<div class="studio-academy-stats"><span><strong>'+records.length+'</strong> Academias</span><span><strong>'+records.filter(p=>p.status==='published').length+'</strong> Publicadas</span><span><strong>'+records.filter(p=>p.status!=='published').length+'</strong> Rascunhos</span></div>';
 }
 function renderList(){
  editing=null;baseline='';
  root.innerHTML='<div class="studio-academy-head"><div><div class="eyebrow">CONTREM STUDIO · AUTORIA</div><h1>Criar Academia</h1><p>Construa uma formação com etapas, módulos e aulas. Para encontrar ou gerenciar Academias existentes, use Treinamentos.</p></div><div class="studio-academy-actions">'+btn('+ Nova Academia','new','primary')+btn('Importar JSON','import')+'</div></div>'+
   '<div class="studio-academy-note">'+(localOnly?'Prévia isolada: os rascunhos são salvos somente neste navegador.':'A criação é salva como rascunho. Publicação, matrícula e liberação ficam no gerenciamento da Academia em Treinamentos.')+'</div>'+
   '<div id="studioAcademyMessage" class="studio-academy-message" role="status" hidden></div>'+
   '<div class="studio-academy-empty"><h3>Como deseja começar?</h3><p>Crie uma Academia do zero ou importe um projeto JSON pronto. Para editar uma Academia já cadastrada, pesquise por “Academia” na aba Treinamentos.</p><div class="studio-academy-actions">'+btn('Criar do zero','new','primary')+btn('Importar projeto JSON','import')+'</div><p><a class="studio-link" href="samples/contrem-academia-modelo.json" download>Baixar modelo JSON de Academia</a></p></div>'+
   '<input id="studioAcademyImport" type="file" accept=".json,application/json" hidden>';
 }
 function startEditing(row){
  editing={id:row.id,revision:row.revision??null,status:row.status||'draft',definition:core.clone(row.definition)};
  baseline=JSON.stringify(editing.definition);renderEditor();
 }
 function itemField(label,value,owner,recordId,key,max=180,type='text'){
  const attr=owner==='root'?'data-root-field="'+key+'"':owner==='stage'?'data-stage-id="'+esc(recordId)+'" data-stage-field="'+key+'"':owner==='module'?'data-module-id="'+esc(recordId)+'" data-module-field="'+key+'"':'data-lesson-id="'+esc(recordId)+'" data-lesson-field="'+key+'"';
  if(type==='textarea')return '<label class="studio-academy-field"><span>'+label+'</span><textarea '+attr+' maxlength="'+max+'">'+esc(value||'')+'</textarea></label>';
  if(type==='checkbox')return '<label class="studio-academy-check"><input type="checkbox" '+attr+' '+(value?'checked':'')+'><span>'+label+'</span></label>';
  return '<label class="studio-academy-field"><span>'+label+'</span><input '+attr+' type="'+type+'" '+(type==='number'?'min="0" max="'+max+'"':'maxlength="'+max+'"')+' value="'+esc(value??'')+'"></label>';
 }
 function moduleHtml(m){
  const lessons=Array.isArray(m.lessons)?m.lessons:[];
  return '<details class="studio-academy-module"><summary><strong>'+esc(m.name)+'</strong><span>'+lessons.length+' aula(s) · '+(m.moduleEnabled?'Ativo':'Inativo')+'</span></summary><div class="studio-academy-module-body">'+
   '<div class="studio-academy-fields">'+itemField('Nome do módulo',m.name,'module',m.id,'name',180)+itemField('Carga horária (h)',m.hours,'module',m.id,'hours',1000,'number')+'</div>'+
   itemField('Descrição do módulo',m.description,'module',m.id,'description',1200,'textarea')+
   '<div class="studio-academy-module-state">Situação atual: <strong>'+(m.moduleEnabled?'Ativo':'Inativo')+'</strong>. A liberação de módulos é gerenciada pelo ADM Master no painel Academias.</div>'+
   '<div class="studio-academy-section-head"><h4>Aulas</h4>'+btn('+ Adicionar aula','add-lesson')+'</div>'+
   (lessons.length?'<div class="studio-academy-lesson-list">'+lessons.map((l,i)=>'<div class="studio-academy-lesson"><div class="studio-academy-lesson-order">'+(i+1)+'</div><div class="studio-academy-lesson-fields">'+itemField('Nome da aula',l.name,'lesson',l.id,'name',180)+itemField('Duração (min)',l.minutes,'lesson',l.id,'minutes',600,'number')+itemField('Descrição da aula',l.description,'lesson',l.id,'description',1200,'textarea')+'</div><button type="button" class="danger" data-academy-action="remove-lesson" data-id="'+esc(l.id)+'">Remover</button></div>').join('')+'</div>':'<p class="small muted">Este módulo ainda não tem aulas. Você pode salvar a estrutura e adicionar depois.</p>')+
   (lessons.some(l=>!!l.videoId)?'<p class="small muted">Vídeos cadastrados são preservados. Gerencie os arquivos de vídeo no painel Academias.</p>':'')+
   '<div class="studio-academy-danger-row"><button type="button" class="danger" data-academy-action="remove-module">Remover módulo</button></div></div></details>';
 }
 function stageHtml(s,index){
  const mods=(s.moduleIds||[]).map(id=>state().modules.find(m=>m.id===id)).filter(Boolean);
  return '<article class="studio-academy-stage" data-stage-container="'+esc(s.id)+'"><div class="studio-academy-stage-header"><h3>Etapa '+(index+1)+'</h3><button type="button" class="danger" data-academy-action="remove-stage">Remover etapa</button></div>'+
   '<div class="studio-academy-fields">'+itemField('Nome da etapa',s.title,'stage',s.id,'title',120)+itemField('Título do cartão',s.cardTitle,'stage',s.id,'cardTitle',150)+'</div>'+
   itemField('Descrição do cartão',s.cardDescription,'stage',s.id,'cardDescription',320,'textarea')+
   '<div class="studio-academy-module-heading"><h4>Módulos da etapa</h4>'+btn('+ Adicionar módulo','add-module')+'</div>'+
   (mods.length?mods.map(moduleHtml).join(''):'<div class="studio-academy-hint">Adicione um módulo para organizar as aulas desta etapa.</div>')+
   '</article>';
 }
 function renderEditor(){
  if(!editing)return;
  const d=state(),readonly=isReadOnly();
  root.innerHTML='<div class="studio-academy-head"><div><button type="button" class="studio-academy-back" data-academy-action="back">← Voltar à biblioteca</button><div class="eyebrow">CONSTRUTOR DE ACADEMIAS</div><h1>'+esc(d.title||'Nova Academia')+'</h1><p>Defina a apresentação, organize as etapas e prepare as aulas.</p></div><div class="studio-academy-actions">'+btn('Exportar JSON','export')+'<button type="button" class="primary" data-academy-action="save" '+(readonly?'disabled':'')+'>Salvar rascunho</button></div></div>'+
   '<div class="studio-academy-note">'+(localOnly?'Ambiente de teste: salvar cria uma cópia apenas neste navegador. Importe ou exporte JSON sem alterar o sistema em produção.':readonly?'Esta Academia está publicada. Apenas o ADM Master pode alterar o conteúdo.':'Salve a estrutura como rascunho. Somente o ADM Master publica e libera módulos pelo gerenciamento em Treinamentos.')+'</div>'+
   '<div id="studioAcademyMessage" class="studio-academy-message" role="status" hidden></div>'+
   '<div class="studio-academy-editor"><section class="studio-academy-panel"><div class="studio-academy-section-head"><h2>1. Identificação</h2><span class="studio-state">'+esc(editing.status==='published'?'Publicada':'Rascunho')+'</span></div>'+
   '<div class="studio-academy-fields">'+itemField('Nome da Academia',d.title,'root','','title',180)+itemField('Público-alvo',d.audience,'root','','audience',600)+'</div>'+
   itemField('Descrição da formação',d.description,'root','','description',4000,'textarea')+
   '<div class="studio-academy-fields">'+itemField('Título de apresentação',d.heroTitle,'root','','heroTitle',180)+itemField('Destaque do título',d.heroHighlight,'root','','heroHighlight',80)+'</div>'+
   itemField('Chamada inicial',d.heroKicker,'root','','heroKicker',160)+
   itemField('Texto de apresentação',d.heroDescription,'root','','heroDescription',700,'textarea')+
   itemField('Objetivos de aprendizagem',d.objectives,'root','','objectives',2000,'textarea')+
   '<div class="studio-academy-fields">'+itemField('Chamada das etapas',d.stageHeading,'root','','stageHeading',150)+itemField('Imagem de capa (URL HTTPS, opcional)',d.cover?.startsWith('data:')?'':d.cover,'root','','cover',900000)+'</div>'+
   itemField('Habilitar certificado ao final da Academia',d.certificateEnabled,'root','','certificateEnabled',0,'checkbox')+
   '</section><section class="studio-academy-panel"><div class="studio-academy-section-head"><div><h2>2. Etapas, módulos e aulas</h2><p>Todos os módulos novos começam inativos. É possível estruturar a formação sem vídeos.</p></div>'+btn('+ Nova etapa','add-stage')+'</div>'+
   d.stages.map(stageHtml).join('')+'</section>'+
   '<aside class="studio-academy-panel studio-academy-summary"><h3>Resumo da formação</h3><p><b>'+d.stages.length+'</b> etapas</p><p><b>'+d.modules.length+'</b> módulos</p><p><b>'+d.modules.reduce((n,m)=>n+(m.lessons?.length||0),0)+'</b> aulas</p><hr><div class="studio-academy-note">Salve a estrutura e use Gerenciar na aba Treinamentos para publicar ou liberar módulos.</div>'+
   (localOnly?'':btn('Gerenciar em Treinamentos','open-manager'))+'</aside></div>';
  if(readonly)root.querySelectorAll('.studio-academy-field input,.studio-academy-field textarea,.studio-academy-check input,[data-academy-action^="add-"],[data-academy-action^="remove-"]').forEach(el=>el.disabled=true);
 }
 function fieldUpdate(el){
  if(!editing)return;
  const d=state(),key=el.dataset.rootField||el.dataset.stageField||el.dataset.moduleField||el.dataset.lessonField;
  if(!key)return;
  let target=d;
  if(el.dataset.stageId)target=d.stages.find(s=>s.id===el.dataset.stageId);
  if(el.dataset.moduleId)target=d.modules.find(m=>m.id===el.dataset.moduleId);
  if(el.dataset.lessonId)target=d.modules.flatMap(m=>m.lessons||[]).find(l=>l.id===el.dataset.lessonId);
  if(!target)return;
  const value=el.type==='checkbox'?el.checked:el.type==='number'?Math.max(0,Math.min(key==='minutes'?600:1000,Number(el.value)||0)):el.value;
  if(key==='cover'&&value&&!(/^https:\/\//i.test(value)||/^data:image\/(?:jpeg|png|webp);base64,/i.test(value))){alert('A capa precisa de um endereço HTTPS válido.');return;}
  target[key]=value;
 }
 root.addEventListener('input',event=>fieldUpdate(event.target));
 root.addEventListener('change',event=>fieldUpdate(event.target));
 root.addEventListener('click',async event=>{
  const button=event.target.closest('[data-academy-action]');if(!button||loading)return;
  const action=button.dataset.academyAction;
  const stageEl=button.closest('[data-stage-container]'),stageId=stageEl?.dataset.stageContainer;
  const moduleEl=button.closest('.studio-academy-module');
  const moduleIndex=moduleEl&&stageEl?Array.from(stageEl.querySelectorAll('.studio-academy-module')).indexOf(moduleEl):-1;
  const stage=state()?.stages.find(s=>s.id===stageId);
  const moduleId=stage?.moduleIds?.[moduleIndex],mod=state()?.modules.find(m=>m.id===moduleId);
  if(action==='import'){byId('studioAcademyImport')?.click();return;}
  if(action==='new'){
   if(dirty()&&!confirm('Descartar as alterações não salvas?'))return;
   const name=prompt('Nome da nova Academia:','Nova Academia');if(!name?.trim())return;
   startEditing(core.create(name));return;
  }
  if(action==='back'){if(dirty()&&!confirm('Sair sem salvar as últimas alterações?'))return;renderList();return;}
  if(action==='open'){const row=records.find(x=>x.id===button.dataset.id);if(row)startEditing(row);return;}
  if(action==='refresh'){try{await load();renderList();}catch(e){alert(e.message)}return;}
  if(action==='export'){
   try{const payload=core.downloadObject(state());const raw=JSON.stringify(payload,null,2);
    const blob=new Blob([raw],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='CONTREM-Academia-'+core.slug(state().title)+'.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
   }catch(e){alert(e.message)}return;
  }
  if(action==='open-manager'){window.parent.postMessage({type:'contrem:studio-open-trainings'},location.origin);return;}
  if(isReadOnly()){alert('Somente o ADM Master altera Academias publicadas.');return;}
  if(action==='add-stage'){
   if(state().stages.length>=15){alert('Limite de 15 etapas.');return;}
   state().stages.push(core.stage('Nova etapa'));renderEditor();return;
  }
  if(action==='remove-stage'){
   if(!stage)return;
   if(state().stages.length<=1){alert('É necessário manter pelo menos uma etapa.');return;}
   if(!confirm('Remover esta etapa e todos os seus módulos e aulas?'))return;
   const ids=new Set(stage.moduleIds);state().modules=state().modules.filter(m=>!ids.has(m.id));
   state().stages=state().stages.filter(s=>s.id!==stageId);renderEditor();return;
  }
  if(action==='add-module'){
   if(!stage)return;if(state().modules.length>=90){alert('Limite de 90 módulos.');return;}
   const m=core.module();stage.moduleIds.push(m.id);state().modules.push(m);renderEditor();return;
  }
  if(action==='remove-module'){
   if(!stage||!mod||!confirm('Remover este módulo e suas aulas?'))return;
   stage.moduleIds=stage.moduleIds.filter(id=>id!==mod.id);
   state().modules=state().modules.filter(m=>m.id!==mod.id);renderEditor();return;
  }
  if(action==='add-lesson'){
   if(!mod)return;if(mod.lessons.length>=150){alert('Limite de 150 aulas por módulo.');return;}
   mod.lessons.push(core.lesson());renderEditor();return;
  }
  if(action==='remove-lesson'){
   if(!mod||!confirm('Remover esta aula?'))return;
   mod.lessons=mod.lessons.filter(l=>l.id!==button.dataset.id);renderEditor();return;
  }
  if(action==='save'){
   try{
    core.validate(state());loading=true;button.disabled=true;
    if(localOnly){
     const now=new Date().toISOString();
     const record={id:editing.id,title:state().title,status:'draft',revision:(editing.revision||0)+1,updated_at:now,definition:core.clone(state())};
     records=[record,...records.filter(x=>x.id!==record.id)];localSave();editing.revision=record.revision;
     baseline=JSON.stringify(state());alert('Rascunho salvo neste navegador. Nenhum dado foi alterado em produção.');
    }else{
     const result=await api('save',{id:editing.id,revision:editing.revision,definition:state()});
     editing.revision=result.program?.revision??editing.revision;editing.status=result.program?.status||'draft';
     baseline=JSON.stringify(state());await load();
     window.parent.postMessage({type:'contrem:studio-academy-saved',academyId:editing.id},location.origin);
     alert('Rascunho salvo na sua conta. Acesse Treinamentos para gerenciar a publicação.');
    }
   }catch(e){alert(e.message)}finally{loading=false;button.disabled=false;}return;
  }
 });
 root.addEventListener('change',async event=>{
  const file=event.target.closest('#studioAcademyImport');if(!file?.files?.[0])return;
  try{
   if(dirty()&&!confirm('Substituir a Academia não salva pelo JSON importado?'))return;
   const doc=file.files[0];if(doc.size>512000)throw Error('Use um JSON de até 500 KB.');
   const raw=JSON.parse(await doc.text()),draft=core.fromJSON(raw);startEditing(draft);
   alert('JSON importado! Revise as etapas e os módulos. Todos os módulos começam inativos.');
  }catch(e){alert('Importação não concluída: '+e.message);}
  finally{file.value='';}
 });
 window.addEventListener('beforeunload',event=>{if(mode==='academies'&&dirty()){event.preventDefault();event.returnValue='';}});
 if(new URLSearchParams(location.search).get('studioMode')==='academies')setMode('academies');
})();
