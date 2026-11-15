import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve,extname,relative} from 'node:path';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
const root=process.cwd(); let checked=0; const issues=[];
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){if(['node_modules','dist','.git','vendor'].includes(e.name))continue;const p=resolve(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p);}return out;}
for(const app of await readdir('apps')){
 const dir=resolve('apps',app);if(!(await stat(dir)).isDirectory())continue;
 let pkg;try{pkg=JSON.parse(await readFile(resolve(dir,'package.json'),'utf8'));}catch(e){if(e.code==='ENOENT')continue;throw e;}
 if(!pkg.name.startsWith('@contrem/')&&app!=='tec')issues.push('Nome de pacote: '+app);
 const cfg=JSON.parse(await readFile(resolve(dir,'vercel.json'),'utf8'));
 if(cfg.git?.deploymentEnabled?.['**']!==false||cfg.git?.deploymentEnabled?.develop!==true)issues.push('Controle de deploy: '+app);
 for(const p of await walk(dir)){
  if(!['.js','.mjs','.cjs','.html'].includes(extname(p)))continue;
  const data=await readFile(p,'utf8');
  if(extname(p)==='.html'){
   for(const m of data.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
    if(/\bsrc\s*=|application\/(?:json|ld\+json)/i.test(m[1])||!m[2].trim())continue;
    try{if(/type\s*=\s*["']module/.test(m[1])){const r=spawnSync(process.execPath,['--check','--input-type=module'],{input:m[2],encoding:'utf8'});if(r.status)throw new Error(r.stderr);}else new vm.Script(m[2],{filename:p});checked++;}catch(e){issues.push(relative(root,p)+': '+e.message);}
   }
  }else{
   const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});if(r.status)issues.push(relative(root,p)+': '+r.stderr);checked++;
  }
 }
}
if(issues.length){console.error(issues.join('\n'));process.exit(1);}
console.log(`Configuração e sintaxe: ${checked} scripts verificados.`);
