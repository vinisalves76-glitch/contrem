// Shared deterministic assessment contract. No storage or account access.
(() => {
 'use strict';
 const types=new Set(['single','multi','order','match']);
 const copy=value=>JSON.parse(JSON.stringify(value));
 function text(value,max,label,required=false){if(value===undefined||value===null)return required?fail(label):'';if(typeof value!=='string'||value.length>max||(required&&!value.trim()))fail(label);return value.trim();}
 function fail(label){throw Error('Questão inválida: '+label+'.');}
 function image(value){if(!value)return '';if(typeof value!=='string'||value.length>2000)fail('imagem');try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)fail('imagem HTTPS');return u.href;}catch{fail('imagem HTTPS');}}
 function normalizeQuestion(value){
  if(!value||typeof value!=='object')fail('estrutura');
  const type=value.type===undefined?'single':value.type;if(!types.has(type))fail('tipo');
  if(!Array.isArray(value.choices)||value.choices.length<2||value.choices.length>8)fail('2 a 8 alternativas');
  const choices=value.choices.map(v=>text(v,500,'alternativa',true));
  const q={id:value.id===undefined?'':text(value.id,120,'identificador'),type,text:text(value.text,3000,'enunciado',true),choices,correct:copy(value.correct===undefined?null:value.correct)};
  if(type==='single'){if(!Number.isInteger(q.correct)||q.correct<0||q.correct>=choices.length)fail('resposta correta');}
  else{
   if(!Array.isArray(q.correct)||!q.correct.length||q.correct.some(i=>!Number.isInteger(i)||i<0||i>=choices.length)||new Set(q.correct).size!==q.correct.length)fail('respostas corretas');
   if(type==='multi')q.correct.sort((a,b)=>a-b);
   else if(q.correct.length!==choices.length)fail('permutação completa');
  }
  if(type==='match'){if(!Array.isArray(value.items)||value.items.length!==choices.length)fail('pares de associação');q.items=value.items.map(v=>text(v,500,'item de associação',true));}
  for(const key of ['competency','context','explanation']){const v=text(value[key],key==='competency'?150:4000,key);if(v)q[key]=v;}
  const img=image(value.imageUrl);if(img)q.imageUrl=img;
  if(value.illustration){if(!['engine','fluid','circuit'].includes(value.illustration))fail('ilustração');q.illustration=value.illustration;}
  return q;
 }
 function validateQuestions(list){if(!Array.isArray(list)||list.length>100)fail('até 100 questões');const ids=new Set();return list.map(value=>{const q=normalizeQuestion(value);if(q.id&&ids.has(q.id))fail('identificador duplicado');if(q.id)ids.add(q.id);return q;});}
 function answered(q,answer){if(q.type==='single')return Number.isInteger(answer)&&answer>=0&&answer<q.choices.length;return Array.isArray(answer)&&answer.length>0&&answer.every(i=>Number.isInteger(i)&&i>=0&&i<q.choices.length)&&new Set(answer).size===answer.length&&(q.type==='multi'||answer.length===q.choices.length);}
 function gradeQuestion(value,answer){const q=normalizeQuestion(value);if(!answered(q,answer))return false;if(q.type==='single')return q.correct===answer;const candidate=q.type==='multi'?[...answer].sort((a,b)=>a-b):answer;return JSON.stringify(candidate)===JSON.stringify(q.correct);}
 function grade(list,answers,passScore=70){const questions=validateQuestions(list);if(!questions.length)throw Error('Cadastre questões antes de avaliar.');if(!Number.isFinite(passScore)||passScore<0||passScore>100)throw Error('Nota mínima inválida.');const competencies={};let correct=0;questions.forEach((q,i)=>{const ok=gradeQuestion(q,answers?.[i]);correct+=Number(ok);const key=q.competency||'Geral';if(!Object.hasOwn(competencies,key))Object.defineProperty(competencies,key,{value:{correct:0,total:0,score:0},enumerable:true,writable:true});competencies[key].total++;competencies[key].correct+=Number(ok);});Object.values(competencies).forEach(c=>c.score=Math.round(c.correct/c.total*100));const rawScore=correct/questions.length*100,score=Math.round(rawScore*100)/100;return {score,correct,total:questions.length,passed:rawScore>=passScore,competencies};}
 function config(questions,passScore=70){if(!Number.isFinite(passScore)||passScore<0||passScore>100)throw Error('Nota mínima inválida.');return {version:1,questions:validateQuestions(questions),passScore:Number(passScore)};}
 const fingerprint=value=>JSON.stringify(value);
 const api={normalizeQuestion,validateQuestion:normalizeQuestion,validateQuestions,answered,gradeQuestion,grade,config,fingerprint};
 if(typeof window!=='undefined')window.AcademyAssessment=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
