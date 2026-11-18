// Authoring for the isolated Academia preview; the production editor is untouched.
(() => {
 'use strict';
 if(!window.CONTREM_ACADEMY_CONFIG?.preview||!window.AcademyAssessment)return;
 const byId=id=>document.getElementById(id),core=window.AcademyAssessment;
 const admin=()=>window.AcademySession?.role==='admin';
 const copy=value=>JSON.parse(JSON.stringify(value));
 let activeCourse='',activeScope='final',editingIndex=-1,baseline=null,settingsBaseline='',sessionAtOpen=null;
 const entry=document.createElement('div');entry.className='adm-assessment-entry';
 entry.innerHTML='<button type="button" id="openAssessmentAuthor" class="primary">Atividades e prova</button><p>Crie atividades de aula ou etapa com retorno imediato e organize a prova final do curso.</p>';
 byId('adminLessonOrder').before(entry);
 const panel=document.createElement('section');panel.id='assessmentAuthorPanel';panel.className='panel assessment-author-panel';panel.hidden=true;
 panel.innerHTML='<div class="row"><div><h3 id="assessmentAuthorHeading" tabindex="-1">Atividades e prova</h3><p>As atividades são exercícios de aprendizagem. Somente a prova final conta para o certificado de aprovação.</p></div><button type="button" id="closeAssessmentAuthor" class="outline">Fechar editor</button></div><label for="assessmentAuthorScope">Onde esta avaliação será usada?</label><select id="assessmentAuthorScope"></select><div class="row assessment-author-settings"><div class="field"><label for="assessmentPassScore">Nota mínima (%)</label><input id="assessmentPassScore" type="number" min="0" max="100" step="1" value="70"></div><button type="button" id="saveAssessmentSettings" class="outline">Salvar nota mínima</button></div><div class="row"><h4>Questões cadastradas</h4><button type="button" id="newAssessmentQuestion" class="outline">+ Nova questão</button></div><ol id="assessmentAuthorQuestions"></ol><form id="assessmentAuthorForm"><h4 id="assessmentQuestionHeading">Nova questão</h4><div class="field"><label for="assessmentAuthorType">Tipo de questão</label><select id="assessmentAuthorType"><option value="single">Uma resposta correta</option><option value="multi">Várias respostas corretas</option><option value="order">Ordenar uma sequência</option><option value="match">Relacionar colunas</option></select></div><div class="field"><label for="assessmentQuestionText">Enunciado</label><textarea id="assessmentQuestionText" maxlength="3000" required></textarea></div><div class="field"><label for="assessmentContext">Contexto ou caso (opcional)</label><textarea id="assessmentContext" maxlength="4000"></textarea></div><div class="field"><label for="assessmentChoices">Alternativas, etapas ou coluna de respostas (uma por linha)</label><textarea id="assessmentChoices" rows="5" required></textarea><small>Informe entre 2 e 8 opções. A ordem das linhas define os números apresentados no gabarito.</small></div><div class="field" id="assessmentMatchField" hidden><label for="assessmentMatchItems">Itens a relacionar (uma linha por item)</label><textarea id="assessmentMatchItems" rows="4"></textarea><small>Use a mesma quantidade de itens e respostas.</small></div><fieldset id="assessmentCorrectEditor" class="assessment-author-correct"><legend>Gabarito</legend></fieldset><div class="field"><label for="assessmentCompetency">Competência (opcional)</label><input id="assessmentCompetency" maxlength="150" placeholder="Ex.: Diagnóstico do sistema de lubrificação"></div><div class="field"><label for="assessmentExplanation">Explicação da resposta (opcional)</label><textarea id="assessmentExplanation" maxlength="4000"></textarea></div><div class="field"><label for="assessmentIllustration">Ilustração esquemática (opcional)</label><select id="assessmentIllustration"><option value="">Sem ilustração</option><option value="engine">Motor</option><option value="fluid">Circuito de fluido</option><option value="circuit">Circuito elétrico</option></select></div><div class="field"><label for="assessmentImageUrl">Imagem por URL HTTPS (opcional)</label><input id="assessmentImageUrl" type="url" maxlength="2000"></div><button type="submit" class="primary" id="saveAssessmentQuestion">Salvar questão</button><p id="assessmentAuthorStatus" role="status" aria-live="polite"></p></form>';
 byId('admLessons').append(panel);
 document.querySelector('.admin-assessment')?.setAttribute('hidden','');
 const fieldIds=['assessmentAuthorType','assessmentQuestionText','assessmentContext','assessmentChoices','assessmentMatchItems','assessmentCompetency','assessmentExplanation','assessmentIllustration','assessmentImageUrl'];
 const lines=id=>byId(id).value.split(/\r?\n/).map(value=>value.trim()).filter(Boolean);
 const currentCourse=()=>courses.find(course=>course.id===activeCourse);
 const target=()=>{const course=currentCourse();return activeScope==='final'?course:course?.lessons.find(lesson=>lesson.id===activeScope);};
 const numeric=value=>value===''?NaN:Number(value);
 function correctValue(){
  const type=byId('assessmentAuthorType').value;
  if(type==='single')return numeric(byId('assessmentCorrectSingle')?.value??'');
  if(type==='multi')return Array.from(byId('assessmentCorrectEditor').querySelectorAll('input[data-author-correct]')).filter(input=>input.checked===true).map(input=>Number(input.value));
  return Array.from(byId('assessmentCorrectEditor').querySelectorAll('select[data-author-correct]')).map(input=>numeric(input.value));
 }
 const fingerprint=()=>JSON.stringify({fields:fieldIds.map(id=>byId(id).value),correct:correctValue()});
 const validContext=()=>admin()&&window.AcademySession===sessionAtOpen&&byId('editId').value===activeCourse&&!!target();
 function hasPendingEdits(){return !panel.hidden&&validContext()&&baseline!==null&&(fingerprint()!==baseline||byId('assessmentPassScore').value!==settingsBaseline);}
 const changed=()=>window.AcademyAdminEdits?.changed?.();
 function status(text,error=false){byId('assessmentAuthorStatus').textContent=text;byId('assessmentAuthorStatus').classList.toggle('error',error);}
 function close(){panel.hidden=true;activeCourse='';activeScope='final';editingIndex=-1;baseline=null;sessionAtOpen=null;changed();}
 const canLeave=()=>window.AcademyAdminEdits?.canLeave?window.AcademyAdminEdits.canLeave():!hasPendingEdits()||confirm('Descartar alterações não salvas da avaliação?');
 window.AcademyAdminEdits?.register('assessment-author',hasPendingEdits,close);
 function answerSelect(choices,selected,index){
  const select=document.createElement('select');select.dataset.authorCorrect=String(index);
  const empty=document.createElement('option');empty.value='';empty.textContent='Selecione a resposta';select.append(empty);
  choices.forEach((choice,i)=>{const option=document.createElement('option');option.value=String(i);option.textContent=(i+1)+'. '+choice;select.append(option);});
  select.value=Number.isInteger(selected)?String(selected):'';return select;
 }
 function renderCorrect(preset){
  const type=byId('assessmentAuthorType').value,choices=lines('assessmentChoices'),items=lines('assessmentMatchItems'),holder=byId('assessmentCorrectEditor');
  holder.textContent='';const legend=document.createElement('legend');legend.textContent='Gabarito';holder.append(legend);byId('assessmentMatchField').hidden=type!=='match';
  if(!choices.length){const hint=document.createElement('p');hint.textContent='Preencha as opções para definir o gabarito.';holder.append(hint);return;}
  if(type==='single'){
   const select=answerSelect(choices,preset,0);select.id='assessmentCorrectSingle';holder.append(select);
  }else if(type==='multi'){
   choices.forEach((choice,i)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=String(i);input.dataset.authorCorrect=String(i);input.checked=Array.isArray(preset)&&preset.includes(i);const text=document.createElement('span');text.textContent=(i+1)+'. '+choice;label.append(input,text);holder.append(label);});
  }else{
   const count=type==='match'?items.length:choices.length;
   for(let i=0;i<count;i++){const label=document.createElement('label'),text=document.createElement('span');text.textContent=type==='match'?(i+1)+'. '+items[i]:'Posição '+(i+1);label.append(text,answerSelect(choices,Array.isArray(preset)?preset[i]:undefined,i));holder.append(label);}
   if(type==='match'&&!items.length){const hint=document.createElement('p');hint.textContent='Preencha também os itens da primeira coluna.';holder.append(hint);}
  }
 }
 function resetQuestion(){
  editingIndex=-1;fieldIds.forEach(id=>byId(id).value=id==='assessmentAuthorType'?'single':'');byId('assessmentQuestionHeading').textContent='Nova questão';renderCorrect();status('');baseline=fingerprint();changed();
 }
 function loadQuestion(index){
  const list=target()?.questions||[],raw=list[index];if(!raw)return;
  const question=core.normalizeQuestion(raw);editingIndex=index;
  byId('assessmentAuthorType').value=question.type||'single';byId('assessmentQuestionText').value=question.text||'';byId('assessmentContext').value=question.context||'';byId('assessmentChoices').value=(question.choices||[]).join('\n');byId('assessmentMatchItems').value=(question.items||[]).join('\n');byId('assessmentCompetency').value=question.competency||'';byId('assessmentExplanation').value=question.explanation||'';byId('assessmentIllustration').value=question.illustration||'';byId('assessmentImageUrl').value=question.imageUrl||'';
  byId('assessmentQuestionHeading').textContent='Editar questão '+(index+1);renderCorrect(question.correct);baseline=fingerprint();status('');changed();
 }
 function renderQuestions(){
  const holder=byId('assessmentAuthorQuestions');holder.textContent='';const questions=target()?.questions||[];
  if(!questions.length){const empty=document.createElement('li');empty.textContent='Nenhuma questão cadastrada. Crie a primeira abaixo.';holder.append(empty);return;}
  questions.forEach((question,index)=>{const row=document.createElement('li'),text=document.createElement('span'),edit=document.createElement('button'),remove=document.createElement('button');text.textContent=(index+1)+'. '+question.text+' · '+({single:'Uma resposta',multi:'Várias respostas',order:'Ordenar',match:'Relacionar'}[question.type||'single']||'Questão');
   edit.type=remove.type='button';edit.className=remove.className='outline';edit.textContent='Editar questão';remove.textContent='Remover questão';edit.dataset.authorEdit=String(index);remove.dataset.authorRemove=String(index);row.append(text,edit,remove);holder.append(row);
  });
 }
 function fillScopeOptions(course){
  const select=byId('assessmentAuthorScope');select.textContent='';
  const final=document.createElement('option');final.value='final';final.textContent='Prova final do curso';select.append(final);
  course.lessons.forEach((lesson,index)=>{const option=document.createElement('option');option.value=lesson.id;option.textContent='Atividade da aula/etapa '+(index+1)+' · '+lesson.name;select.append(option);});select.value=activeScope;
 }
 function loadTarget(courseId,scope,index=-1){
  const course=courses.find(item=>item.id===courseId);if(!admin()||!course)return false;
  if(scope!=='final'&&!course.lessons.some(lesson=>lesson.id===scope))return false;
  activeCourse=courseId;activeScope=scope;sessionAtOpen=window.AcademySession;panel.hidden=false;fillScopeOptions(course);
  byId('assessmentPassScore').value=String(target()?.passScore??70);settingsBaseline=byId('assessmentPassScore').value;
  resetQuestion();renderQuestions();if(index>=0)loadQuestion(index);
  byId('assessmentAuthorHeading').textContent=scope==='final'?'Prova final · '+course.name:'Atividade da aula/etapa · '+target().name;
  return true;
 }
 function open(courseId,scope='final'){
  if(!admin())return;
  // The existing course editor performs its own discard/upload checks and reloads saved fields.
  if(selectLessons(courseId)!==true)return;
  if(loadTarget(courseId,scope)){panel.scrollIntoView({behavior:'smooth',block:'start'});byId('assessmentAuthorHeading').focus();}
 }
 byId('openAssessmentAuthor').onclick=()=>{const courseId=byId('editId').value;if(!courseId){byId('adminFeedback').textContent='Salve as informações do curso para criar atividades e prova.';return;}open(courseId);};
 byId('closeAssessmentAuthor').onclick=()=>{if(canLeave())close();};
 byId('assessmentAuthorScope').onchange=()=>{const courseId=activeCourse,scope=byId('assessmentAuthorScope').value,previous=activeScope;byId('assessmentAuthorScope').value=previous;if(!canLeave())return;loadTarget(courseId,scope);};
 byId('newAssessmentQuestion').onclick=()=>{const courseId=activeCourse,scope=activeScope;if(!canLeave())return;loadTarget(courseId,scope);};
 byId('assessmentAuthorQuestions').addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button||!validContext())return;
  const courseId=activeCourse,scope=activeScope,index=Number(button.dataset.authorEdit??button.dataset.authorRemove);
  if(!Number.isInteger(index)||!canLeave())return;
  if(!loadTarget(courseId,scope))return;
  if(button.dataset.authorEdit!==undefined){loadQuestion(index);return;}
  if(button.dataset.authorRemove!==undefined){const destination=target();destination.questions=(destination.questions||[]).filter((_,i)=>i!==index);currentCourse().status='draft';save();renderQuestions();resetQuestion();refresh();status('Questão removida. Revise e publique o curso.');}
 });
 function passScore(){const value=Number(byId('assessmentPassScore').value);if(byId('assessmentPassScore').value===''||!Number.isInteger(value)||value<0||value>100)throw Error('Informe uma nota mínima inteira de 0 a 100%.');return value;}
 byId('assessmentAuthorForm').onsubmit=event=>{
  event.preventDefault();if(!validContext())return;
  try{
   const destination=target(),existing=(destination.questions||[])[editingIndex];
   const draft={id:existing?.id||'question-'+crypto.randomUUID(),type:byId('assessmentAuthorType').value,text:byId('assessmentQuestionText').value.trim(),choices:lines('assessmentChoices'),correct:correctValue(),competency:byId('assessmentCompetency').value.trim(),explanation:byId('assessmentExplanation').value.trim(),context:byId('assessmentContext').value.trim(),imageUrl:byId('assessmentImageUrl').value.trim(),illustration:byId('assessmentIllustration').value};
   if(draft.type==='match')draft.items=lines('assessmentMatchItems');
   ['competency','explanation','context','imageUrl','illustration'].forEach(key=>{if(!draft[key])delete draft[key];});
   const question=core.validateQuestion(draft),questions=copy(destination.questions||[]);if(editingIndex>=0)questions[editingIndex]=question;else questions.push(question);core.validateQuestions(questions);
   const score=passScore();destination.questions=questions;destination.passScore=score;currentCourse().status='draft';save();settingsBaseline=byId('assessmentPassScore').value;renderQuestions();resetQuestion();refresh();status('Questão salva. Revise e publique o curso para liberar a avaliação.');
  }catch(error){status(error.message||'Não foi possível salvar a questão.',true);}
 };
 byId('saveAssessmentSettings').onclick=()=>{
  if(!validContext())return;
  if(fingerprint()!==baseline){status('Salve a questão em edição ou abra uma nova questão antes de salvar somente a nota.',true);return;}
  try{target().passScore=passScore();currentCourse().status='draft';save();settingsBaseline=byId('assessmentPassScore').value;refresh();status('Nota mínima salva. Revise e publique o curso.');changed();}catch(error){status(error.message,true);}
 };
 ['assessmentAuthorType','assessmentChoices','assessmentMatchItems'].forEach(id=>byId(id).addEventListener(id==='assessmentAuthorType'?'change':'input',()=>{const value=correctValue();renderCorrect(value);changed();}));
 byId('assessmentAuthorForm').addEventListener('input',changed);byId('assessmentAuthorForm').addEventListener('change',changed);byId('assessmentPassScore').addEventListener('input',changed);
 function syncShortcuts(){
  const course=courses.find(item=>item.id===byId('editId').value);
  byId('adminLessonOrder').querySelectorAll('[data-lesson-edit]').forEach(edit=>{const actions=edit.parentElement;if(actions.querySelector('[data-lesson-activity]'))return;const button=document.createElement('button');button.type='button';button.className='outline';button.dataset.lessonActivity=edit.dataset.lessonEdit;button.textContent='Atividade';actions.append(button);});
  if(!panel.hidden&&(!validContext()||!course))close();
 }
 byId('adminLessonOrder').addEventListener('click',event=>{const button=event.target.closest('[data-lesson-activity]');if(!button||!admin())return;const course=courses.find(item=>item.id===byId('editId').value),lesson=course?.lessons[Number(button.dataset.lessonActivity)];if(lesson)open(course.id,lesson.id);});
 const observer=new MutationObserver(syncShortcuts);observer.observe(byId('adminLessonOrder'),{childList:true,subtree:true});
 const oldRefresh=refresh;refresh=function(){oldRefresh();syncShortcuts();};
 window.AcademyAssessmentAuthor={hasPendingEdits,refresh:syncShortcuts,open};
 syncShortcuts();
})();
