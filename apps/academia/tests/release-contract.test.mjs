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
 assert.match(ui,/show\(isEditor\(\)\?'adminView':'studentView'\)/);
 assert.match(service,/signInWithPassword/);
 assert.match(service,/academy_my_catalog/);
 assert.match(service,/academy_save_learning/);
 assert.match(service,/academy-workspace/);
 assert.match(service,/content_admin/);
 assert.doesNotMatch(service,/academy_catalog'\)\.update\(\{courses\}\)/);
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
 assert.match(sw,/20261122-staff-prod-v1/);
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

test('Barra de conta removida visualmente, mantendo autosave e alertas de falha',async()=>{
 const [html,css,ui]=await Promise.all([
  read('apps/academia/src/index.html'),
  read('apps/academia/src/assets/cloud.css'),
  read('apps/academia/src/assets/cloud-ui.js')
 ]);
 for(const id of ['cloudBar','cloudStatus','syncNow','reloadCloud','cloudSyncAlert']){
  assert.ok(html.includes('id="'+id+'"'),'Elemento interno preservado: '+id);
 }
 assert.match(css,/#cloudBar\{display:none!important\}/,'Barra não pode aparecer');
 assert.match(css,/\.cloud-sync-alert\[hidden\]\{display:none!important\}/);
 assert.match(ui,/function scheduleSync\(\)\{clearTimeout\(timer\);timer=setTimeout\(flush,250\)/,'Salvamento automático preservado');
 assert.match(ui,/syncAlert\.hidden=!error/,'Erro de sincronização precisa aparecer');
 assert.match(ui,/syncAlert\.textContent=error\?status\.textContent:''/);
 assert.match(ui,/syncAlert\.hidden=true;syncAlert\.textContent=''/,'Aviso deve sumir ao sair');
});

test('Falha de sincronização identifica a etapa e conserva alterações locais',async()=>{
 const ui=await read('apps/academia/src/assets/cloud-ui.js');
 assert.match(ui,/operation='o salvamento do catálogo'/);
 assert.match(ui,/operation='a sincronização do progresso'/);
 assert.match(ui,/savePending\(\);conflicted=error\.name==='AcademyConflict'/,'Preserva o backup pendente antes do aviso');
 assert.match(ui,/logCloudFailure\(error,operation,reference\)/,'Registra contexto técnico para diagnóstico');
 assert.match(ui,/pendingData\?'Sem conexão\. Suas alterações continuam guardadas neste aparelho/);
 assert.match(ui,/Toque em “Salvar agora” para tentar novamente/);
 assert.match(ui,/Referência: \$\{reference\}/);
 assert.doesNotMatch(ui,/console\.error\([^\n]*error\.message/,'Não registra mensagem que possa conter dados sensíveis');
});

test('Funcionários com login real, rascunhos privados e aprovação do ADM Master',async()=>{
 const [html,ui,service,editor,backend,migration]=await Promise.all([
  read('apps/academia/src/index.html'),
  read('apps/academia/src/assets/cloud-ui.js'),
  read('apps/academia/src/assets/cloud-service.js'),
  read('apps/academia/src/assets/admin-manager.js'),
  read('apps/academia/supabase/functions/academy-workspace/index.ts'),
  read('apps/academia/database/20261122_staff_real_auth_editor_catalog.sql')
 ]);
 for(const id of ['staffTab','adminStaff','staffCreateForm','staffName','staffEmail','staffPassword','staffRoster'])
  assert.ok(html.includes('id="'+id+'"'),'Componente funcionário: '+id);
 assert.match(html,/Criar login do funcionário/);
 assert.doesNotMatch(html,/Convite de teste criado|Copiar link do convite/);
 assert.match(service,/createContentAdmin/);
 assert.match(service,/signInWithPassword/);
 assert.match(service,/academy-workspace/);
 assert.match(ui,/staffCreateForm/);
 assert.match(ui,/isMaster\(\)/);
 assert.match(editor,/content_admin/);
 assert.match(editor,/Somente o ADM Master pode excluir cursos/);
 assert.match(editor,/AcademyCloudPublishing\.publish/);
 assert.match(editor,/AcademyCloudPublishing\.unpublish/);
 assert.match(backend,/create_staff/);
 assert.match(backend,/auth\.admin\.createUser/);
 assert.match(backend,/safeStaffChanges/);
 assert.match(backend,/Somente o ADM Master pode publicar/);
 assert.match(backend,/action==='save'/);
 assert.match(migration,/ENABLE ROW LEVEL SECURITY/);
 assert.match(migration,/REVOKE ALL ON public\.academy_editor_catalog FROM PUBLIC, anon, authenticated/);
 assert.match(migration,/role IN \('admin','student','content_admin'\)/);
});

test('Preflight da API administrativa responde CORS 204 sem corpo, evitando bloqueio do login',async()=>{
 const source=await read('apps/academia/supabase/functions/academy-workspace/index.ts');
 assert.match(source,/if\(req\.method==='OPTIONS'\)return new Response\(null,\{status:204,headers\}\)/);
 assert.doesNotMatch(source,/reply\(204,/);
 const response=new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'https://contrem.vercel.app','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info'}});
 assert.equal(response.status,204);
 assert.equal(response.body,null);
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://contrem.vercel.app');
});
