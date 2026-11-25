import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import {resolve,dirname} from 'node:path';
const exists=async p=>{try{await access(p);return true;}catch{return false;}};
test('Publicação central monta as aplicações e não inclui fontes internas',async()=>{
 for(const p of ['index.html','academia/index.html','contremtec/index.html','contremtec/guia/index.html'])assert(await exists('dist/'+p),p);
 for(const p of ['AGENTS.md','docs','server','academia/server','contremtec/server','contremtec/database'])assert.equal(await exists('dist/'+p),false,p);
 const home=await readFile('dist/index.html','utf8');assert(home.includes('href="/academia/"'));assert(home.includes('href="/contremtec/"'));
});
for(const app of ['academia','contremtec']){
 test(`${app}: manifest, assets locais e service worker ficam no caminho do módulo`,async()=>{
  if(!await exists(`dist/${app}/manifest.webmanifest`))return;
  const m=JSON.parse(await readFile(`dist/${app}/manifest.webmanifest`,'utf8'));
  for(const key of ['id','scope','start_url'])assert.equal(new URL(m[key],`https://contrem.test/${app}/manifest.webmanifest`).pathname,`/${app}/`,key);
  for(const icon of m.icons)assert(await exists('dist'+new URL(icon.src,`https://contrem.test/${app}/manifest.webmanifest`).pathname));
  const html=await readFile(`dist/${app}/index.html`,'utf8');
  for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
   const url=new URL(match[1],`https://contrem.test/${app}/`);
   if(url.origin!=='https://contrem.test'||!url.pathname.startsWith(`/${app}/`)||url.hash)continue;
   const path='dist'+decodeURI(url.pathname);assert(await exists(path)||await exists(path+'/index.html'),url.pathname);
  }
  const events={},deleted=[],written=[];
  const scope=`https://contrem.test/${app}/`;
  const context={URL,Request,Response,console,encodeURIComponent,self:{registration:{scope},location:new URL(scope),addEventListener:(name,fn)=>events[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{keys:async()=>['foreign-cache','contrem-other-shell-old'],delete:async key=>deleted.push(key),open:async()=>({put:async path=>written.push(path)}),match:async()=>undefined},fetch:async()=>new Response('ok',{headers:{'content-type':'application/javascript'}})};
  vm.runInNewContext(await readFile(`dist/${app}/sw.js`,'utf8'),context);
  const promises=[];events.activate({waitUntil:p=>promises.push(p)});await Promise.all(promises);assert.deepEqual(deleted,[]);
  const event=url=>({request:{method:'GET',url,mode:'navigate'},waitUntil:()=>{},respondWith:()=>assert.fail('Interceptou outro módulo/API')});
  events.fetch(event('https://contrem.test/'));events.fetch(event('https://contrem.test/'+(app==='academia'?'contremtec':'academia')+'/'));
  events.fetch(event(scope+'api/private'));events.fetch(event('https://stream.mux.com/video.m3u8'));
  let intercepted=false;events.fetch({request:new Request(scope+'assets/logo.svg'),waitUntil:()=>{},respondWith:p=>{intercepted=true;p.catch(()=>{});}});
  if(app==='academia')assert.equal(intercepted,true);
 });
}
test('CSS dos módulos não busca imagens na raiz de outra aplicação',async()=>{
 if(!await exists('dist/contremtec/css'))return;
 for(const file of await readdir('dist/contremtec/css')){
  const path='dist/contremtec/css/'+file;
  const css=await readFile(path,'utf8');
  for(const m of css.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)){
   if(/^(data:|https?:)/.test(m[1]))continue;
   const url=new URL(m[1],`https://contrem.test/contremtec/css/${file}`);assert(url.pathname.startsWith('/contremtec/'));assert(await exists('dist'+url.pathname));
  }
 }
});
