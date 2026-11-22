import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(p,'utf8');
test('mesma interface do Developer distribuída na versão conectada, sem reconstruir HTML',async()=>{
 const [source,compiled,admin,media,student]=await Promise.all([
  read('apps/academia/src/index.html'),read('dist/academia/index.html'),
  read('dist/academia/assets/admin-manager.js'),read('dist/academia/assets/admin-preview-media.js'),
  read('dist/academia/assets/assessment-student.js')
 ]);
 assert.equal(compiled,source,'O HTML completo do develop deve permanecer idêntico');
 for(const tag of ['adminLessonOrder','newAdminCourse','newAdminLesson','adminPublish','coursePhotoFile','lessonMaterialFile','assessmentContent','studentRoster'])assert(source.includes(tag)||admin.includes(tag),'Controle do Developer perdido: '+tag);
 assert.match(admin,/CONSTRUTOR DE CURSOS/);assert.match(media,/storage\.upload/);assert.match(student,/function finish/);
});
test('preview conectada usa Auth, banco e PWA sem entrar como aluno fictício',async()=>{
 const [config,service,ui,sw]=await Promise.all([
  read('dist/academia/assets/cloud-config.js'),read('dist/academia/assets/cloud-service.js'),
  read('dist/academia/assets/cloud-ui.js'),read('dist/academia/sw.js')
 ]);
 assert.match(config,/"mode":"connected"/);assert.match(config,/"preview":false/);
 assert.match(config,/"publishableKey":"sb_publishable_/);assert.doesNotMatch(config,/service_role|sb_secret_/i);
 assert.match(service,/signInWithPassword/);assert.match(service,/academy_save_learning/);
 assert.match(service,/academy_catalog'\)\.update\(\{courses\}\)/);
 assert.match(ui,/Importar cursos do Developer/);
 assert.match(ui,/const demoButton=/);assert.match(ui,/demoButton\.disabled=true/);
 assert.match(ui,/mode=config\?\.preview\?'demo':'guest'/);
 assert.match(ui,/AcademyCloudMediaClient=client/);assert.match(ui,/show\(identity\.member\.role==='admin'\?'adminView':'studentView'\)/);
 assert.match(sw,/connected-v2/);
});
test('alunos recebem apenas vídeo assinado e materiais privados por matrícula',async()=>{
 const [ui,service,media,author]=await Promise.all([
  read('dist/academia/assets/cloud-ui.js'),read('dist/academia/assets/cloud-service.js'),
  read('dist/academia/assets/admin-preview-media.js'),read('dist/academia/assets/assessment-author.js')
 ]);
 assert.match(ui,/service\.playback\(lesson\.videoId\)/);
 assert.match(ui,/player\.src='about:blank'/);
 assert.match(service,/data\.policy!=='signed'/);
 assert.match(media,/createSignedUrl\(id,120/);
 assert.match(media,/academy-materials/);
 assert.match(author,/mode==='connected'/);
});
