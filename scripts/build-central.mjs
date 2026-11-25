import {cp,mkdir,rm,readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
async function exists(path){try{await access(path);return true;}catch{return false;}}
const academyConfig=await readFile('apps/academia/src/assets/cloud-config.js','utf8');
const academyHtml=await readFile('apps/academia/src/index.html','utf8');
const admin=academyConfig.includes('preview:true');
if(admin||!academyConfig.includes('"mode":"connected"')||!academyConfig.includes('"preview":false')||!/"publishableKey":"sb_publishable_[a-zA-Z0-9_-]+"/.test(academyConfig)||/sb_secret_|service_role/.test(academyConfig))throw Error('A Academia em produção deve usar somente o cliente Supabase publicável conectado.');
if(/id="(?:demoAccess|enter|displayName|previewAdminEntry)"/.test(academyHtml)||/src="assets\/(?:admin-preview-service|assessment-demo)\.js"/.test(academyHtml))throw Error('A release não pode conter acesso demonstrativo.');

if(process.env.VERCEL_ENV==='production' && admin) throw Error('A produção não pode usar o sandbox ADM da homologação. Publique main.');
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
const sourceFilter=path=>!path.endsWith('.md')&&!path.includes('/docs/')&&!path.endsWith('/docs');
await cp('apps/institucional/src','dist',{recursive:true,filter:sourceFilter});
await cp('apps/academia/src','dist/academia',{recursive:true,filter:sourceFilter});
const tec=await exists('apps/tec/index.html'),guide=await exists('apps/guia/src/index.html');
const placeholder=title=>`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#102A43"><title>${title} | CONTREM</title><link rel="stylesheet" href="/styles.css"><body><main class="container section"><a class="brand" href="/"><img src="/assets/logo.svg" width="49" height="49" alt=""><strong>CONTREM</strong></a><p class="eyebrow" style="margin-top:60px">TECNOLOGIA DE MANUTENÇÃO</p><h1 style="color:#102A43;font-size:60px">${title}</h1><p style="margin:28px 0;max-width:560px">Estamos preparando este ambiente. Em breve, mais recursos para conectar conhecimento técnico e manutenção.</p><a class="button" href="/">Voltar à CONTREM <span>→</span></a> <a class="text-link dark" href="/academia/">Conhecer a Academia →</a></main></body></html>`;
if(tec){
 for(const name of ['index.html','offline.html','manifest.webmanifest','pwa-icon.svg','sw.js','css','js','assets']) await cp('apps/tec/'+name,'dist/contremtec/'+name,{recursive:true});
}else{
 await mkdir('dist/contremtec',{recursive:true});await writeFile('dist/contremtec/index.html',placeholder('ContremTec'));
}
await mkdir('dist/contremtec/guia',{recursive:true});
if(guide)await cp('apps/guia/src','dist/contremtec/guia',{recursive:true,filter:sourceFilter});
else await writeFile('dist/contremtec/guia/index.html',placeholder('Guia de equipamentos'));
const files=['dist/index.html','dist/academia/index.html','dist/contremtec/index.html'];
const hash=createHash('sha256');for(const file of files)hash.update(await readFile(file));
await writeFile('dist/build-info.json',JSON.stringify({project:'CONTREM',commit:process.env.VERCEL_GIT_COMMIT_SHA||null,branch:process.env.VERCEL_GIT_COMMIT_REF||null,mode:admin?'homologacao':'estavel',modules:{academia:admin?'adm-sandbox':'conectada',contremtec:tec?'demonstracao':'em-preparacao',guia:guide?'prototipo':'em-preparacao'},sourceHash:hash.digest('hex')},null,2));
console.log('CONTREM pronta em dist/: /, /academia/, /contremtec/ e /contremtec/guia/.');
