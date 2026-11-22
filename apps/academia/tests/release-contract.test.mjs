import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const full=p=>resolve(root,p);
const read=p=>readFile(full(p),'utf8');
const exists=async p=>{try{await access(full(p));return true;}catch{return false;}};

test('Publicação da Academia mantém construtor completo do Developer',async()=>{
 const html=await read('apps/academia/src/index.html');
 for(const id of ['cloudLoginForm','cloudEmail','cloudPassword','adminView','studentView','studentRoster','lessonForm','courseForm','cloudBar']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 for(const source of ['admin-manager.js','admin-preview-media.js','assessment-core.js','assessment-author.js']) {
  assert.ok(html.includes('src="assets/'+source+'"'),'script '+source);
  assert.ok(await exists('apps/academia/src/assets/'+source),'file '+source);
 }
 assert.match(await read('apps/academia/src/assets/admin-manager.js'),/CONSTRUTOR DE CURSOS/);
 assert.match(await read('apps/academia/src/assets/admin-manager.js'),/newAdminLesson/);
});

test('Autenticação real, sem acesso demonstrativo',async()=>{
 const [html,config,ui,service]=await Promise.all([
  read('apps/academia/src/index.html'),
  read('apps/academia/src/assets/cloud-config.js'),
  read('apps/academia/src/assets/cloud-ui.js'),
  read('apps/academia/src/assets/cloud-service.js')
 ]);
 for(const id of ['demoAccess','enter','displayName','previewAdminEntry']){
  assert.equal(html.includes('id="'+id+'"'),false,'No demo control '+id);
 }
 assert.doesNotMatch(html,/src="assets\/(?:admin-preview-service|assessment-demo)\.js"/);
 assert.doesNotMatch(html,/Testar a demonstração local|Acessar demonstração local|Contas reais não são utilizadas aqui/);
 assert.match(config,/"mode":"connected"/);
 assert.match(config,/"preview":false/);
 assert.match(config,/"publishableKey":"sb_publishable_/);
 assert.doesNotMatch(config,/sb_secret_|service_role|preview:true/i);
 assert.match(ui,/signIn/);
 assert.match(ui,/mode=config\?\.preview\?'demo':'guest'/);
 assert.match(ui,/show\(identity\.member\.role==='admin'\?'adminView':'studentView'\)/);
 assert.match(service,/signInWithPassword/);
 assert.match(service,/academy_my_catalog/);
 assert.match(service,/academy_save_learning/);
 assert.match(service,/academy_catalog'\)\.update\(\{courses\}\)/);
});
test('Materiais privados, vídeo autorizado e atualização de PWA',async()=>{
 const [ui,media,sw,author]=await Promise.all([
  read('apps/academia/src/assets/cloud-ui.js'),
  read('apps/academia/src/assets/admin-preview-media.js'),
  read('apps/academia/src/sw.js'),
  read('apps/academia/src/assets/assessment-author.js')
 ]);
 assert.match(ui,/service\.playback\(lesson\.videoId\)/);
 assert.match(media,/academy-materials/);
 assert.match(media,/createSignedUrl/);
 assert.match(sw,/20261122-developer-prod-v3/);
 assert.doesNotMatch(sw,/admin-preview-service\.js|assessment-demo\.js|assessment-student\.js/);
 assert.match(author,/mode==='connected'/);
});
test('Build entrega o mesmo código sem alterar outras rotas',async t=>{
 if(!await exists('dist/build-info.json')){t.skip('Build ainda não executado nesta suíte; o workflow de produção testa após compilar.');return;}
 const [html,config,info]=await Promise.all([
  read('dist/academia/index.html'),
  read('dist/academia/assets/cloud-config.js'),
  read('dist/build-info.json')
 ]);
 assert.equal(html,await read('apps/academia/src/index.html'));
 assert.equal(config,await read('apps/academia/src/assets/cloud-config.js'));
 assert.equal(JSON.parse(info).modules.academia,'conectada');
 assert.equal(JSON.parse(info).mode,'estavel');
 for(const path of ['dist/index.html','dist/contremtec/index.html','dist/contremtec/guia/index.html']){
  assert.ok(await exists(path),path);
 }
});
