import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = path => readFile(path, 'utf8');

test('release: mantém conexão Supabase com credenciais publicáveis e sessão persistente', async () => {
 const [config, cloud, service] = await Promise.all([
  source('apps/academia/src/assets/cloud-config.js'),
  source('apps/academia/src/assets/cloud-ui.js'),
  source('apps/academia/src/assets/cloud-service.js')
 ]);
 assert.match(config, /"url":"https:\/\/[a-z0-9-]+\.supabase\.co"/);
 assert.match(config, /"publishableKey":"sb_publishable_/);
 assert.doesNotMatch(config, /\bpreview\s*:\s*true\b|sb_secret_|service_role/);
 assert.match(cloud, /signIn\(document\.getElementById\('cloudEmail'\)/);
 assert.match(cloud, /service\.restore\(\)/);
 assert.match(cloud, /service\.signOut\(\)/);
 assert.match(cloud, /storageKey:'contrem-academia-auth-v1'/);
 assert.match(service, /signInWithPassword/);
});

test('release: login é exclusivamente autenticado, sem acesso local de demonstração', async () => {
 const [html, cloud, intro] = await Promise.all([
  source('apps/academia/src/index.html'),
  source('apps/academia/src/assets/cloud-ui.js'),
  source('apps/academia/src/assets/contrem.js')
 ]);
 assert.match(html, /id="cloudLoginForm"/);
 assert.match(html, /id="cloudEmail"/);
 assert.match(html, /id="cloudPassword"/);
 assert.doesNotMatch(html, /id="(?:demoAccess|enter|displayName)"/);
 assert.doesNotMatch(html, /Testar a demonstração local|Acessar demonstração local/);
 assert.doesNotMatch(html, /\$\('enter'\)|const previousEnter=/);
 assert.doesNotMatch(cloud + intro, /getElementById\('enter'\)|getElementById\('displayName'\)/);
 assert.match(cloud, /let mode='guest'/);
 assert.match(cloud, /if\(mode!=='cloud'\|\|!identity\)return/);
 assert.doesNotMatch(cloud, /resetToDemo|demoEnter\(\)/);
 assert.match(intro, /data-intro-play/); // o vídeo institucional continua disponível
});

test('release: falha sem Auth, não substitui conta real por demo e impede importação oculta', async () => {
 const [cloud, build] = await Promise.all([
  source('apps/academia/src/assets/cloud-ui.js'),
  source('scripts/build-central.mjs')
 ]);
 assert.match(cloud, /config\.preview===true/);
 assert.match(cloud, /Não foi possível carregar o acesso à sua conta/);
 assert.doesNotMatch(cloud, /Você pode usar a demonstração local/);
 assert.match(cloud, /getElementById\('migrateLocalCatalog'\)\.disabled=true/);
 assert.match(build, /VERCEL_ENV==='production'/);
 assert.match(build, /Configuração autenticada da Academia ausente na release/);
 assert.match(build, /A release contém acesso à demonstração local/);
});

test('release: mantém Mux e atualização silenciosa do PWA', async () => {
 const [html, pwa, sw] = await Promise.all([
  source('apps/academia/src/index.html'),
  source('apps/academia/src/assets/pwa.js'),
  source('apps/academia/src/sw.js')
 ]);
 assert.match(html, /player\.mux\.com|stream\.mux\.com|Mux/);
 assert.match(pwa, /updateBox\?\.remove\(\)/);
 assert.match(pwa, /applyAutomaticUpdate/);
 assert.match(sw, /20261122-auth-release-v1/);
});

test('release: distribuição mantém as rotas e a Academia conectada', async () => {
 const [html, info, config] = await Promise.all([
  source('dist/academia/index.html'),
  source('dist/build-info.json'),
  source('dist/academia/assets/cloud-config.js')
 ]);
 const build=JSON.parse(info);
 assert.equal(build.mode,'estavel');
 assert.equal(build.modules.academia,'conectada');
 assert.match(html,/id="cloudLoginForm"/);
 assert.doesNotMatch(html,/id="(?:demoAccess|enter|displayName)"/);
 assert.match(config,/"publishableKey":"sb_publishable_/);
});
