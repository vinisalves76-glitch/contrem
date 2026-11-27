import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const root=fileURLToPath(new URL('../../../',import.meta.url));
const read=path=>readFile(resolve(root,path),'utf8');
const core=require('../src/criador-ia/academy-core.js');

test('Studio mantém identidade do menu e acesso à criação de Academias',async()=>{
 const [nav,html,ui,css]=await Promise.all([
  read('apps/academia/src/assets/scorm-entry.js'),
  read('apps/academia/src/criador-ia/index.html'),
  read('apps/academia/src/criador-ia/academy-studio.js'),
  read('apps/academia/src/criador-ia/academy-studio.css')
 ]);
 assert.match(nav,/button\.innerHTML='<span aria-hidden="true">✦<\/span> Studio'/);
 assert.doesNotMatch(nav,/✦<\/span> CONTREM Studio/);
 assert.match(html,/academy-core\.js/);
 assert.match(html,/academy-studio\.js/);
 assert.match(html,/academy-studio\.css/);
 for(const action of ['add-stage','add-module','add-lesson','remove-module','import','export','save'])
  assert.ok(ui.includes("'"+action+"'"),'Ação disponível: '+action);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(nav,/contrem:studio-open-trainings/);
 assert.match(nav,/openAcademy/);
 assert.match(nav,/openAcademyCopy/);
});
test('Preview não faz gravações no backend real ao salvar Academias',async()=>{
 const ui=await read('apps/academia/src/criador-ia/academy-studio.js');
 assert.match(ui,/localOnly=location\.hostname!=='contrem\.vercel\.app'/);
 assert.match(ui,/if\(localOnly\)\{[\s\S]*?localSave\(\)/);
 assert.match(ui,/if\(localOnly\)throw Error\('A prévia não grava dados no banco conectado\.'\)/);
 assert.doesNotMatch(ui,/academy_publish_authoring_draft/);
});
test('Academia criada usa módulos inativos e estruturas compatíveis',()=>{
 const a=core.create('Mecânicos de Máquinas Pesadas');
 assert.match(a.id,/^academy-[a-z0-9-]{3,150}$/);
 assert.equal(a.status,'draft');assert.equal(a.definition.stages.length,1);
 const m=core.module('Motores'),l=core.lesson('Ciclo diesel');
 assert.equal(m.moduleEnabled,false);assert.equal(m.passScore,80);
 m.lessons.push(l);a.definition.modules.push(m);a.definition.stages[0].moduleIds.push(m.id);
 assert.equal(core.validate(a.definition),true);
 const json=core.downloadObject(a.definition);
 assert.equal(json.format,'contrem-academia-v1');
 assert.deepEqual(json.academy.stages[0].moduleIds,[m.id]);
});
test('Modelo JSON da CONTREM importa etapas, módulos e aulas isolados',async()=>{
 const sample=JSON.parse(await read('apps/academia/src/criador-ia/samples/contrem-academia-modelo.json'));
 const draft=core.fromJSON(sample);
 assert.equal(draft.definition.stages.length,2);
 assert.equal(draft.definition.modules.length,3);
 assert.equal(draft.definition.modules.reduce((n,m)=>n+m.lessons.length,0),6);
 assert.ok(draft.definition.modules.every(m=>m.moduleEnabled===false));
 assert.equal(core.validate(draft.definition),true);
 const repeat=core.fromJSON(core.downloadObject(draft.definition));
 assert.notEqual(repeat.id,draft.id,'A importação precisa gerar uma nova Academia');
 assert.equal(repeat.definition.modules.length,3);
 assert.notDeepEqual(repeat.definition.stages[0].moduleIds,draft.definition.stages[0].moduleIds);
});
test('Importação rejeita JSON inválido e duplicidades',()=>{
 assert.throws(()=>core.fromJSON({title:'Incompleta',stages:[]}),/etapas/);
 assert.throws(()=>core.fromJSON({title:'Falha',stages:[{title:'A',moduleIds:['inexistente']}],modules:[]}),/não foi encontrado/);
 const bad={title:'Falha',stages:[{title:'A',modules:[{name:'Módulo',lessons:[{name:'Aula',videoId:'https://player.mux.com/x'}]}]}]};
 assert.throws(()=>core.fromJSON(bad),/vídeo incompatível/);
});

test('Biblioteca Treinamentos mostra Cursos e Academias com filtro de tipo',async()=>{
 const [admin,connected,studio]=await Promise.all([
  read('apps/academia/src/assets/admin-manager.js'),
  read('apps/academia/src/assets/academy-connected-ui.js'),
  read('apps/academia/src/criador-ia/academy-studio.js')
 ]);
 assert.match(admin,/id="adminTypeFilter"/);
 assert.match(admin,/value="academy">Academias/);
 assert.match(admin,/academyPrograms\.map/);
 assert.match(admin,/data-academy-edit/);
 assert.match(admin,/data-academy-manage/);
 assert.match(admin,/data-academy-copy/);
 assert.match(admin,/contrem:academy-catalog-updated/);
 assert.match(admin,/academia formação trilha/);
 assert.match(connected,/adminBtn\.hidden=true/,'Menu Academias deve permanecer oculto');
 assert.doesNotMatch(connected,/adminBtn\.hidden=!isEditor\(\)/);
 assert.match(connected,/openAdmin:async id/);
 assert.match(connected,/contrem:academy-catalog-updated/);
 assert.match(studio,/pesquise por “Academia” na aba Treinamentos/);
 assert.doesNotMatch(studio,/Academias da biblioteca/,'Studio não deve duplicar listagem de Academias');
 assert.match(studio,/contrem:studio-academy-saved/);
});

test('Home do Studio não exibe bloco de teste nem projeto de exemplo',async()=>{
 const studio=await read('apps/academia/src/criador-ia/app.js');
 assert.doesNotMatch(studio,/TESTE O FLUXO COMPLETO/);
 assert.doesNotMatch(studio,/Carregar projeto de exemplo/);
 assert.doesNotMatch(studio,/Baixar projeto JSON/);
 assert.doesNotMatch(studio,/sampleimport/);
 assert.doesNotMatch(studio,/samples\/contrem-loto\.json/);
 assert.match(studio,/Crie, importe e revise treinamentos/);
 assert.match(studio,/libraryCards\(\)/);
 assert.match(studio,/if\(a==='import'\)/);
});

test('Studio não exibe recuperação nem campo técnico de arquivo na tela inicial',async()=>{
 const [app,css]=await Promise.all([
  read('apps/academia/src/criador-ia/app.js'),
  read('apps/academia/src/criador-ia/style.css')
 ]);
 const home=app.match(/function home\(\)\{[\s\S]*?\}\s*function validateImport\(/)?.[0];
 assert.ok(home,'A home deve continuar disponível');
 assert.doesNotMatch(home,/Recuperar edição deste navegador/);
 assert.match(home,/Importar treinamento/);
 assert.match(home,/<input id="importProject" type="file"[^>]* hidden>/);
 assert.match(css,/#importProject\[hidden\]\s*\{\s*display:\s*none\s*!important\s*\}/);
 assert.match(app,/if\(a==='import'\)\{\$\('#importProject'\)\?\.click\(\)/,'Importação pelo botão segue disponível');
 assert.match(app,/if\(\$\('#importProject'\)\)\$\('#importProject'\)\.onchange=/,'Leitura do arquivo continua funcionando');
});
