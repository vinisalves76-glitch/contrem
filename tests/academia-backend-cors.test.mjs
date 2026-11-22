import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const file=p=>readFile(p,'utf8');
const origin='https://contrem-git-feature-aca-43323e-vinicius-alves-projects-fdea38e8.vercel.app';
const previous='https://contrem-git-feature-aca-7b7922-vinicius-alves-projects-fdea38e8.vercel.app';
test('origens de homologação exatas sem wildcard no backend versionado', async()=>{
 const [students,playback]=await Promise.all([file('apps/academia/server/students/index.ts'),file('apps/academia/server/index.ts')]);
 for(const source of [students,playback]){
  assert.ok(source.includes(origin),'preview desta release incluída');
  assert.ok(source.includes(previous),'preview anterior não pode perder acesso');
  assert.ok(source.includes('https://contrem.vercel.app'),'produção preservada');
  assert.doesNotMatch(source,/Access-Control-Allow-Origin['"]?\s*[:=]\s*['"]\*['"]/);
 }
 assert.match(students,/admin\.auth\.getUser\(token\)/);
 assert.match(students,/\.eq\('active',true\)\.eq\('role','admin'\)/);
 assert.match(students,/origin&&!allowed\(origin\)/);
});
test('streaming exige autenticação e vínculo privado, sem chaves no frontend',async()=>{
 const [playback,mux,config]=await Promise.all([
  file('apps/academia/server/playback.mjs'),
  file('apps/academia/server/mux-provider.mjs'),
  file('apps/academia/src/assets/cloud-config.js')
 ]);
 assert.match(playback,/academy_videos\?select=id,status/);
 assert.match(playback,/academy_stream_assets\?select=/);
 assert.match(playback,/request\.headers\.get\('authorization'\)/);
 assert.match(mux,/selected\.policy!=='signed'/);
 assert.match(mux,/allow_no_referrer!==false/);
 assert.doesNotMatch(config,/MUX_TOKEN_SECRET|MUX_SIGNING_PRIVATE_KEY|SUPABASE_SERVICE_ROLE_KEY|sb_secret_/);
});
