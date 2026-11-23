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
  const validMux=url=>/^https:\/\/player\.mux\.com\/[A-Za-z0-9_-]{20,255}(?:[/?#].*)?$/.test(String(url||''));
  // Explicit toggles override legacy module records; legacy published modules stay enabled for compatibility.
  const moduleActive=course=>!!course&&course.status==='published'&&course.moduleEnabled!==false;
  const firstVideoReady=course=>!!course?.lessons?.length&&validMux(course.lessons[0].url);
  const lessonCheckpointKey=(courseId,lessonId)=>'lesson-assessment:'+courseId+':'+lessonId;
  function lessonCompleted(course,lesson,state){
    if(!course||!lesson||(state?.progress?.[course.id]||[]).includes(lesson.id)===false)return false;
    if(!Array.isArray(lesson.questions)||!lesson.questions.length)return true;
    return (state?.progress?.[lessonCheckpointKey(course.id,lesson.id)]||[]).some(a=>a?.passed===true);
  }
  function lessonDone(course,state){return !!course?.lessons?.length&&course.lessons.every(lesson=>lessonCompleted(course,lesson,state));}
  function nextLessonIndex(course,state){
    if(!course?.lessons?.length)return -1;
    const next=course.lessons.findIndex(lesson=>!lessonCompleted(course,lesson,state));
    return next<0?course.lessons.length-1:next;
  }
  function attempts(courseId,state){return Array.isArray(state?.progress?.['assessment:'+courseId])?state.progress['assessment:'+courseId]:[];}
  function passed(course,state){return lessonDone(course,state)&&(!course.questions?.length||attempts(course.id,state).some(a=>a.passed===true));}
  function requestStatus(requests,studentId,courseId,n){
    const last=(requests||[]).filter(r=>r.studentId===studentId&&r.courseId===courseId&&r.forAttempt===n).slice(-1)[0];
    return last?.status||null;
  }
  function buildMap(academy,courses,state,enrollment,requests=[],studentId=''){
    const ordered=moduleIds(academy),courseMap=new Map(courses.map(c=>[c.id,c]));
    let unlocked=activeEnrollment(enrollment);
    return ordered.map((id,index)=>{
      const course=courseMap.get(id),priorClear=unlocked,done=lessonDone(course,state),history=attempts(id,state);
      const approved=!!course&&passed(course,state),retry=requestStatus(requests,studentId,id,history.length+1);
      const enabled=moduleActive(course),hasVideo=firstVideoReady(course),canOpen=priorClear&&activeEnrollment(enrollment)&&enabled&&hasVideo;
      let status='blocked';
      if(!activeEnrollment(enrollment))status='expired';
      else if(priorClear&&approved)status='approved';
      else if(priorClear&&!enabled)status='inactive';
      else if(priorClear&&!hasVideo)status='preparing';
      else if(priorClear&&course?.questions?.length&&history.some(a=>!a.passed)&&!approved)
        status=retry==='approved'?'retry-approved':retry==='pending'?'retry-pending':'failed';
      else if(priorClear)status=done&&course?.questions?.length?'awaiting-exam':'available';
      unlocked=unlocked&&approved;
      return {id,index,status,name:course?.name||'Módulo em preparação',hours:Number(course?.hours)||0,
        lessons:course?.lessons?.length||0,done:!!done,passed:approved,attempts:history.length,
        enabled,hasVideo,canOpen,retake:retry};
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
      if(!course)return {id,name:'Módulo não encontrado',status:'missing',ready:false,enabled:false,issues:['Módulo não encontrado.']};
      const name=String(course.name||'').trim()||'Módulo sem nome';
      if(!String(course.name||'').trim()||!String(course.description||'').trim())issues.push('Informe nome e descrição do módulo.');
      if(!course.lessons?.length)issues.push('Cadastre a primeira aula para liberar este módulo.');
      else if(!firstVideoReady(course))issues.push('Cadastre um vídeo Mux válido na primeira aula para liberar o módulo.');
      // Subsequent lessons can remain in preparation. Each is automatically gated until its Mux video exists.
      const missing=(course.lessons||[]).slice(1).filter(l=>!validMux(l.url)).length;
      return {id,name,status:course.status||'draft',ready:issues.length===0,enabled:moduleActive(course),
        missingLessons:missing,issues};
    });
  }
  // Publishing a formation publishes the plan; lesson/module access is controlled separately.
  function publishReady(academy,courses){
    if(!moduleIds(academy).length)return 'Cadastre pelo menos um módulo para organizar a formação.';
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
  const api={MOD,copy,today,moduleIds,validDate,activeEnrollment,validMux,moduleActive,firstVideoReady,lessonCheckpointKey,lessonCompleted,lessonDone,nextLessonIndex,attempts,passed,requestStatus,buildMap,programState,guardProgram,inspectModules,publishReady,eligibleExam};
  root.CONTREM_PROGRAM_CORE=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
