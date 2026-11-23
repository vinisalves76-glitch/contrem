/* Pure academy domain rules for the browser-only homologation.
   A future authenticated backend must enforce these rules server-side. */
(function (root) {
  'use strict';
  const MOD='academy_module';
  const copy=x=>JSON.parse(JSON.stringify(x));
  const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
  const moduleIds=academy=>(academy.stages||[]).flatMap(stage=>stage.moduleIds||[]);
  const validDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(new Date(x+'T12:00:00').valueOf())&&new Date(x+'T12:00:00').toISOString().slice(0,10)===x;
  const activeEnrollment=(enrollment,date=today())=>!!enrollment&&enrollment.active===true&&(!enrollment.validUntil||validDate(enrollment.validUntil)&&enrollment.validUntil>=date);
  function lessonDone(course,state) {return !!course&&course.lessons?.length>0&&course.lessons.every(l=>(state?.progress?.[course.id]||[]).includes(l.id));}
  function attempts(courseId,state){return Array.isArray(state?.progress?.['assessment:'+courseId])?state.progress['assessment:'+courseId]:[];}
  function passed(course,state){return lessonDone(course,state)&&attempts(course.id,state).some(a=>a.passed===true);}
  function requestStatus(requests,studentId,courseId,n){
    const last=(requests||[]).filter(r=>r.studentId===studentId&&r.courseId===courseId&&r.forAttempt===n).slice(-1)[0];
    return last?.status||null;
  }
  function buildMap(academy,courses,state,enrollment,requests=[],studentId=''){
    const ordered=moduleIds(academy),courseMap=new Map(courses.map(c=>[c.id,c]));
    let unlocked=activeEnrollment(enrollment),finished=0;
    return ordered.map((id,index)=>{
      const course=courseMap.get(id),priorClear=unlocked,done=lessonDone(course,state),history=attempts(id,state),approved=!!course&&done&&history.some(a=>a.passed===true);
      const retry=requestStatus(requests,studentId,id,history.length+1);
      let status='blocked';
      if(!activeEnrollment(enrollment))status='expired';
      else if(priorClear&&approved){status='approved';finished++;}
      else if(priorClear&&history.some(a=>!a.passed)&&!approved)status=retry==='approved'?'retry-approved':retry==='pending'?'retry-pending':'failed';
      else if(priorClear)status=done?'awaiting-exam':'available';
      unlocked=unlocked&&approved;
      return {id,index,status,name:course?.name||'Módulo em preparação',hours:Number(course?.hours)||0,lessons:course?.lessons?.length||0,done:!!done,passed:approved,attempts:history.length,canOpen:priorClear&&activeEnrollment(enrollment),retake:retry};
    });
  }
  function programState(academy,courses,state,enrollment,requests=[],studentId=''){
    const items=buildMap(academy,courses,state,enrollment,requests,studentId);
    return {items,completed:items.length>0&&items.every(item=>item.passed),approved:items.filter(item=>item.passed).length,total:items.length,active:activeEnrollment(enrollment)};
  }
  function guardProgram(academy,courses,allAcademies=[],currentId=null){
    if(!academy||typeof academy.title!=='string'||academy.title.trim().length<3||academy.title.length>150)throw Error('Informe um nome de formação entre 3 e 150 caracteres.');
    if(!Array.isArray(academy.stages)||academy.stages.length<1||academy.stages.length>30)throw Error('Cadastre pelo menos uma etapa (máximo de 30).');
    const stages=new Set(),seen=new Set(),courseMap=new Map(courses.map(c=>[c.id,c]));
    for(const stage of academy.stages){
      if(!stage.id||stages.has(stage.id)||!stage.title?.trim())throw Error('Etapa inválida ou duplicada.');stages.add(stage.id);
      if(!Array.isArray(stage.moduleIds)||stage.moduleIds.length>100)throw Error('Número inválido de módulos por etapa.');
      for(const id of stage.moduleIds){
        if(seen.has(id))throw Error('Um módulo não pode aparecer duas vezes na formação.');
        seen.add(id);const c=courseMap.get(id);
        if(!c||c.catalogType!==MOD||c.academyId!==academy.id)throw Error('Cada módulo deve pertencer exclusivamente à sua Academia.');
        for(const a of allAcademies){if(a.id!==currentId&&moduleIds(a).includes(id))throw Error('Módulo já vinculado a outra Academia.');}
      }
    }
    return true;
  }
  function inspectModules(academy,courses){
    const byId=new Map(courses.map(c=>[c.id,c]));
    return moduleIds(academy).map(id=>{
      const course=byId.get(id),issues=[];
      if(!course){issues.push('Módulo não encontrado no construtor de cursos.');return {id,name:'Módulo ausente',status:'missing',ready:false,issues};}
      const name=String(course.name||'').trim()||'Módulo sem nome';
      if(!String(course.name||'').trim()||!String(course.description||'').trim())issues.push('Informe nome e descrição do módulo.');
      if(!Array.isArray(course.lessons)||!course.lessons.length)issues.push('Cadastre pelo menos uma aula.');
      else {
        const incomplete=course.lessons.filter(l=>!String(l.name||'').trim()||!/^(https:\/\/player\.mux\.com\/[A-Za-z0-9_-]+(?:\?.*)?)$/.test(String(l.url||'')));
        if(incomplete.length)issues.push('Vídeo Mux ausente ou inválido em '+incomplete.length+' aula(s).');
      }
      if(!Array.isArray(course.questions)||!course.questions.length)issues.push('Cadastre a prova do módulo.');
      if(!Number.isFinite(Number(course.passScore))||Number(course.passScore)<0||Number(course.passScore)>100)issues.push('Revise a nota mínima (0 a 100).');
      return {id,name,status:course.status||'draft',ready:issues.length===0,issues};
    });
  }
  function publishReady(academy,courses){
    const modules=inspectModules(academy,courses);
    if(!modules.length)return 'Adicione pelo menos um módulo.';
    const invalid=modules.find(item=>!item.ready);
    if(invalid)return invalid.name+': '+invalid.issues[0];
    const draft=modules.find(item=>item.status!=='published');
    if(draft)return draft.name+': módulo pronto, mas ainda em rascunho. Publique-o no construtor ou use a publicação conjunta da Academia.';
    return '';
  }
  function eligibleExam(course,state,requests,studentId){
    if(!lessonDone(course,state))return {allowed:false,reason:'Conclua todas as aulas antes da prova do módulo.'};
    const history=attempts(course.id,state);
    if(!history.length)return {allowed:true,initial:true};
    if(history.some(a=>a.passed))return {allowed:false,reason:'Módulo aprovado. Não é necessário refazer a prova.'};
    const status=requestStatus(requests,studentId,course.id,history.length+1);
    if(status==='approved')return {allowed:true,initial:false};
    return {allowed:false,reason:status==='pending'?'Solicitação enviada. Aguarde a autorização do ADM Master.':'Após reprovação, solicite uma nova tentativa ao ADM Master.'};
  }
  const api={MOD,copy,today,moduleIds,validDate,activeEnrollment,lessonDone,attempts,passed,requestStatus,buildMap,programState,guardProgram,inspectModules,publishReady,eligibleExam};
  root.CONTREM_PROGRAM_CORE=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
