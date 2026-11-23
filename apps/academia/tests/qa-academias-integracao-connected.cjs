'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const src=path.resolve(__dirname,'../src');
const read=p=>fs.readFileSync(path.join(src,p),'utf8');
const ui=read('assets/academy-connected-ui.js');
const html=read('index.html');
const cloud=read('assets/cloud-ui.js');
const portal=read('trilha-formacao/index.html');
const styles=read('trilha-formacao/style.css');
const edge=fs.readFileSync(path.join(__dirname,'../supabase/functions/academy-programs/index.ts'),'utf8');
const schema=fs.readFileSync(path.join(__dirname,'../supabase/migrations/20261123022000_academia_programas_integrados.sql'),'utf8');

test('O login real e cursos avulsos continuam carregando',()=>{
 assert.match(html,/id="cloudLoginForm"/);
 assert.match(html,/src="assets\/cloud-ui\.js"/);
 assert.match(html,/src="assets\/admin-manager\.js"/);
 assert.match(html,/src="assets\/cloud-service\.js"/);
 assert.doesNotMatch(html,/src="assets\/admin-preview-service\.js"/);
 assert.match(cloud,/contrem:academy-session-ready/);
 assert.match(cloud,/contrem:academy-session-ended/);
});
test('O painel original aprovado da trilha está no build junto à integração',()=>{
 assert.match(html,/trilha-formacao\/catalog\.js/);
 assert.match(html,/src="assets\/academy-connected-ui\.js"/);
 assert.match(html,/assets\/academy-connected-ui\.css/);
 assert.match(portal,/class="sidebar"/);
 assert.match(portal,/class="hero"/);
 assert.match(portal,/class="stage-grid"/);
 assert.match(styles,/\.side-nav-item\.current/);
});
test('ADM reúne publicação integral, Ativar/Desativar e matrícula pelo servidor',()=>{
 assert.match(ui,/api\('save'/);
 assert.match(ui,/api\('publish'/);
 assert.match(ui,/api\('toggle'/);
 assert.match(ui,/api\('enroll'/);
 assert.match(ui,/data-toggle-module/);
 assert.match(ui,/data-enable="true"/);
 assert.match(ui,/data-enable="false"/);
 assert.match(ui,/connectedPreviewProgram/);
 assert.match(ui,/seedDefinition/);
});
test('Aluno abre portal só por matrícula, sem trocar o sistema de login',()=>{
 assert.match(ui,/api\('my'/);
 assert.match(ui,/contrem:academy-ready/);
 assert.match(ui,/contrem:academy-data/);
 assert.match(ui,/msg\.academyId===currentPayload\?\.academy\.id/);
 assert.match(ui,/currentPayload\?\.map\?\.items\.some/);
 assert.match(ui,/contrem:academy-action/);
});
test('API valida JWT, membro, papel, matrícula e CORS exato',()=>{
 assert.match(edge,/db\.auth\.getUser\(token\)/);
 assert.match(edge,/\.eq\('user_id',user\.id\)/);
 assert.match(edge,/if\(!master\)return reply\(403/);
 assert.match(edge,/if\(!editor\)return reply\(403/);
 assert.match(edge,/\.eq\('member_id',m\.id\)/);
 assert.match(edge,/if\(origin&&!permittedOrigin\(origin\)\)/);
 assert.match(edge,/new Response\(null,\{status:204,headers\}\)/);
 assert.doesNotMatch(edge,/\\\*\.vercel\.app/);
});
test('Tabelas separadas com RLS e sem permissão de navegador',()=>{
 assert.match(schema,/academy_programs enable row level security/);
 assert.match(schema,/academy_program_enrollments enable row level security/);
 assert.match(schema,/revoke all on table public\.academy_programs from public,anon,authenticated/);
 assert.match(schema,/revoke all on table public\.academy_program_enrollments from public,anon,authenticated/);
});
