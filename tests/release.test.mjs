import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=path=>readFile(path,'utf8');

test('Academia: configuração pública usa Supabase real, backend conectado e sessão persistente',async()=>{
 const [config,connected,service]=await Promise.all([
  source('apps/academia/src/assets/cloud-config.js'),
  source('apps/academia/src/assets/cloud-connected.js'),
  source('apps/academia/src/assets/cloud-service.js')
 ]);
 assert.match(config,/"mode":"connected"/);
 assert.match(config,/"preview":false/);
 assert.match(config,/"url":"https:\/\/[a-z0-9-]+\.supabase\.co"/);
 assert.match(config,/"publishableKey":"sb_publishable_/);
 assert.match(config,/"playbackFunction":"academy-playback"/);
 assert.doesNotMatch(config,/sb_secret_|service_role|preview:true/);
 assert.match(connected,/service\.signIn\(/);
 assert.match(connected,/service\.restore\(\)/);
 assert.match(connected,/service\.signOut\(\)/);
 assert.match(connected,/storageKey:'contrem-academia-auth-v1'/);
 assert.match(service,/signInWithPassword/);
 assert.match(service,/academy_my_catalog/);
 assert.match(service,/academy_save_learning/);
});

test('Academia: interface sem demonstração e com fail-closed antes da autenticação',async()=>{
 const [html,cloud,connected,intro]=await Promise.all([
  source('apps/academia/src/index.html'),
  source('apps/academia/src/assets/cloud-ui.js'),
  source('apps/academia/src/assets/cloud-connected.js'),
  source('apps/academia/src/assets/contrem.js')
 ]);
 for(const id of ['cloudLoginForm','cloudEmail','cloudPassword'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.doesNotMatch(html,/id="(?:demoAccess|enter|displayName)"/);
 assert.doesNotMatch(html,/Testar a demonstração local|Acessar demonstração local|\$\('enter'\)/);
 assert.match(html,/src="assets\/cloud-connected\.js"/);
 assert.doesNotMatch(cloud+connected+intro,/getElementById\('enter'\)|getElementById\('displayName'\)|resetToDemo|demoEnter\(\)/);
 assert.match(cloud,/config\.mode!=='connected'/);
 assert.match(cloud,/app\.classList\.add\('hidden'\)/);
 assert.match(cloud,/form\.querySelector\('button'\)\.disabled=true/);
 assert.match(connected,/if\(!identity\)/);
 assert.match(intro,/data-intro-play/);
});

test('Academia: autorizações e dados são controlados pelo backend, sem gabaritos ou certificados locais',async()=>{
 const [connected,service,build]=await Promise.all([
  source('apps/academia/src/assets/cloud-connected.js'),
  source('apps/academia/src/assets/cloud-service.js'),
  source('scripts/build-central.mjs')
 ]);
 assert.match(connected,/createStudent\(/);
 assert.match(connected,/setCourseAccess\(/);
 assert.match(connected,/setStudentActive\(/);
 assert.match(connected,/playback\(lesson\.videoId\)/);
 assert.match(connected,/certificates=\[\]/);
 assert.match(service,/A autoria conectada aguarda integração segura/);
 assert.match(service,/client\.rpc\('academy_save_learning'/);
 assert.match(build,/VERCEL_ENV==='production'/);
 assert.match(build,/A release contém acesso à demonstração local/);
});

test('Academia: mantém vídeo institucional, Mux privado e PWA sem aviso de atualização',async()=>{
 const [html,pwa,sw,service]=await Promise.all([
  source('apps/academia/src/index.html'),
  source('apps/academia/src/assets/pwa.js'),
  source('apps/academia/src/sw.js'),
  source('apps/academia/src/assets/cloud-service.js')
 ]);
 assert.match(html,/player\.mux\.com|stream\.mux\.com|Mux/);
 assert.match(service,/policy!=='signed'/);
 assert.match(pwa,/updateBox\?\.remove\(\)/);
 assert.match(pwa,/applyAutomaticUpdate/);
 assert.match(sw,/20261122-backend-connected-v1/);
 assert.match(sw,/assets\/cloud-connected\.js/);
});

test('Academia: build conecta o app e preserva módulos centrais sem demo',async()=>{
 const [html,info,config,connected]=await Promise.all([
  source('dist/academia/index.html'),
  source('dist/build-info.json'),
  source('dist/academia/assets/cloud-config.js'),
  source('dist/academia/assets/cloud-connected.js')
 ]);
 const infoObj=JSON.parse(info);
 assert.equal(infoObj.mode,'estavel');
 assert.equal(infoObj.modules.academia,'conectada');
 assert.match(html,/id="cloudLoginForm"/);
 assert.doesNotMatch(html,/id="(?:demoAccess|enter|displayName)"/);
 assert.match(config,/"mode":"connected"/);
 assert.match(connected,/AcademyConnectedUI/);
});
