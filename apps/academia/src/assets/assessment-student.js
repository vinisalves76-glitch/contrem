// Dynamic assessments inside the existing per-account Academia state (preview only).
(() => {
 'use strict';
 if(!window.CONTREM_ACADEMY_CONFIG?.preview||!window.AcademyAssessment)return;
 const core=window.AcademyAssessment,root=document.getElementById('assessmentContent');
 let selected={identity:null,course:null,lesson:null,key:'final'};
 const clone=value=>JSON.parse(JSON.stringify(value));
 const shuffled=length=>{const values=Array.from({length},(_,i)=>i);for(let i=length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[values[i],values[j]]=[values[j],values[i]];}return values;};
 const describe=(q,value)=>{if(q.type==='single')return q.choices[value]||'Sem resposta';if(q.type==='match')return q.items.map((item,i)=>item+' → '+(q.choices[value?.[i]]||'Sem resposta')).join(' · ');return Array.isArray(value)&&value.length?value.map((v,i)=>(q.type==='order'?(i+1)+'. ':'')+(q.choices[v]||'Sem resposta')).join(' · '):'Sem resposta';};
 const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
 const button=(id,text,callback,parent=root)=>{const b=el('button',text,'outline');b.type='button';b.id=id;b.onclick=callback;parent.append(b);return b;};
 const identity=()=>window.AcademySession;
 function context(){
  const course=courses.find(c=>c.id===selectedCourse?.id);if(!course||!identity())return null;
  const lesson=course.lessons[selectedLesson]||null;
  if(selected.identity!==identity()||selected.course!==course.id||selected.lesson!==lesson?.id)selected={identity:identity(),course:course.id,lesson:lesson?.id,key:'final'};
  const checkpoint=selected.key!=='final',source=checkpoint?lesson:course;
  if(!source)return null;
  const config=core.config(source.questions||[],Number(source.passScore??70));
  return {identity:identity(),course,lesson,key:checkpoint?'lesson:'+lesson.id:'final',checkpoint,config,fingerprint:core.fingerprint(config)};
 }
 function alive(ctx){
  const now=context();return now&&now.identity===ctx.identity&&now.course.id===ctx.course.id&&now.key===ctx.key&&now.fingerprint===ctx.fingerprint;
 }
 function recordFor(ctx){return activity[ctx.course.id]?.assessments?.[ctx.key]||null;}
 function persist(ctx,record){
  if(!alive(ctx))return false;
  Object.defineProperty(activity,ctx.course.id,{value:{...(activity[ctx.course.id]||{}),assessments:{...(activity[ctx.course.id]?.assessments||{}),[ctx.key]:record}},writable:true,enumerable:true,configurable:true});
  academyStorage.setItem(ACTIVITY_KEY,JSON.stringify(activity));return true;
 }
 async function start(ctx){
  if(!alive(ctx))return;
  if(!ctx.checkpoint&&ctx.course.academyId){
   try{await window.CONTREM_PREVIEW_SYNC?.flush?.();if(!alive(ctx))return;const ui=window.CONTREM_PROGRAM_UI;if(!ui)throw Error('Regras da Academia não carregadas.');ui.consumeRetry(ctx.course.id);}
   catch(error){root.append(el('p',error.message||'Não é possível iniciar a prova.','notice'));return;}
  }
  const previous=recordFor(ctx),record={version:1,fingerprint:ctx.fingerprint,snapshot:clone(ctx.config),choiceOrders:ctx.config.questions.map(q=>shuffled(q.choices.length)),answers:ctx.config.questions.map(()=>null),locked:[],flags:[],index:0,xp:0,status:'active',startedAt:new Date().toISOString(),history:Array.isArray(previous?.history)?previous.history.slice(-100):[]};
  persist(ctx,record);renderAssessment();
 }
 function change(ctx,record,action,rerender=true){if(!alive(ctx)||recordFor(ctx)!==record||record.status==='result')return;action();persist(ctx,record);if(rerender)renderAssessment();}
 function finish(ctx,record){
  if(!alive(ctx)||recordFor(ctx)!==record||record.status==='result')return;
  const result={...core.grade(record.snapshot.questions,record.answers,record.snapshot.passScore),at:new Date().toISOString(),fingerprint:record.fingerprint};
  record.result=result;record.status='result';record.history=[...(record.history||[]),clone(result)];
  if(!ctx.checkpoint){progress['assessment:'+ctx.course.id]=[...getAttempts(ctx.course.id),clone(result)];save();}
  persist(ctx,record);renderCourseCertificates();refresh();renderAssessment();
  window.dispatchEvent(new CustomEvent('academia:assessment-completed',{detail:{courseId:ctx.course.id,passed:result.passed,score:result.score}}));
 }
 function questionVisual(q,holder){
  if(q.context)holder.append(el('p',q.context,'assessment-context'));
  if(q.illustration){
   const figure=el('figure',undefined,'assessment-illustration');
   if(q.illustration==='engine')figure.innerHTML='<svg viewBox="0 0 360 180" role="img" aria-label="Esquema simplificado: A pistão, B biela, C conjunto inferior do motor"><rect x="50" y="15" width="90" height="65" rx="5" fill="#cbd5e1" stroke="#334155" stroke-width="4"/><path d="M95 80L160 135" stroke="#64748b" stroke-width="16"/><path d="M70 145H245" stroke="#f47b20" stroke-width="17"/><circle cx="160" cy="145" r="24" fill="#fde6cf" stroke="#f47b20" stroke-width="4"/><text x="20" y="50">A</text><text x="125" y="100">B</text><text x="260" y="151">C</text></svg>';
   else figure.append(el('p',q.illustration==='fluid'?'Reservatório → bomba → circuito → retorno':'Fonte → comando → componente → retorno'));
   figure.append(el('figcaption','Ilustração didática simplificada do exercício.'));holder.append(figure);
  }
  if(q.imageUrl){const img=el('img');img.src=q.imageUrl;img.alt='Ilustração da questão';img.className='assessment-image';holder.append(img);}
 }
 function questionInputs(ctx,record,q,parent){
  const index=record.index,locked=ctx.checkpoint&&record.locked[index];
  const choiceOrder=record.choiceOrders[index];
  if(q.type==='single'||q.type==='multi')choiceOrder.forEach(i=>{const choice=q.choices[i];
   const label=el('label',undefined,'assessment-choice'),input=el('input');input.type=q.type==='single'?'radio':'checkbox';input.name='assessment-answer';input.value=String(i);input.dataset.answerIndex=String(i);input.checked=q.type==='single'?record.answers[index]===i:Array.isArray(record.answers[index])&&record.answers[index].includes(i);if(input.checked)input.setAttribute('checked','');input.disabled=!!locked;
   input.onchange=()=>change(ctx,record,()=>{if((ctx.checkpoint&&record.locked[index])||record.status!=='active')return;if(q.type==='single')record.answers[index]=i;else {const values=new Set(record.answers[index]||[]);if(input.checked)values.add(i);else values.delete(i);record.answers[index]=Array.from(values);}},false);
   label.append(input,el('span',choice));parent.append(label);
  });
  else (q.type==='match'?q.items:q.choices).forEach((item,position)=>{
   const label=el('label',q.type==='match'?item:'Posição '+(position+1),'assessment-association'),select=el('select');select.dataset.answerPosition=String(position);select.disabled=!!locked;
   const blank=el('option','Selecione…');blank.value='';select.append(blank);choiceOrder.forEach(i=>{const option=el('option',q.choices[i]);option.value=String(i);select.append(option);});
   const value=record.answers[index]?.[position];select.value=Number.isInteger(value)?String(value):'';
   select.onchange=()=>change(ctx,record,()=>{if((ctx.checkpoint&&record.locked[index])||record.status!=='active')return;const answer=Array.isArray(record.answers[index])?[...record.answers[index]]:q.choices.map(()=>null);answer[position]=select.value===''?null:Number(select.value);record.answers[index]=answer;},false);label.append(select);parent.append(label);
  });
 }
 function showResult(ctx,record){
  const result=core.grade(record.snapshot.questions,record.answers,record.snapshot.passScore);root.append(el('h3',ctx.checkpoint?'Atividade concluída':result.passed?'Aprovado na prova final!':'Prova final concluída'));
  root.append(el('p','Nota: '+result.score+'% · '+result.correct+'/'+result.total+' acertos'+(ctx.checkpoint?' · '+record.xp+' XP nesta tentativa.':''),'notice'));
  const summary=el('ul');Object.entries(result.competencies||{}).forEach(([name,c])=>summary.append(el('li',name+': '+c.score+'% ('+c.correct+'/'+c.total+')')));root.append(summary);
  record.snapshot.questions.forEach((q,i)=>{const detail=el('details'),heading=el('summary',(i+1)+'. '+(core.gradeQuestion(q,record.answers[i])?'Correta':'Revisar')+' · '+q.text);detail.append(heading,el('p','Sua resposta: '+describe(q,record.answers[i])),el('p','Resposta esperada: '+describe(q,q.correct)));if(q.explanation)detail.append(el('p',q.explanation));root.append(detail);});
  if(ctx.course.academyId&&!ctx.checkpoint){
   if(result.passed){root.append(el('p','Módulo aprovado. Continue sua formação.','notice'));return;}
   const ui=window.CONTREM_PROGRAM_UI;
   let can=null;try{can=ui?.canAttempt(ctx.course.id);}catch{}
   if(can?.allowed)button('assessmentRetry','Iniciar nova tentativa autorizada',()=>start(ctx));
   else{
    root.append(el('p',can?.reason||'Solicite autorização ao ADM Master para refazer a prova.','notice'));
    if(!/aguarde|pendente/i.test(can?.reason||''))button('assessmentRetry','Solicitar nova tentativa',async()=>{
     try{await window.CONTREM_PREVIEW_SYNC?.flush?.();ui.requestRetake(ctx.course.id);renderAssessment();}
     catch(error){root.append(el('p',error.message,'notice'));}
    });
   }
   return;
  }
  button('assessmentRetry','Tentar novamente',()=>start(ctx));
 }
 function showQuestion(ctx,record){
  const qs=record.snapshot.questions,q=qs[record.index],panel=el('div',undefined,'assessment-question');root.append(panel);
  panel.append(el('p','Questão '+(record.index+1)+' de '+qs.length+(q.competency?' · '+q.competency:''),'tag'));questionVisual(q,panel);panel.append(el('h3',q.text));
  panel.append(el('p',{single:'Escolha uma alternativa.',multi:'Selecione todas as alternativas corretas.',order:'Escolha um item para cada posição, sem repetir.',match:'Associe cada item à função correspondente, sem repetir.'}[q.type],'muted'));
  questionInputs(ctx,record,q,panel);
  const controls=el('div',undefined,'row');root.append(controls);
  if(!ctx.checkpoint)button('assessmentReview','Revisar prova',()=>change(ctx,record,()=>record.status='review'),controls);
  if(!ctx.checkpoint)button('assessmentFlag',record.flags.includes(record.index)?'Desmarcar revisão':'Marcar para revisar',()=>change(ctx,record,()=>{const flags=new Set(record.flags);if(flags.has(record.index))flags.delete(record.index);else flags.add(record.index);record.flags=Array.from(flags);}),controls);
  if(ctx.checkpoint){
   if(!record.locked[record.index])button('assessmentCheck','Confirmar resposta',()=>{
    if(!alive(ctx)||recordFor(ctx)!==record)return;if(!core.answered(q,record.answers[record.index])){const status=el('p','Complete a resposta antes de confirmar.','notice');root.append(status);return;}
    change(ctx,record,()=>{if(record.locked[record.index])return;record.locked[record.index]=true;if(core.gradeQuestion(q,record.answers[record.index]))record.xp+=10;});
   },controls);
   else {const ok=core.gradeQuestion(q,record.answers[record.index]);root.append(el('p','Sua resposta: '+describe(q,record.answers[record.index])),el('p','Resposta esperada: '+describe(q,q.correct)));root.append(el('p',(ok?'Resposta correta! +10 XP.':'Resposta registrada. Revise o conceito.')+(q.explanation?' '+q.explanation:''),'notice'));}
  }
  const prev=button('assessmentPrevious','← Anterior',()=>change(ctx,record,()=>record.index--),controls);prev.disabled=record.index===0;
  const next=button('assessmentNext',record.index===qs.length-1?(ctx.checkpoint?'Ver resultado':'Revisar e entregar'):'Próxima →',()=>{
   if(ctx.checkpoint&&!record.locked[record.index])return;
   if(record.index===qs.length-1){if(ctx.checkpoint)finish(ctx,record);else change(ctx,record,()=>record.status='review');}
   else change(ctx,record,()=>record.index++);
  },controls);next.disabled=ctx.checkpoint&&!record.locked[record.index];
  button('assessmentPause','Pausar e salvar',()=>change(ctx,record,()=>record.status='paused'));
 }
 function showReview(ctx,record){
  const pending=record.snapshot.questions.map((q,i)=>core.answered(q,record.answers[i])?null:i).filter(i=>i!==null);
  root.append(el('h3','Revisar antes de entregar'));root.append(el('p',pending.length+' questão(ões) pendente(s). '+record.flags.length+' marcada(s) para revisão. Respostas incompletas valem zero.'));
  const list=el('div',undefined,'assessment-review');record.snapshot.questions.forEach((q,i)=>button('assessmentReviewQuestion'+i,(i+1)+'. '+(pending.includes(i)?'Pendente':record.flags.includes(i)?'Revisar':'Respondida'),()=>change(ctx,record,()=>{record.index=i;record.status='active';}),list));root.append(list);
  button('assessmentConfirmSubmit',pending.length?'Entregar mesmo com pendências':'Confirmar entrega da prova',()=>finish(ctx,record));
 }
 function usableRecord(record,ctx){
  const qs=ctx.config.questions,n=qs.length;
  if(!record||record.version!==1||record.fingerprint!==ctx.fingerprint||core.fingerprint(record.snapshot)!==record.fingerprint||!['active','paused','review','result'].includes(record.status))return false;
  if(!Array.isArray(record.answers)||record.answers.length!==n||!record.answers.every((answer,i)=>answer===null||(qs[i].type==='single'?Number.isInteger(answer)&&answer>=0&&answer<qs[i].choices.length:Array.isArray(answer)&&answer.length<=qs[i].choices.length&&answer.every(v=>v===null||Number.isInteger(v)&&v>=0&&v<qs[i].choices.length))))return false;
  if(!Array.isArray(record.flags)||record.flags.some(i=>!Number.isInteger(i)||i<0||i>=n)||!Array.isArray(record.locked)||record.locked.length>n||record.locked.some(v=>v!==null&&typeof v!=='boolean')||!Number.isInteger(record.index)||record.index<0||record.index>=n||!Number.isFinite(record.xp)||record.xp<0||record.xp>n*10)return false;
  return Array.isArray(record.choiceOrders)&&record.choiceOrders.length===n&&record.choiceOrders.every((order,i)=>Array.isArray(order)&&order.length===qs[i].choices.length&&new Set(order).size===order.length&&order.every(v=>Number.isInteger(v)&&v>=0&&v<order.length));
 }
 renderAssessment=function(){
  root.textContent='';const ctx=context();if(!ctx)return;
  const nav=el('div',undefined,'row');root.append(nav);
  button('assessmentFinalScope','Prova final do curso',()=>{selected.key='final';renderAssessment();},nav);
  if(ctx.lesson?.questions?.length)button('assessmentLessonScope','Atividade desta aula / etapa',()=>{selected.key='lesson';renderAssessment();},nav);
  root.append(el('h3',ctx.checkpoint?'Atividade da aula · desafio com feedback':'Prova final · caso prático'));
  $('assessmentSummary').textContent=getAttempts(ctx.course.id).length+' tentativa(s) na prova final';
  if(!ctx.config.questions.length){root.append(el('p',ctx.checkpoint?'Esta aula ainda não possui atividade.':'Este curso ainda não possui prova cadastrada.','muted'));return;}
  const record=recordFor(ctx);
  if(!usableRecord(record,ctx)){
   root.append(el('p',(record?'A configuração mudou. Inicie uma nova tentativa; resultados anteriores foram preservados. ':'')+ctx.config.questions.length+' questões · Nota mínima '+ctx.config.passScore+'%. '+(ctx.checkpoint?'Cada resposta é confirmada uma vez antes do feedback.':'O resultado será mostrado somente depois da entrega.')));
   button('assessmentStart',record?'Iniciar nova versão':'Iniciar '+(ctx.checkpoint?'atividade':'prova'),()=>start(ctx));return;
  }
  if(record.status==='result')return showResult(ctx,record);
  if(record.status==='paused'){root.append(el('p','Tentativa pausada. Sua posição e suas respostas foram salvas.'));button('assessmentResume','Retomar tentativa',()=>change(ctx,record,()=>record.status='active'));return;}
  if(record.status==='review')return showReview(ctx,record);
  showQuestion(ctx,record);
 };
 const oldShow=show;show=function(id){const result=oldShow(id);if(id==='classView')renderAssessment();return result;};
 renderAssessment();
})();
