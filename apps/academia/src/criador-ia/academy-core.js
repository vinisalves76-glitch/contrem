/* CONTREM Studio - pure Academy authoring model. Matches academy-programs clean() limits. */
(function(root){
 'use strict';
 const clone=value=>JSON.parse(JSON.stringify(value));
 const object=value=>value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const short=(value,max)=>String(value??'').trim().slice(0,max);
 const uuid=()=>root.crypto?.randomUUID?.()||('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx').replace(/[xy]/g,c=>{const r=Math.floor(Math.random()*16);return(c==='x'?r:(r&3|8)).toString(16)});
 const id=prefix=>prefix+'-'+uuid().replace(/-/g,'');
 const slug=value=>short(value,160).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)||'formacao';
 const num=(value,min,max,fallback=0)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback};
 const stage=(title='Fundamentos')=>({id:id('stage'),title:short(title,120),cardTitle:'',cardDescription:'',moduleIds:[]});
 const createModule=(name='Novo módulo')=>({id:id('module'),name:short(name,180),description:'',hours:0,moduleEnabled:false,lessons:[],questions:[],passScore:80});
 const lesson=(name='Nova aula')=>({id:id('lesson'),name:short(name,180),description:'',videoId:'',minutes:0});
 const create=title=>({
  id:'academy-'+slug(title||'Nova Academia')+'-'+uuid().slice(0,8),
  revision:null,status:'draft',
  definition:{title:short(title||'Nova Academia',180),description:'',heroKicker:'TRILHA DE CONHECIMENTO',
   heroTitle:short(title||'Nova Academia',180),heroHighlight:'',heroDescription:'',
   stageHeading:'Etapas da formação',audience:'',objectives:'',cover:'',certificateEnabled:false,
   stages:[stage()],modules:[]}
 });
 function fromJSON(input){
  const envelope=object(input);
  const a=object(envelope.definition||envelope.academy?.definition||envelope.academy||envelope);
  if(!a.title||!Array.isArray(a.stages)||a.stages.length<1||a.stages.length>15)throw Error('O JSON precisa ter título e entre 1 e 15 etapas.');
  const sourceModules=Array.isArray(a.modules)?a.modules:[];
  if(sourceModules.length>90)throw Error('O JSON excede 90 módulos.');
  const lookup=new Map();
  for(const m of sourceModules){if(!object(m).id||lookup.has(String(m.id)))throw Error('O JSON contém módulos sem ID ou com ID duplicado.');lookup.set(String(m.id),m);}
  const out=create(a.title),d=out.definition;
  d.description=short(a.description,4000);d.heroKicker=short(a.heroKicker||'TRILHA DE CONHECIMENTO',160);
  d.heroTitle=short(a.heroTitle||a.title,180);d.heroHighlight=short(a.heroHighlight,80);
  d.heroDescription=short(a.heroDescription,700);d.stageHeading=short(a.stageHeading||'Etapas da formação',150);
  d.audience=short(a.audience,600);d.objectives=short(a.objectives,2000);
  d.certificateEnabled=a.certificateEnabled===true;
  const cover=short(a.cover,900001);
  if(cover&&!(cover.length<=900000&&(/^https:\/\//i.test(cover)||/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(cover))))throw Error('A capa deve ser uma URL HTTPS ou imagem válida de até 900 KB.');
  d.cover=cover;d.stages=[];d.modules=[];
  const seen=new Set();
  for(const originalStage of a.stages){
   const s=object(originalStage);
   if(!short(s.title,120))throw Error('Todas as etapas importadas precisam de nome.');
   const ns=stage(s.title);ns.cardTitle=short(s.cardTitle,150);ns.cardDescription=short(s.cardDescription,320);
   const nested=Array.isArray(s.modules)?s.modules:null;
   const refs=Array.isArray(s.moduleIds)?s.moduleIds:[];
   const rows=nested||refs.map(key=>{const value=lookup.get(String(key));if(!value)throw Error('O módulo '+String(key)+' não foi encontrado no JSON.');if(seen.has(String(key)))throw Error('O mesmo módulo aparece em duas etapas.');seen.add(String(key));return value;});
   for(const originalModule of rows){
    if(d.modules.length>=90)throw Error('A Academia ultrapassa 90 módulos.');
    const m=object(originalModule);
    if(!short(m.name||m.title,180))throw Error('Cada módulo importado precisa de nome.');
    const nm=createModule(m.name||m.title);
    nm.description=short(m.description,1200);nm.hours=num(m.hours,0,1000);nm.passScore=num(m.passScore,0,100,80);
    const ls=Array.isArray(m.lessons)?m.lessons:[];
    if(ls.length>150)throw Error('Um módulo não pode ultrapassar 150 aulas.');
    nm.lessons=ls.map(item=>{
     const l=typeof item==='string'?{name:item}:object(item);
     if(!short(l.name||l.title,180))throw Error('Uma aula importada está sem título.');
     const nl=lesson(l.name||l.title);nl.description=short(l.description,1200);
     nl.minutes=num(l.minutes,0,600);
     const video=short(l.videoId,36);
     if(video&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(video))throw Error('Uma aula contém vídeo incompatível. Use o ID interno de vídeo da Academia.');
     nl.videoId=video;return nl;
    });
    ns.moduleIds.push(nm.id);d.modules.push(nm);
   }
   d.stages.push(ns);
  }
  if(lookup.size&&seen.size!==lookup.size&&a.stages.every(s=>!Array.isArray(s.modules)))throw Error('Existem módulos não vinculados a nenhuma etapa.');
  validate(d);return out;
 }
 function validate(d){
  if(!d||short(d.title,180).length<3)throw Error('Informe um título de Academia com pelo menos 3 caracteres.');
  if(!Array.isArray(d.stages)||!d.stages.length||d.stages.length>15)throw Error('Cadastre de 1 a 15 etapas.');
  if(!Array.isArray(d.modules)||d.modules.length>90)throw Error('Cadastre no máximo 90 módulos.');
  const byId=new Map(d.modules.map(m=>[m.id,m])),used=new Set();
  for(const s of d.stages){
   if(!s.id||!short(s.title,120))throw Error('Preencha o nome de cada etapa.');
   for(const moduleId of s.moduleIds||[]){
    if(used.has(moduleId)||!byId.has(moduleId))throw Error('Há módulo duplicado ou não encontrado na etapa.');
    used.add(moduleId);
   }
  }
  if(used.size!==byId.size)throw Error('Todos os módulos precisam pertencer a uma etapa.');
  for(const m of d.modules){
   if(!short(m.name,180))throw Error('Preencha o nome de todos os módulos.');
   if(!Array.isArray(m.lessons)||m.lessons.length>150)throw Error('Limite de 150 aulas por módulo.');
   for(const l of m.lessons)if(!short(l.name,180))throw Error('Preencha o título de cada aula.');
  }
  return true;
 }
 const downloadObject=definition=>({format:'contrem-academia-v1',schemaVersion:1,academy:clone(definition)});
 const api={clone,slug,id,stage,module:createModule,lesson,create,fromJSON,validate,downloadObject};
 root.CONTREM_STUDIO_ACADEMY_CORE=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
