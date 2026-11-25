// Cada aplicação controla somente seu caminho e seu próprio cache de shell.
const BASE = new URL(self.registration.scope);
const PREFIX = 'contrem-tec-shell-' + encodeURIComponent(BASE.pathname) + '-';
const CACHE_NAME = PREFIX + '20261115-path-v1';
const SHELL = ["/", "/index.html", "/offline.html", "/manifest.webmanifest", "/pwa-icon.svg", "/css/styles.css", "/css/onboarding.css", "/css/trainings.css", "/css/checklist-trem-forca.css", "/css/agenda.css", "/css/gestao-operacional.css", "/css/contremtec.css", "/css/base.css", "/css/assistant.css", "/js/pwa.js", "/js/checklist-trem-forca.js", "/js/app.js", "/js/modules/operational-shift-reports.js", "/js/modules/operational-mechanic-schedule.js", "/js/modules/operational-125h-checklist.js", "/js/modules/operational-crud.js", "/js/modules/maintenance-125h.js", "/js/shared/html.js", "/js/core/permissions.js", "/js/core/local-preview-adapter.js", "/assets/technical-background.svg", "/assets/contremtec-logo.svg", "/assets/contrem-logo.svg", "/assets/contremtec-logo-dark.svg"].map(path => new URL('.' + path, BASE).pathname);
const SHELL_PATHS = new Set(SHELL);
const HOME = new URL('index.html', BASE).pathname;
const FALLBACK = new URL('offline.html', BASE).pathname;
const owns = url => url.origin === BASE.origin && url.pathname.startsWith(BASE.pathname);
self.addEventListener('install', event => {
 event.waitUntil((async () => {
  const responses = await Promise.all(SHELL.map(async path => {
   const response = await fetch(new Request(new URL(path, BASE.origin), {cache:'reload'}));
   if(!response.ok || response.redirected || (path.endsWith('.js') && !/javascript/.test(response.headers.get('content-type') || ''))) throw new Error('Shell indisponível: ' + path);
   return [path, response];
  }));
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(responses.map(([path,response]) => cache.put(path,response)));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  const old = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE_NAME);
  await Promise.all(old.map(key => caches.delete(key)));
  await self.clients.claim();
 })());
});
self.addEventListener('message', event => {if(event.data?.type==='SKIP_WAITING') self.skipWaiting();});
self.addEventListener('fetch', event => {
 const request=event.request, url=new URL(request.url);
 if(request.method!=='GET' || !owns(url)) return;
 const home=url.pathname===BASE.pathname || url.pathname===HOME;
 // APIs, dados privados e vídeos não pertencem à lista de shell.
 if(!SHELL_PATHS.has(url.pathname) && !(request.mode==='navigate' && home)) return;
 event.respondWith((async () => {
  const path=home?HOME:url.pathname;
  try {
   const response=await fetch(new Request(request,{cache:'no-store'}));
   if(response.ok && !response.redirected){
    const copy=response.clone();
    event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(path,copy)).catch(()=>{}));
    return response;
   }
  } catch {}
  return (await caches.match(path,{cacheName:CACHE_NAME})) || (home && await caches.match(FALLBACK,{cacheName:CACHE_NAME})) || Response.error();
 })());
});
