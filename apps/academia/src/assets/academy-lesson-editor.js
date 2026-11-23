/* CONTREM Academia · edição completa de aulas, baseada no fluxo do Construtor de Cursos.
 * Isolada das entradas no catálogo de Cursos Avulsos. O ADM salva no serviço academy-programs.
 * Mux e materiais: reutiliza o parser de Playback ID e o armazenamento privado existentes. */
(() => {
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const copy=value=>JSON.parse(JSON.stringify(value));
 const media=()=>window.AcademyPreviewMedia;
 const root=document.createElement('section');
 root.id='connectedFullLessonEditor';
 root.className='academy-full-lesson-editor';
 root.hidden=true;
 root.setAttribute('role','dialog');
 root.setAttribute('aria-modal','true');
 root.setAttribute('aria-label','Construtor completo de aulas da Academia');
 document.body.append(root);
 let ctx=null,module=null,selected=0,tab='lessons',questionScope='lesson',dirty=false,busy=false,
  generation=0,status='',statusError=false,uncommitted=false;
 const lesson=()=>module?.lessons?.[selected]||null;
 const makeId=type=>type+'-'+crypto.randomUUID();
 const allowedUrl=value=>{
  try{const url=new URL(String(value||'').trim());return url.protocol==='https:'&&
   !url.username&&!url.password&&!['localhost','127.0.0.1'].includes(url.hostname)?url.href:'';}
  catch{return '';}
 };
 function muxId(value){
  const s=String(value||'').trim(),valid=id=>/^[A-Za-z0-9_-]{20,255}$/.test(id||'');
  if(!s)return '';
  if(valid(s))return s;
  try{
   const u=new URL(s);
   if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)return null;
   let id='';
   if(u.hostname==='player.mux.com')id=u.pathname.replace(/^\/(?:watch\/)?/,'').replace(/\/$/,'');
   else if(u.hostname==='stream.mux.com')id=u.pathname.slice(1).replace(/\.m3u8$/,'');
   return valid(id)?id:null;
  }catch{return null;}
 }
 const folder=()=>('academy-asset-'+module.id.replace(/[^A-Za-z0-9_-]/g,''));
 const setStatus=(value,error=false)=>{status=String(value||'');statusError=error;const el=root.querySelector('#academyFullStatus');if(el){el.textContent=status;el.classList.toggle('error',error);}};
 const canEdit=()=>ctx?.canEdit===true;
 const field=(label,name,value,opts='')=>'<label>'+esc(label)+'<input data-field="'+name+'" '+opts+' value="'+esc(value??'')+'" '+(!canEdit()?'disabled':'')+'></label>';
 const textarea=(label,name,value)=>'<label>'+esc(label)+'<textarea data-field="'+name+'" rows="3" '+(!canEdit()?'disabled':'')+'>'+esc(value??'')+'</textarea></label>';
 const action=(text,name,secondary=false,disabled=false)=>'<button type="button" class="'+(secondary?'outline':'primary')+'" data-action="'+name+'" '+(disabled?'disabled':'')+'>'+esc(text)+'</button>';
 function shell(){
  const l=lesson();
  root.innerHTML='<div class="academy-full-layout"><header class="academy-full-top">'+
   '<div><div class="tag">CONTREM ACADEMIA · CONSTRUTOR COMPLETO</div>'+
   '<h2>'+esc(ctx.programTitle)+' <span>/ '+esc(module.name)+'</span></h2>'+
   '<p>O mesmo fluxo de criação de aulas dos Cursos Avulsos, com vínculo exclusivo a este módulo.</p></div>'+
   '<div class="academy-full-top-actions">'+action('← Voltar aos módulos','close',true)+
   action('Salvar alterações','save',false,!canEdit()||busy)+'</div></header>'+
   '<nav class="academy-full-tabs" aria-label="Etapas do construtor">'+
   ['lessons','materials','assessment','review'].map((t,i)=>'<button type="button" data-tab="'+t+'" class="'+(tab===t?'selected':'')+'" aria-current="'+(tab===t?'page':'false')+'">'+
   ['Aulas e vídeos','Materiais do módulo','Atividades e prova','Revisão'][i]+'</button>').join('')+
   '</nav><div class="academy-full-content">'+
   '<aside class="academy-full-sidebar"><h3>Aulas do módulo</h3><div class="academy-full-list">'+
   (module.lessons.length?module.lessons.map((x,i)=>'<button type="button" data-lesson="'+i+'" class="'+(selected===i?'selected':'')+'">'+
    '<strong>'+String(i+1).padStart(2,'0')+'. '+esc(x.name||'Aula sem título')+'</strong>'+
    '<small>'+(muxId(x.url||x.videoId)?'Vídeo Mux informado':'Vídeo pendente')+
    ((x.previewMaterials?.length||x.supportLinks?.length)?' · Material de apoio':'')+'</small></button>').join(''):'<p>Nenhuma aula cadastrada.</p>')+
   '</div>'+action('+ Adicionar aula','new-lesson',true,!canEdit()||busy)+
   '<p class="academy-full-note">Aulas não podem ser excluídas. A Academia continua independente dos Cursos Avulsos.</p></aside>'+
   '<main class="academy-full-workspace">'+
   (tab==='lessons'?lessonsPanel():tab==='materials'?materialsPanel():tab==='assessment'?assessmentPanel():reviewPanel())+
   '</main></div><footer class="academy-full-footer"><p id="academyFullStatus" role="status" class="'+(statusError?'error':'')+'">'+esc(status)+'</p>'+
   '<span>'+(dirty||uncommitted?'Alterações não salvas':'Dados sincronizados após salvar')+'</span></footer></div>';
 }
 function lessonsPanel(){
  const l=lesson();
  let html='<h3>Informações do módulo</h3><p class="muted">Configure este módulo como um curso: título, descrição, carga horária e sequência de aulas.</p>'+
   '<div class="academy-full-grid">'+field('Nome do módulo','moduleName',module.name,'maxlength="180"')+
   field('Carga horária (horas)','moduleHours',module.hours,'type="number" min="0" max="1000" step="0.5"')+
   '<div class="wide">'+textarea('Descrição do módulo','moduleDescription',module.description)+'</div></div>';
  if(!l)return html+'<section class="academy-full-card"><h3>Crie a primeira aula</h3><p>Clique em Adicionar aula para definir o conteúdo e o link do vídeo Mux.</p></section>';
  html+='<section class="academy-full-card"><div class="academy-full-heading"><div><div class="tag">AULA '+String(selected+1).padStart(2,'0')+'</div><h3>Editar aula</h3></div>'+
   action('Salvar aula','save',false,!canEdit()||busy)+'</div><div class="academy-full-grid">'+
   field('Título da aula','lessonName',l.name,'maxlength="180"')+
   field('Duração prevista (minutos)','lessonMinutes',l.minutes||'','type="number" min="0" max="600" step="1"')+
   '<div class="wide">'+field('Link do vídeo Mux ou Playback ID','lessonUrl',l.url||l.videoId||'','placeholder="https://player.mux.com/SEU_PLAYBACK_ID" maxlength="400"')+
   '<small>Mesmo campo do Construtor de Cursos Avulsos. Pode deixar vazio e adicionar o vídeo depois.</small></div>'+
   '<div class="wide">'+textarea('Descrição da aula','lessonDescription',l.description)+'</div></div>'+
   '<div class="academy-full-heading"><div><h3>Materiais de apoio desta aula</h3><p>Arquivos privados e links complementares, iguais aos do construtor de cursos.</p></div></div>'+
   supportPanel(l,'lesson')+'<div class="academy-full-heading"><h3>Atividade desta aula</h3>'+
   action('Cadastrar questões','assessment-lesson',true,!canEdit()||busy)+'</div>'+
   '<p class="muted">'+(l.questions?.length||0)+' questões cadastradas nesta aula.</p></section>';
  return html;
 }
 function supportPanel(target,scope){
  const files=target.previewMaterials||[],links=target.supportLinks||[];
  return '<div class="academy-full-support"><div class="academy-full-materials-group"><h4>Arquivos para baixar</h4>'+
   '<p>PDF, apostilas, imagens, Word, PowerPoint, planilhas e outros materiais aceitos. Até 20 arquivos, 50 MB cada.</p>'+
   '<input type="file" class="academy-full-hidden-file" id="academyFullUpload" data-scope="'+scope+'" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.odt,.xls,.xlsx,.ods,.ppt,.pptx,.odp,.txt,.epub,.mp4,.webm" '+(!canEdit()||busy?'disabled':'')+'>'+
   action('+ Anexar arquivos','upload-'+scope,true,!canEdit()||busy)+'<div class="academy-full-items">'+
   (files.length?files.map((f,i)=>'<div class="academy-full-material"><span>'+esc(f.name)+' · '+(Number(f.size||0)/1048576).toFixed(1)+' MB</span>'+
    action('Remover da aula','remove-file:'+scope+':'+i,true,!canEdit()||busy)+'</div>').join(''):'<p>Nenhum arquivo anexado.</p>')+
   '</div></div><div class="academy-full-materials-group"><h4>Links externos</h4>'+
   '<p>YouTube complementar, manual, apostila ou outra fonte HTTPS.</p>'+
   '<div class="academy-full-grid">'+field('Nome do link','linkTitle','','maxlength="150" placeholder="Ex.: Manual de hidráulica"')+
   field('URL HTTPS','linkUrl','','type="url" maxlength="2000" placeholder="https://..."')+'</div>'+
   action('+ Adicionar link','add-link:'+scope,true,!canEdit()||busy)+
   '<div class="academy-full-items">'+(links.length?links.map((l,i)=>'<div class="academy-full-material"><span>'+
    esc(l.title)+' · <a href="'+esc(l.url)+'" target="_blank" rel="noopener noreferrer">Abrir link</a></span>'+
    action('Remover','remove-link:'+scope+':'+i,true,!canEdit()||busy)+'</div>').join(''):'<p>Nenhum link cadastrado.</p>')+
   '</div></div></div>';
 }
 function materialsPanel(){
  return '<h3>Materiais do módulo completo</h3><p>Adicione manuais, apostilas, apresentações e links comuns a todas as aulas do módulo.</p>'+
   supportPanel(module,'module')+'<p class="academy-full-note">Os materiais de cada aula podem ser adicionados na aba Aulas e vídeos.</p>';
 }
 const questionTarget=()=>questionScope==='module'?module:lesson();
 function assessmentPanel(){
  const scopeOptions='<select id="academyFullQuestionScope"><option value="lesson" '+(questionScope==='lesson'?'selected':'')+'>Atividade da aula selecionada</option>'+
   '<option value="module" '+(questionScope==='module'?'selected':'')+'>Prova do módulo</option></select>';
  const target=questionTarget(),questions=target?.questions||[];
  const rows=questions.map((q,i)=>'<div class="academy-full-question"><strong>'+String(i+1)+'. '+esc(q.text)+'</strong>'+
   '<small>'+esc({single:'Resposta única',multi:'Várias respostas',order:'Ordenação',match:'Relacionar'}[q.type]||q.type)+
   ' · '+q.choices.length+' alternativas</small></div>').join('')||'<p>Nenhuma questão cadastrada.</p>';
  return '<h3>Atividades e prova</h3><p>Configure atividades por aula e a prova do módulo, com gabarito, explicações e nota mínima.</p>'+
   '<label>Onde esta avaliação será usada?'+scopeOptions+'</label>'+
   '<div class="academy-full-grid">'+field('Nota mínima para aprovação (%)','passScore',module.passScore||75,'type="number" min="0" max="100" step="1"')+'</div>'+
   '<div class="academy-full-question-list"><h4>Questões cadastradas ('+questions.length+')</h4>'+rows+'</div>'+
   '<section class="academy-full-card"><h4>Nova questão</h4>'+
   '<div class="academy-full-grid"><label>Tipo<select id="academyQuestionType">'+
   '<option value="single">Uma resposta correta</option><option value="multi">Várias respostas corretas</option>'+
   '<option value="order">Ordenar sequência</option><option value="match">Relacionar colunas</option></select></label>'+
   field('Competência (opcional)','competency','','maxlength="150"')+
   '<div class="wide">'+textarea('Enunciado','questionText','')+'</div>'+
   '<div class="wide">'+textarea('Alternativas ou respostas (uma por linha)','choices','')+'</div>'+
   '<div class="wide">'+field('Gabarito (número da alternativa; para múltiplas, 1,3; para ordem, 2,1,3)','correct','','placeholder="1"')+'</div>'+
   '<div class="wide">'+textarea('Itens a relacionar (somente tipo Relacionar, um por linha)','items','')+'</div>'+
   '<div class="wide">'+textarea('Contexto ou situação-problema (opcional)','context','')+'</div>'+
   '<div class="wide">'+textarea('Explicação do gabarito (opcional)','explanation','')+'</div>'+
   '<div class="wide">'+field('Imagem de apoio HTTPS (opcional)','imageUrl','','type="url" maxlength="2000"')+'</div></div>'+
   action('+ Cadastrar questão','add-question',false,!canEdit()||busy)+
   '<p class="muted">As aulas continuam bloqueadas para progressão até a integração da conclusão verificada de vídeos e provas.</p></section>';
 }
 function reviewPanel(){
  return '<h3>Revisão do conteúdo</h3>'+
   '<div class="academy-full-review"><strong>'+esc(module.name)+'</strong><p>'+
   module.lessons.length+' aulas · '+Number(module.hours||0)+' horas · '+
   module.lessons.filter(l=>muxId(l.url||l.videoId)).length+' vídeos Mux cadastrados</p>'+
   '<p>'+module.lessons.reduce((n,l)=>n+(l.previewMaterials?.length||0),0)+' arquivos específicos · '+
   (module.previewMaterials?.length||0)+' arquivos comuns · '+
   module.lessons.reduce((n,l)=>n+(l.questions?.length||0),0)+' questões em aulas · '+
   (module.questions?.length||0)+' questões do módulo</p>'+
   '<p><strong>'+ (module.moduleEnabled?'Módulo marcado Ativo':'Módulo Inativo')+
   '</strong> — a liberação para o aluno é controlada no painel principal pelo ADM Master.</p></div>'+
   action('Salvar tudo no Supabase','save',false,!canEdit()||busy);
 }
 function collect(){
  if(!ctx||!root.hidden===false)return;
  const get=name=>root.querySelector('[data-field="'+name+'"]');
  const val=name=>get(name)?.value;
  if(tab==='lessons'){
   if(get('moduleName'))module.name=String(val('moduleName')||'').trim().slice(0,180);
   if(get('moduleHours'))module.hours=Math.max(0,Math.min(1000,Number(val('moduleHours'))||0));
   if(get('moduleDescription'))module.description=String(val('moduleDescription')||'').trim().slice(0,1200);
   const l=lesson();
   if(l&&get('lessonName')){
    l.name=String(val('lessonName')||'').trim().slice(0,180);
    l.description=String(val('lessonDescription')||'').trim().slice(0,1200);
    l.minutes=Math.max(0,Math.min(600,Number(val('lessonMinutes'))||0));
    // Não substituir um vídeo anterior por um valor inválido.
    const raw=String(val('lessonUrl')||'').trim(),id=muxId(raw);
    if(id===null)throw Error('Informe um Playback ID ou URL válida do Mux.');
    l.videoId=id;l.url=id?'https://player.mux.com/'+id:'';
   }
  }else if(tab==='assessment'){
   const pass=root.querySelector('[data-field="passScore"]');
   if(pass){
    const n=Number(pass.value);
    if(!Number.isInteger(n)||n<0||n>100)throw Error('Informe uma nota mínima de 0 a 100%.');
    module.passScore=n;
   }
  }
 }
 function reRender(){shell();if(status)setStatus(status,statusError);}
 function requireSaveFields(){
  if(!module.name.trim())throw Error('Informe o nome do módulo.');
  if(module.lessons.some(l=>!l.name.trim()))throw Error('Preencha o título de todas as aulas.');
 }
 async function save(){
  if(!ctx||!canEdit()||busy)return;
  try{
   collect();requireSaveFields();
   busy=true;setStatus('Salvando módulo, aulas e materiais no Supabase…');reRender();
   await ctx.onSave(copy(module));
   dirty=false;uncommitted=false;
   setStatus('Aulas, links Mux, anexos e atividades salvos com sucesso.');
  }catch(error){setStatus(error?.message||'Não foi possível salvar o conteúdo.',true);}
  finally{busy=false;reRender();}
 }
 function close(){
  if(!ctx||busy)return;
  if((dirty||uncommitted)&&!window.confirm('Existem alterações não salvas. Deseja descartá-las e voltar?'))return;
  generation++;root.hidden=true;document.body.classList.remove('academy-full-editor-open');
  const done=ctx.onClose;ctx=null;module=null;done?.();
 }
 function switchTab(to){
  try{collect();tab=to;status='';statusError=false;reRender();}
  catch(e){setStatus(e.message,true);}
 }
 function useLesson(index){
  try{collect();selected=index;questionScope='lesson';tab='lessons';status='';reRender();}
  catch(e){setStatus(e.message,true);}
 }
 function newLesson(){
  if(!canEdit()||busy)return;
  try{collect();if(module.lessons.length>=150)throw Error('Limite de 150 aulas por módulo.');
   module.lessons.push({id:makeId('lesson'),name:'Nova aula',description:'',minutes:0,url:'',videoId:'',
    supportLinks:[],previewMaterials:[],questions:[]});
   dirty=true;selected=module.lessons.length-1;tab='lessons';reRender();
   root.querySelector('[data-field="lessonName"]')?.focus();
  }catch(e){setStatus(e.message,true);}
 }
 function targetFor(scope){return scope==='module'?module:lesson();}
 function addLink(scope){
  const name=root.querySelector('[data-field="linkTitle"]')?.value.trim();
  const url=allowedUrl(root.querySelector('[data-field="linkUrl"]')?.value);
  if(!name||name.length>150||!url){setStatus('Preencha o nome e um link HTTPS válido.',true);return;}
  const target=targetFor(scope);if(!target)return;
  target.supportLinks=target.supportLinks||[];
  if(target.supportLinks.length>=20){setStatus('Máximo de 20 links.',true);return;}
  if(target.supportLinks.some(x=>x.url===url)){setStatus('Esse link já foi cadastrado.',true);return;}
  try{collect();target.supportLinks.push({title:name,url});dirty=true;reRender();setStatus('Link adicionado. Clique em Salvar alterações para gravá-lo.');}
  catch(e){setStatus(e.message,true);}
 }
 function removeItem(scope,kind,index){
  if(!canEdit()||busy)return;
  try{collect();
   const target=targetFor(scope),arr=target?.[kind];
   if(!Array.isArray(arr)||!arr[index])return;
   arr.splice(index,1);dirty=true;reRender();setStatus('Material desvinculado. O arquivo original permanece no armazenamento privado.');
  }catch(e){setStatus(e.message,true);}
 }
 async function upload(files,scope){
  if(!ctx||!canEdit()||busy||!files.length)return;
  const target=targetFor(scope);if(!target)return;
  const validate=media();if(!validate){setStatus('O serviço de anexos não está disponível.',true);return;}
  target.previewMaterials=target.previewMaterials||[];
  if(target.previewMaterials.length+files.length>20){setStatus('Limite de 20 arquivos por aula ou módulo.',true);return;}
  try{files.forEach(file=>validate.validate(file,'support'));}catch(e){setStatus(e.message,true);return;}
  const token=++generation,active=ctx,activeLesson=lesson()?.id;
  busy=true;setStatus('Enviando arquivos ao armazenamento privado…');reRender();
  try{
   for(const file of files){
    const metadata=await validate.save(file,'support',folder());
    if(token!==generation||ctx!==active||(scope==='lesson'&&lesson()?.id!==activeLesson))return;
    target.previewMaterials.push(metadata);dirty=true;
   }
   setStatus('Arquivos anexados. Clique em Salvar alterações para vinculá-los às aulas.');
  }catch(e){setStatus(e.message||'Falha ao enviar arquivo privado.',true);}
  finally{if(token===generation){busy=false;reRender();}}
 }
 function addQuestion(){
  if(!canEdit()||busy)return;
  try{
   collect();
   const get=name=>String(root.querySelector('[data-field="'+name+'"]')?.value||'').trim();
   const type=root.querySelector('#academyQuestionType')?.value||'single';
   const choices=get('choices').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   const items=get('items').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
   const answer=get('correct').split(/[,\s;]+/).map(x=>Number(x)-1);
   if(choices.length<2||choices.length>8||answer.some(n=>!Number.isInteger(n)||n<0||n>=choices.length))
    throw Error('Informe de 2 a 8 alternativas e gabarito numérico começando em 1.');
   if((type==='single'&&answer.length!==1)||(type!=='single'&&type!=='multi'&&answer.length!==choices.length)||
    new Set(answer).size!==answer.length)throw Error('Confira o gabarito para o tipo de atividade.');
   if(type==='match'&&items.length!==choices.length)throw Error('Use um item por alternativa para Relacionar colunas.');
   const text=get('questionText');if(!text)throw Error('Informe o enunciado da questão.');
   const image=get('imageUrl');if(image&&!allowedUrl(image))throw Error('Use uma URL HTTPS válida para a imagem.');
   const target=questionTarget();if(!target)throw Error('Adicione uma aula antes de cadastrar atividades.');
   target.questions=target.questions||[];
   if(target.questions.length>=100)throw Error('Limite de 100 questões por aula ou módulo.');
   const question={id:makeId('question'),type,text:text.slice(0,3000),choices:choices.map(x=>x.slice(0,500)),
    correct:type==='single'?answer[0]:answer,context:get('context').slice(0,4000),
    competency:get('competency').slice(0,150),explanation:get('explanation').slice(0,4000)};
   if(type==='match')question.items=items.map(x=>x.slice(0,500));
   if(image)question.imageUrl=allowedUrl(image);
   if(window.AcademyAssessment?.normalizeQuestion)window.AcademyAssessment.normalizeQuestion(question);
   target.questions.push(question);dirty=true;reRender();
   setStatus('Questão cadastrada. Clique em Salvar alterações para gravá-la.');
  }catch(e){setStatus(e.message||'Não foi possível adicionar a questão.',true);}
 }
 root.addEventListener('input',event=>{
  if(event.target.matches('input,textarea,select')){uncommitted=true;dirty=true;}
 });
 root.addEventListener('change',event=>{
  if(event.target.id==='academyFullQuestionScope'){
   try{collect();questionScope=event.target.value;uncommitted=false;reRender();}
   catch(e){setStatus(e.message,true);}
   return;
  }
  if(event.target.id==='academyFullUpload'){
   const files=Array.from(event.target.files||[]);
   // Preserva o título e descrição em edição antes do envio assíncrono.
   try{collect();void upload(files,event.target.dataset.scope);}
   catch(e){setStatus(e.message,true);}
  }
 });
 root.addEventListener('click',event=>{
  const tabButton=event.target.closest('[data-tab]');
  if(tabButton){switchTab(tabButton.dataset.tab);return;}
  const lessonButton=event.target.closest('[data-lesson]');
  if(lessonButton){useLesson(Number(lessonButton.dataset.lesson));return;}
  const button=event.target.closest('[data-action]');
  if(!button)return;
  const action=button.dataset.action;
  if(action==='close')close();
  else if(action==='save')void save();
  else if(action==='new-lesson')newLesson();
  else if(action==='assessment-lesson'){try{collect();questionScope='lesson';tab='assessment';reRender();}catch(e){setStatus(e.message,true);}}
  else if(action==='add-question')addQuestion();
  else if(action.startsWith('upload-'))root.querySelector('#academyFullUpload')?.click();
  else if(action.startsWith('add-link:'))addLink(action.split(':')[1]);
  else if(action.startsWith('remove-')){
   const [k,scope,index]=action.split(':');
   removeItem(scope,k==='remove-file'?'previewMaterials':'supportLinks',Number(index));
  }
 });
 function open(options){
  if(!options?.module||typeof options.onSave!=='function')throw Error('Selecione um módulo da Academia.');
  if(ctx)close();
  ctx=options;module=copy(options.module);
  module.lessons=Array.isArray(module.lessons)?module.lessons:[];
  module.previewMaterials=module.previewMaterials||[];
  module.supportLinks=module.supportLinks||[];
  module.questions=module.questions||[];
  for(const l of module.lessons){
   l.previewMaterials=l.previewMaterials||[];
   l.supportLinks=l.supportLinks||[];
   l.questions=l.questions||[];
  }
  selected=0;tab='lessons';questionScope='lesson';dirty=false;busy=false;uncommitted=false;status='';statusError=false;
  root.hidden=false;document.body.classList.add('academy-full-editor-open');reRender();
  root.querySelector('[data-action="close"]')?.focus();
 }
 window.CONTREM_ACADEMY_LESSON_EDITOR={open,close,isOpen:()=>!root.hidden};
})();
