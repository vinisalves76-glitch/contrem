// CONTREM Studio preview: browser-local authoring only; it never calls the cloud catalog API.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const id = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`}`;
  const labels = {text:'Texto',image:'Imagem',video:'Vídeo Mux',material:'Material de apoio',activity:'Atividade'};
  let projects = [], project = null, lessonId = null, preview = false, enteredFromLogin = false, dirty = false;
  const sessionKey = () => `contrem-academia-studio-local-v1:${window.AcademySession?.userId || 'browser-preview'}`;
  const activeLesson = () => project?.modules.flatMap(m => m.lessons).find(l => l.id === lessonId) || null;
  const markDirty = () => { dirty = true; $('studioSaveState').textContent = 'Alterações ainda não salvas'; };
  const updateSaveState = text => { dirty = false; $('studioSaveState').textContent = text || 'Rascunho salvo neste navegador'; };
  function loadProjects() {
    try {
      const data = JSON.parse(localStorage.getItem(sessionKey()) || '[]');
      projects = Array.isArray(data) ? data.filter(p => p && p.id && Array.isArray(p.modules)) : [];
    } catch { projects = []; }
  }
  function persist() {
    if (!project?.title.trim()) { $('studioSaveState').textContent = 'Dê um nome ao treinamento antes de salvar.'; $('studioTitle').focus(); return; }
    try {
      project.updatedAt = new Date().toISOString();
      if (!projects.some(p => p.id === project.id)) projects.unshift(project);
      else projects = projects.map(p => p.id === project.id ? project : p);
      localStorage.setItem(sessionKey(), JSON.stringify(projects));
      renderProjects(); updateSaveState('Rascunho salvo neste navegador');
    } catch { $('studioSaveState').textContent = 'Não foi possível salvar. Verifique o espaço disponível no navegador.'; }
  }
  function renderProjects() {
    const host = $('studioProjects');
    host.innerHTML = projects.length ? projects.map(p => `<article class="studio-project-card"><div><span class="studio-draft-tag">RASCUNHO LOCAL</span><h3>${esc(p.title || 'Treinamento sem nome')}</h3><p>${esc(p.category || 'Sem categoria')} · ${p.modules.reduce((n,m)=>n+m.lessons.length,0)} aula(s)</p></div><button type="button" class="outline" data-open-project="${esc(p.id)}">Continuar →</button></article>`).join('') : '<div class="studio-empty"><span aria-hidden="true">▧</span><b>Seu primeiro treinamento começa aqui.</b><p>Crie uma estrutura e monte a primeira aula usando os blocos visuais.</p></div>';
  }
  function blankBlock(type) {
    if (type === 'activity') return {id:id('block'),type,prompt:'',choices:['','','',''],correct:0,feedback:''};
    return {id:id('block'),type,title:'',text:'',url:'',alt:'',description:''};
  }
  function newProject() {
    project = {id:id('studio'),title:'',category:'',description:'',modules:[{id:id('module'),title:'Etapa 1',lessons:[{id:id('lesson'),title:'Aula 1',blocks:[]}]}],updatedAt:null};
    lessonId = project.modules[0].lessons[0].id; preview = false; dirty = true;
    $('studioHome').hidden = true; $('studioEditor').hidden = false; $('studioBuild').hidden = false; $('studioLearnerPreview').hidden = true;
    $('studioTitle').value=''; $('studioCategory').value=''; $('studioDescription').value='';
    $('studioPreviewToggle').textContent='Visualizar aluno'; $('studioTitle').focus();
    renderOutline(); renderBlocks(); updateSaveState('Novo treinamento · ainda não salvo');
  }
  function openProject(projectId) {
    project = projects.find(p => p.id === projectId) || null;
    if (!project) return;
    lessonId = project.modules[0]?.lessons[0]?.id || null;
    preview = false; dirty = false;
    $('studioHome').hidden=true; $('studioEditor').hidden=false; $('studioBuild').hidden=false; $('studioLearnerPreview').hidden=true;
    $('studioTitle').value=project.title||''; $('studioCategory').value=project.category||''; $('studioDescription').value=project.description||'';
    $('studioPreviewToggle').textContent='Visualizar aluno';
    renderOutline(); renderBlocks(); updateSaveState('Rascunho local aberto');
  }
  function renderOutline() {
    const host = $('studioOutline');
    host.innerHTML = project ? project.modules.map((m,mi) => `<section class="studio-module"><div class="studio-module-head"><input class="studio-module-name" data-module-title="${esc(m.id)}" value="${esc(m.title || `Etapa ${mi+1}`)}" maxlength="120" aria-label="Nome da etapa"><div><button type="button" class="studio-icon-btn" title="Subir etapa" aria-label="Subir etapa" data-module-move="${mi}:-1" ${mi===0?'disabled':''}>↑</button><button type="button" class="studio-icon-btn" title="Descer etapa" aria-label="Descer etapa" data-module-move="${mi}:1" ${mi===project.modules.length-1?'disabled':''}>↓</button></div></div>${m.lessons.map((l,li)=>`<button type="button" class="studio-outline-lesson ${l.id===lessonId?'selected':''}" data-select-lesson="${esc(l.id)}"><span>${mi+1}.${li+1}</span>${esc(l.title||`Aula ${li+1}`)}</button>`).join('')}<button type="button" class="studio-add-lesson-link" data-add-lesson="${esc(m.id)}">＋ Adicionar aula</button></section>`).join('') : '';
  }
  function field(label, name, value, attrs='') { return `<label class="studio-field">${label}<input data-field="${name}" value="${esc(value)}" ${attrs}></label>`; }
  function area(label, name, value, attrs='') { return `<label class="studio-field">${label}<textarea data-field="${name}" ${attrs}>${esc(value)}</textarea></label>`; }
  function renderBlock(block,index,total) {
    let editor='';
    if (block.type==='text') editor=field('Título do bloco','title',block.title,'maxlength="160"')+area('Texto','text',block.text,'maxlength="5000" rows="5"');
    if (block.type==='image') editor=field('Endereço da imagem (HTTPS)','url',block.url,'type="url" placeholder="https://…"')+field('Texto alternativo','alt',block.alt,'maxlength="200"');
    if (block.type==='video') editor=field('Playback ID ou URL do player Mux','url',block.url,'placeholder="Playback ID ou https://player.mux.com/…"')+area('Orientação ao aluno','description',block.description,'maxlength="500" rows="2"');
    if (block.type==='material') editor=field('Nome do material','title',block.title,'maxlength="160"')+field('Link para abrir (HTTPS)','url',block.url,'type="url" placeholder="https://…"');
    if (block.type==='activity') editor=area('Pergunta','prompt',block.prompt,'maxlength="1000" rows="3"')+block.choices.map((choice,i)=>field(`Alternativa ${String.fromCharCode(65+i)}`,`choice-${i}`,choice,'maxlength="300"')).join('')+`<label class="studio-field">Resposta correta<select data-field="correct">${block.choices.map((_,i)=>`<option value="${i}" ${Number(block.correct)===i?'selected':''}>Alternativa ${String.fromCharCode(65+i)}</option>`).join('')}</select></label>`+area('Feedback após responder','feedback',block.feedback,'maxlength="500" rows="2"');
    return `<article class="studio-block-card" data-block-card="${esc(block.id)}"><header><div><span class="studio-block-type">${labels[block.type]}</span><strong>${esc(block.title||block.prompt||`Bloco ${index+1}`)}</strong></div><div class="studio-block-controls"><button type="button" class="studio-icon-btn" aria-label="Subir bloco" data-block-move="${index}:-1" ${index===0?'disabled':''}>↑</button><button type="button" class="studio-icon-btn" aria-label="Descer bloco" data-block-move="${index}:1" ${index===total-1?'disabled':''}>↓</button><button type="button" class="studio-icon-btn studio-delete" aria-label="Remover bloco" data-delete-block="${esc(block.id)}">×</button></div></header><div class="studio-block-fields">${editor}</div></article>`;
  }
  function renderBlocks() {
    const lesson=activeLesson();
    $('studioLessonTitle').value=lesson?.title||''; $('studioLessonTitle').disabled=!lesson;
    $('studioBlocks').innerHTML=lesson ? (lesson.blocks.length ? lesson.blocks.map((b,i)=>renderBlock(b,i,lesson.blocks.length)).join('') : '<div class="studio-empty studio-block-empty">Adicione um bloco para começar a construir esta aula.</div>') : '<div class="studio-empty">Selecione uma aula na estrutura.</div>';
  }
  function muxPlaybackId(value) {
    const raw=String(value||'').trim();
    if (/^[A-Za-z0-9_-]{8,255}$/.test(raw)) return raw;
    try { const url=new URL(raw); if(url.protocol==='https:'&&url.hostname==='player.mux.com'&&/^[A-Za-z0-9_-]{8,255}$/.test(url.pathname.slice(1)))return url.pathname.slice(1); } catch {}
    return '';
  }
  function renderLearnerPreview() {
    const host=$('studioLearnerPreview');
    host.innerHTML=`<div class="studio-preview-head"><div><p class="tag">PRÉVIA DO ALUNO · SEM PUBLICAÇÃO</p><h2>${esc(project.title||'Novo treinamento')}</h2><p>${esc(project.description||'')}</p></div><button type="button" class="outline" id="studioReturnEditor">← Voltar ao editor</button></div>`+project.modules.map(m=>`<section class="studio-preview-module"><h3>${esc(m.title)}</h3>${m.lessons.map(l=>`<article class="studio-preview-lesson"><h4>${esc(l.title)}</h4>${l.blocks.map(b=>{
      if(b.type==='text')return `<section class="studio-preview-text"><h5>${esc(b.title)}</h5><p>${esc(b.text).replaceAll('\n','<br>')}</p></section>`;
      if(b.type==='image')return /^https:\/\//i.test(b.url||'')?`<figure><img src="${esc(b.url)}" alt="${esc(b.alt)}"><figcaption>${esc(b.alt)}</figcaption></figure>`:'';
      if(b.type==='video'){const pid=muxPlaybackId(b.url);return pid?`<div class="studio-preview-video"><iframe src="https://player.mux.com/${esc(pid)}?playsinline=true" title="${esc(b.description||'Vídeo Mux')}" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowfullscreen></iframe></div>`:'<p class="muted">Informe um Playback ID ou link player.mux.com para mostrar o vídeo.</p>';}
      if(b.type==='material')return /^https:\/\//i.test(b.url||'')?`<p><a href="${esc(b.url)}" target="_blank" rel="noopener noreferrer">↗ ${esc(b.title||'Abrir material de apoio')}</a></p>`:'';
      if(b.type==='activity')return `<section class="studio-preview-activity"><h5>${esc(b.prompt||'Atividade')}</h5>${b.choices.map((c,i)=>`<button type="button" data-answer="${i}" data-block="${esc(b.id)}">${String.fromCharCode(65+i)} · ${esc(c||`Alternativa ${String.fromCharCode(65+i)}`)}</button>`).join('')}<p class="studio-activity-feedback" data-feedback="${esc(b.id)}" aria-live="polite"></p></section>`;
      return '';
    }).join('')}</article>`).join('')}</section>`).join('');
    host.hidden=false; $('studioBuild').hidden=true;
  }
  function refresh() { renderOutline(); renderBlocks(); }
  function enterDemo() {
    enteredFromLogin=true; preview=false; loadProjects(); project=null; lessonId=null;
    $('login').classList.add('hidden'); $('app').classList.remove('hidden'); $('cloudBar').hidden=true;
    $('studentNav').hidden=true; $('adminNav').hidden=true; $('sidebarContext').textContent='PRÉVIA LOCAL · SEM AUTENTICAÇÃO';
    document.querySelector('.demo-chip').textContent='PRÉVIA LOCAL · SEM CONTA';
    $('workspaceLabel').textContent='CONTREM Studio';
    $('studio-local-banner').innerHTML='<b>Prévia demonstrativa:</b> rascunhos ficam somente neste navegador. Este modo não usa autenticação, não sincroniza com a Academia e não publica treinamentos.';
    window.show('studioView'); showHome();
  }
  function showHome(force=false) { if(dirty&&!force&&!confirm('Há alterações não salvas. Voltar sem salvar?'))return; if(dirty){loadProjects();} $('studioEditor').hidden=true; $('studioHome').hidden=false; $('studioLearnerPreview').hidden=true; $('studioBuild').hidden=false; project=null; renderProjects(); }
  function returnFromDemo() {
    $('app').classList.add('hidden'); $('login').classList.remove('hidden');
    $('studentNav').hidden=false; $('sidebarContext').textContent='AMBIENTE DE APRENDIZAGEM';
    document.querySelector('.demo-chip').textContent='CONTREM ACADEMIA · CONECTADA';
    enteredFromLogin=false; preview=false;
  }
  $('openStudioPreview').addEventListener('click',enterDemo);
  $('studioTab').addEventListener('click',()=>{
    const role=window.AcademySession?.role;
    if(!['admin','content_admin'].includes(role))return;
    preview=false; enteredFromLogin=false; loadProjects(); $('studio-local-banner').innerHTML='<b>Prévia local:</b> rascunhos ficam neste navegador, vinculados à conta atual. Não são enviados à Academia, não aparecem para alunos e não podem ser publicados nesta etapa.'; window.show('studioView'); $('workspaceLabel').textContent='CONTREM Studio'; showHome();
  });
  $('studioBack').addEventListener('click',()=>{if(dirty&&!confirm('Há alterações não salvas. Sair sem salvar?'))return;if(enteredFromLogin)returnFromDemo();else window.show('adminView');});
  $('studioToList').addEventListener('click',showHome);
  $('studioCreate').addEventListener('click',newProject);
  $('studioProjects').addEventListener('click',event=>{
    const button=event.target.closest('[data-open-project]'); if(button)openProject(button.dataset.openProject);
  });
  $('studioTitle').addEventListener('input',event=>{if(project){project.title=event.target.value;markDirty();}});
  $('studioLessonTitle').addEventListener('input',event=>{const lesson=activeLesson();if(!lesson)return;lesson.title=event.target.value;markDirty();const item=$('studioOutline').querySelector(`[data-select-lesson="${CSS.escape(lesson.id)}"]`);if(item?.lastChild?.nodeType===Node.TEXT_NODE)item.lastChild.nodeValue=event.target.value||'Aula';});
  $('studioOutline').addEventListener('input',event=>{const input=event.target.closest('[data-module-title]');if(!input||!project)return;const module=project.modules.find(m=>m.id===input.dataset.moduleTitle);if(module){module.title=input.value;markDirty();}});
  $('studioCategory').addEventListener('input',event=>{if(project){project.category=event.target.value;markDirty();}});
  $('studioDescription').addEventListener('input',event=>{if(project){project.description=event.target.value;markDirty();}});
  $('studioAddModule').addEventListener('click',()=>{
    if(!project)return; const module={id:id('module'),title:`Etapa ${project.modules.length+1}`,lessons:[]};
    project.modules.push(module); lessonId=null; markDirty(); refresh();
  });
  $('studioAddLesson').addEventListener('click',()=>{
    if(!project)return; const module=project.modules.at(-1); if(!module)return;
    const lesson={id:id('lesson'),title:`Aula ${module.lessons.length+1}`,blocks:[]};module.lessons.push(lesson);lessonId=lesson.id;markDirty();refresh();
  });
  $('studioOutline').addEventListener('click',event=>{
    const select=event.target.closest('[data-select-lesson]');
    const add=event.target.closest('[data-add-lesson]');
    const move=event.target.closest('[data-module-move]');
    if(select){lessonId=select.dataset.selectLesson;refresh();return;}
    if(add){const module=project.modules.find(m=>m.id===add.dataset.addLesson);if(!module)return;const lesson={id:id('lesson'),title:`Aula ${module.lessons.length+1}`,blocks:[]};module.lessons.push(lesson);lessonId=lesson.id;markDirty();refresh();return;}
    if(move){const [i,d]=move.dataset.moduleMove.split(':').map(Number),j=i+d;if(j<0||j>=project.modules.length)return;[project.modules[i],project.modules[j]]=[project.modules[j],project.modules[i]];markDirty();refresh();}
  });
  $('studioBlocks').addEventListener('input',event=>{
    const card=event.target.closest('[data-block-card]'),lesson=activeLesson();if(!card||!lesson)return;
    const block=lesson.blocks.find(b=>b.id===card.dataset.blockCard),field=event.target.dataset.field;if(!block||!field)return;
    if(field.startsWith('choice-'))block.choices[Number(field.slice(7))]=event.target.value;else block[field]=event.target.value;
    markDirty();
  });
  $('studioBlocks').addEventListener('change',event=>{
    const card=event.target.closest('[data-block-card]'),lesson=activeLesson();if(!card||!lesson)return;
    const block=lesson.blocks.find(b=>b.id===card.dataset.blockCard);if(block&&event.target.dataset.field==='correct')block.correct=Number(event.target.value);
    markDirty();
  });
  $('studioBlocks').addEventListener('click',event=>{
    const lesson=activeLesson();if(!lesson)return;
    const remove=event.target.closest('[data-delete-block]'),move=event.target.closest('[data-block-move]');
    if(remove){lesson.blocks=lesson.blocks.filter(b=>b.id!==remove.dataset.deleteBlock);markDirty();renderBlocks();return;}
    if(move){const [i,d]=move.dataset.blockMove.split(':').map(Number),j=i+d;if(j<0||j>=lesson.blocks.length)return;[lesson.blocks[i],lesson.blocks[j]]=[lesson.blocks[j],lesson.blocks[i]];markDirty();renderBlocks();}
  });
  $('studioAddBlock').addEventListener('click',()=>{
    const lesson=activeLesson();if(!lesson)return;
    const block=blankBlock($('studioBlockType').value);lesson.blocks.push(block);markDirty();renderBlocks();
    const card=document.querySelector(`[data-block-card="${CSS.escape(block.id)}"]`);card?.scrollIntoView({block:'nearest',behavior:'smooth'});card?.querySelector('input,textarea')?.focus();
  });
  $('studioSave').addEventListener('click',persist);
  $('studioPreviewToggle').addEventListener('click',()=>{
    if(!project)return;
    if(preview){preview=false;$('studioBuild').hidden=false;$('studioLearnerPreview').hidden=true;$('studioPreviewToggle').textContent='Visualizar aluno';}
    else {preview=true;renderLearnerPreview();$('studioPreviewToggle').textContent='Voltar ao editor';}
  });
  $('studioLearnerPreview').addEventListener('click',event=>{
    if(event.target.id==='studioReturnEditor'){preview=false;$('studioBuild').hidden=false;$('studioLearnerPreview').hidden=true;$('studioPreviewToggle').textContent='Visualizar aluno';return;}
    const button=event.target.closest('[data-answer]');if(!button)return;
    const block=project?.modules.flatMap(m=>m.lessons).flatMap(l=>l.blocks).find(b=>b.id===button.dataset.block);if(!block)return;
    const feedback=document.querySelector(`[data-feedback="${CSS.escape(block.id)}"]`);if(!feedback)return;feedback.textContent=Number(button.dataset.answer)===Number(block.correct)?(block.feedback||'Resposta correta.'):'Revise o conteúdo e tente novamente.';
    feedback.classList.toggle('correct',Number(button.dataset.answer)===Number(block.correct));
  });
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'&&!$('studioEditor').hidden){event.preventDefault();persist();}
  });
  window.addEventListener('contrem:academy-session-ended',()=>{
    if(enteredFromLogin)returnFromDemo();project=null;preview=false;
  });
  loadProjects(); renderProjects();
})();
