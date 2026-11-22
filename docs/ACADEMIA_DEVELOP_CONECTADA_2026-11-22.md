# CONTREM Academia — correção da integração sobre o Developer (22/11/2026)

## Por que a versão anterior parecia incompleta
A primeira integração (#13) partia da base estável e instalava o `cloud-connected.js`, cuja finalidade era bloquear a autoria, avaliações, materiais e certificados até existirem contratos seguros. Ela substituía a interface de administração da `develop` por um fluxo reduzido. O banco `academy_catalog` possuía 0 cursos, porque a prévia Developer armazenava catálogo e anexos no navegador (localStorage e IndexedDB) da **origem web da prévia**. O acesso remoto a essa origem não permite ler o armazenamento local do navegador do usuário. Não houve exclusão dos arquivos locais.

## Estratégia corrigida
- Branch `feature/academia-develop-conectada-v2` baseada diretamente em `develop`. Main, develop e ContremTec não foram modificadas.
- HTML, estilos, editor, reordenação de aulas, capa, materiais, questões e fluxo visual são os mesmos arquivos do Developer, com alteração mínima de validação para IDs de anexos privados. Não utilizar a UI reduzida da PR #13.
- Fonte continua `preview:true` para executar os testes/sandbox da develop; **somente o build desta branch** substitui a configuração pública por `mode:connected, preview:false`. O build da `develop` segue em preview sandbox e não pode ser publicado como conectado por engano.
- Auth: Supabase Auth via publishable key existente, `getUser`, membros ativos e autorização RLS. Conta ADM original continua vinculada ao papel admin.
- Catálogo: ADM salva `academy_catalog.courses` através de `UPDATE(courses)` com revisão otimista e a policy RLS `academy_catalog_admin_update`. O trigger existente incrementa a revisão. Alunos recebem somente o catálogo publicado e matriculado pela RPC `academy_my_catalog`.
- Perfil/progresso: RPC `academy_save_learning` com revisão e preservação de histórico. Indicadores de aulas concluídas são autodeclarados e não notas de prova.
- Alunos: Edge `academy-students` v6 (implantada) com CORS para a origem exata desta preview, validação de Auth/membro admin e criação atômica compensatória do estado inicial junto da conta. Matrículas e revogações preservadas.
- Player: Edge `academy-playback` v3 (implantada) incluiu esta origem exata, mantendo checagem de Auth, matrícula, RLS, asset Mux assinado e bloqueio de público em aulas. O ADM ainda pode abrir a prévia administrativa do link Mux informado por ele; alunos dependem de `academy_videos` + `academy_stream_assets` e segredos Mux.
- Materiais: bucket `academy-materials` PRIVADO de até 50 MB por arquivo; administrador envia arquivo e vincula metadados no curso/aula. Somente administrador ou aluno matriculado em curso publicado pode obter URL de download temporária de 120 s. Não reutilizar bucket de vídeo Mux. O aluno recebe somente metadados sanitizados, sem gabaritos.
- Autor de avaliações: editor completo da develop funciona no ADM conectado e armazena definições no catálogo administrativo. A prova do aluno/correção/certificado **não estão implementados no backend** e não devem ser considerados válidos ou emitidos até implementação protegida no servidor.

## Migrações efetivamente aplicadas no projeto Supabase relatoriopro
- `academy_develop_connected_catalog_and_materials`: GRANT restrito a cursos, novo bucket privado, storage RLS e helper privado para checar membro ativo, matrícula e publicação.
- `academy_connected_student_material_projection`: metadados whitelist de arquivos e links externos para alunos autorizados, sem expor perguntas/respostas ou URLs de vídeos. Teste SQL sintético verificou um anexo do curso, um da aula e link HTTPS, descartou anexo alheio e não incluiu gabaritos.
- Nenhuma tabela operacional, usuário existente ou dado da ContremTec alterado. Catálogo real permanece vazio (0 cursos) até migração explícita feita pelo ADM.

## Como trazer cursos que já existem no Developer
Os cursos foram criados apenas no `localStorage` da origem em que foram editados. Não é possível copiar esses dados entre domínios Vercel diretamente pelo servidor.

1. No **mesmo navegador e perfil** onde editou os cursos, abra o Developer original: `https://contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app/academia/`.
2. Faça login no painel ADM de teste do Developer; exporte o backup JSON pelo comando interno `exportBackup()` (se os controles de backup estiverem ocultos, pode-se executá-lo no Console do navegador). Isso baixa `contrem-academia-backup-AAAA-MM-DD.json`. Não envie backup que contenha dados reais de alunos a terceiros.
3. Entre na nova preview com a conta **real** de administrador e clique `Importar cursos do Developer (arquivo JSON)`. A importação aceita somente cursos válidos e **acrescenta apenas IDs novos**, como rascunho; não migra usuários, notas ou certificados; não sobrescreve cursos existentes.
4. Reanexe materiais que estavam em IndexedDB (os metadados JSON não incluem os binários), revise capas e prepare o vínculo Mux signed das aulas antes de publicar.
5. A importação só passa a valer para alunos matriculados depois da publicação e concessão de acesso pelo administrador.

## Gates e pendências
- GitHub Actions: `npm run check`, `npm test` (incluindo teste de DOM conectado, upload, curso e aulas), `ACADEMY_MODE=connected npm run build`, `npm run test:central`, `node --test tests/academia-develop-connected.test.mjs`, `git diff --check`.
- Preview: somente Vercel alvo Preview na mesma branch, nunca main/produção.
- Teste de integração real com contas ADM/aluno no navegador **não executado** (não temos sessão do usuário). Testes DOM usam mock de Supabase e não substituem E2E.
- **MUX:** não há cursos, vídeos ou vínculos no banco e a configuração de segredos/restrição signed precisa ser concluída para aulas reais. Não publicar links Mux públicos como se fossem privados.
- **Avaliações/certificados:** exigem tabelas/Edge para tentativas, nota calculada no servidor, gabaritos privados, matrícula e emissão verificável antes da liberação.
- Cota Vercel: reutilizar alias estável da branch; nenhuma alteração direta em main/develop. O clone local no VS Code não foi automaticamente sincronizado.

## Segurança
Sem senha ou segredo Mux no GitHub/browser. CORS estrito por origem HTTPS; RLS por membro ativo e matrícula. Arquivos privados somente via signed URL. Banco compartilhado preserva áreas operacionais. Estado de produção permanece no commit de main anterior, sem merge automático.
