// Cada aplicação controla somente seu caminho e seu próprio cache de shell.
const BASE = new URL(self.registration.scope);
const PREFIX = 'contrem-academia-shell-' + encodeURIComponent(BASE.pathname) + '-';
const CACHE_NAME = PREFIX + '20261122-developer-prod-v3';
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/assets/contrem.css", "/assets/contrem.js", "/assets/pwa.js", "/assets/cloud.css", "/assets/cloud-store.js", "/assets/cloud-config.js", "/assets/admin-manager.js", "/assets/assessment-core.js", "/assets/assessment-author.js", "/assets/assessment.css", "/assets/assessment-author.css", "/assets/admin-manager.css", "/assets/admin-preview-media.js", "/assets/cloud-service.js", "/assets/cloud-ui.js", "/assets/vendor/supabase-2.119.0.js", "/assets/logo.svg", "/assets/campo.webp", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png", "/icons/apple-touch-icon.png"].map(path => new URL('.' + path, BASE).pathname);
const SHELL_PATHS = new Set(SHELL);
const HOME = new URL('index.html', BASE).pathname;
const FALLBACK = new URL('index.html', BASE).pathname;
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
