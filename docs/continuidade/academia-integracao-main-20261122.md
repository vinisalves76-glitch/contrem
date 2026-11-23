# CONTREM Academia — integração das Academias a partir da main

**Solicitação:** publicar os avanços da preview de Academias sem nenhum retrocesso, adotando a main de produção como base.

**Base exata:** main \`8045717d7745919d176459d09f859df880038731\` de \`vinisalves76-glitch/contrem\`. O deployment atualmente no domínio contrem.vercel.app usa o commit de main \`1ce0befa983bc92326b6e01759fc4ed9ec001e44\` (diferença: um commit de correção de backend/CORS e respectivo teste). Preservar esse ajuste na futura publicação.

**Branch exclusiva:** \`release/academia-formacoes-main-base-20261122\`.

## Resultado da auditoria

A branch isolada \`feature/academia-trilha-formacao-mecanicos\` tem base histórica divergente: 128 commits próprios e oito commits ausentes da main, com reescritas de \`cloud-ui.js\`, \`index.html\`, \`admin-manager.js\` e outras fontes. Ela depende do \`admin-preview-service.js\` e de \`localStorage\` para registrar matrículas, autorizações, avaliações, ativos/inativos e progresso.

A produção, por outro lado, já usa login Supabase Auth real, \`academy_members\`, \`academy_my_catalog\`, \`academy_save_learning\`, \`academy-workspace\`, ADM de Conteúdo (\`content_admin\`) e Mux assinado. O guard do build central proíbe explicitamente demonstradores e \`preview:true\` em produção.

**Decisão:** não integrar por merge direto nem trocar o service de produção pelo service do aluno de teste. Isso removeria autenticação, perfis ou restrições reais de acesso.

## Parte trazida com segurança nesta etapa

- \`apps/academia/src/assets/academy-program-core.js\`: motor de domínio **puro**, sem conexão com Supabase, sem login, sem gravação em tabelas e **não carregado pelo HTML de produção**. Contém regras de etapas/módulos, opção Ativar/Desativar, progresso condicional por aula, atividade e prova final.
- \`apps/academia/tests/qa-academy-main-base.cjs\`: testes de domínio e guardas explícitas para preservar login real, construtor ADM, modo conectado e ausência de scripts de sandbox na aplicação final.
- Documentação de conflito e plano de integração definitiva.

Este pacote é deliberadamente preparatório: **não coloca a trilha em produção** enquanto ela não estiver vinculada ao banco e à autorização real. O layout da preview continua como especificação visual, não como fonte de autenticação.

## O que falta para uma release real aprovada

1. **Projeto Supabase da CONTREM Academia confirmado**: o código de produção aponta para `relatoriopro` (ref `vwvesygsudhbaqmayhsz`). Foi realizada inspeção somente de leitura da estrutura e RLS, sem modificar dados.
2. Criar migração **aditiva e versionada** de Academias, etapas, matrículas, progresso, tentativas, módulos ativos e certificados (ou modelo correspondente ao \`academy_editor_catalog\` existente), sem apagar ou substituir tabelas reais.
3. Aplicar **RLS e verificação server-side**: ADM Master publica e controla matrículas, ADM de Conteúdo edita rascunhos, alunos acessam apenas suas matrículas ativas, módulos liberados e aulas autorizadas. Autorização não pode ser determinada apenas pelo \`localStorage\`.
4. Preservar o fluxo Mux assinado do backend: a abertura do módulo **não** concede automaticamente acesso ao vídeo sem matrícula e ordem de progressão; concluir uma aula exige evidência verificável de reprodução e aprovação na atividade, quando configurada. Prova final e nova tentativa precisam de validação no servidor.
5. Adaptar \`cloud-service.js\` e \`cloud-ui.js\` de produção de maneira aditiva, sem sobrescrever login, criação de funcionários, política de publicação ou sincronização existente.
6. Reaproveitar o visual **exato** da antiga preview \`/academia/trilha-formacao/\` no portal integrado à conta real, com o menu Visão geral, Minha trilha, Laboratório virtual, Sobre o programa e Voltar para meu perfil.
7. QA em preview conectada ao mesmo modelo de dados (não dados reais), mais comparação entre as rotas \`/\`, \`/academia/\`, \`/contremtec/\`, \`/contremtec/guia/\`. Incluir checks: login e logout; ADM Master/ADM Conteúdo; curso avulso; Mux; PWA; matrículas; publicação independente de módulos; Ativar/Desativar; aulas e avaliações; progressão; certificados.
8. Só após essa verificação, PR revisado para \`main\`, commit de release e confirmação do deployment **production READY** no domínio \`contrem.vercel.app\`, com rollback ao deployment anterior conhecido.

## Situação objetiva

- Produção: mantida sem modificação.
- Branch criada de main: sim.
- Motor de regras e testes portados sem substituir os recursos de produção: sim.
- Banco real da CONTREM acessível por esta conexão: **sim, verificado pelo projeto ref e pela configuração da aplicação**.
- Publicação real de novas Academias: **não liberada nesta etapa**: o banco não possui o modelo de Academias, matrículas e progressão protegida no servidor; a preview usa armazenamento local.

**Regra fixa:** não reutilizar diretamente \`admin-preview-service.js\`, \`academy-program-store.js\` local ou a conta de aluno fictício em produção. Não reduzir permissões nem ocultar alertas de conflito/salvamento por conveniência.


## Inspeção read-only do backend confirmada

A configuração da CONTREM Academia em produção aponta para o projeto Supabase `relatoriopro`, acessível pelo conector. As tabelas atuais `academy_members`, `academy_course_access`, `academy_editor_catalog`, `academy_learning_state`, `academy_videos` e `academy_stream_assets` já existem com RLS habilitado. As funções `academy_my_catalog` e `academy_save_learning` estão ativas. Não foram identificadas tabelas reais independentes para cadastro de Academias, matrículas nas formações e Ativar/Desativar de módulos com validação server-side.

O projeto Supabase é compartilhado; somente uma migração aditiva revisada, com políticas e testes de acesso, poderá suportar a trilha real. Nenhum SQL de escrita foi executado nesta inspeção.


## Atualização: integração visual e do ADM na PREVIEW (23/11/2026)

Esta seção substitui a informação anterior de que a branch continha apenas o motor puro. A integração foi ampliada, sempre partindo da main original e sem substituir o login real.

- Portal visual original aprovado copiado para apps/academia/src/trilha-formacao/ (HTML, CSS, JavaScript e matriz didática).
- Login Supabase Auth, ADM Master, ADM Conteúdo e Cursos Avulsos preservados. cloud-ui.js apenas dispara eventos ao entrar e sair da sessão.
- ADM: menu Academias, edição do banner, upload de capa, etapas, planejamento das aulas, publicação integral independente de vídeos, botões Ativar/Desativar por módulo, gerenciamento de matrículas e botão Visualizar portal.
- Aluno: seção Minhas Academias, restrita às matrículas publicadas, com abertura do painel original em tela inteira e retorno ao perfil.
- Supabase: migração aditiva criou academy_programs e academy_program_enrollments com RLS e sem acesso direto de anon/authenticated. Nova Edge Function academy-programs versão 1 valida JWT, papel, matrícula e status; a API academy-workspace antiga foi preservada.
- Formação de Mecânicos cadastrada como RASCUNHO no novo banco, usando a matriz original: 3 etapas, 12 módulos, 78 aulas planejadas, todas inativas inicialmente. Identificador academy-formacao-mecanicos.
- URL de Preview estável: https://contrem-git-release-aca-bcdaf7-vinicius-alves-projects-fdea38e8.vercel.app/academia/
- Build da Vercel READY: dpl_8yHrkSJBKfudxevMwjqP9Ct6GSKB. Verificados HTTP 200 para app, script do ADM, rota do portal original e CSS. Seis testes de contrato passaram.

### Importante: o que ainda não foi integrado

- Acompanhamento confiável de visualização Mux, avaliações por aula, provas finais, tentativas autorizadas, progressão entre módulos e certificados com validação server-side. Módulos ativados podem abrir o painel e a lista de aulas, mas não permitem concluir aulas sem vídeo ou avançar automaticamente. NÃO promover para produção antes dessa etapa.
- As edições feitas somente no localStorage da preview antiga não foram importadas; somente a matriz base foi semeada, sem sobrescrever cursos e alunos reais existentes.
- A mídia dos módulos da nova Academia requer integração com o Mux assinado e autorização da matrícula. O controle de acesso ao módulo não equivale à liberação de vídeo.
- A URL da preview compartilha o projeto Supabase real, embora use tabelas novas e sem políticas públicas. Usar matrícula de conta de teste para QA.
- Antes de publicar em produção: testes reais do fluxo ADM-aluno, compatibilidade com contremtec/site, prova/Mux e regressões de PWA, permissões de publicação e cursos avulsos.

### Como testar nesta preview

Entre como ADM Master. No menu lateral, escolha Academias, abra Formação de Mecânicos e use Visualizar portal. É possível publicar a formação, controlar Ativar/Desativar por módulo e liberar uma matrícula real de teste. O aluno matriculado verá Minhas Academias e o painel original, com as aulas ainda em preparação.

A main e o domínio contrem.vercel.app permanecem intactos.


## Correção do construtor de Academias novas — 23/11/2026

**Problema reportado:** na aba Academias, ao criar uma formação do zero, o ADM não encontrava como montar as etapas, módulos e aulas para publicar. A versão anterior só possuía edição limitada de aulas pertencentes à Formação de Mecânicos previamente semeada.

**Correção na branch de integração a partir da main (Preview):**

1. Na formação selecionada, em **1. Etapas do aprendizado**, o campo **Nova etapa da Academia** e o botão **+ Adicionar etapa** criam uma etapa de ensino.
2. Na seção **2. Módulos e aulas da Academia**, cada etapa mostra o campo **Novo módulo nesta etapa** e **+ Adicionar módulo**. O módulo começa inativo, sem vídeo Mux e sem liberar alunos.
3. Abaixo de cada módulo, **Gerenciar aulas** permite editar nome/carga horária/descrição e adicionar aulas com **+ Adicionar aula**. Cada aula permite título, descrição e duração prevista. Os IDs das aulas existentes são preservados; não foi criado botão de exclusão.
4. **Salvar configurações** ou **Salvar módulo e aulas** grava as mudanças pelo backend `academy-programs` com verificação de usuário/role e controle de revisão.
5. **Publicar Academia completa** exige pelo menos uma etapa com um módulo, mas **não exige vídeos Mux**, aulas concluídas, avaliações ou conteúdo pronto. Mensagens de validação agora indicam exatamente qual etapa falta.
6. O ADM Master continua controlando publicação, matrícula e Ativar/Desativar individual. ADM de Conteúdo edita apenas formações em rascunho.
7. Vídeos, atividades e progresso autenticado **ainda não estão prontos nesta frente**, de modo que as aulas sem Mux continuam visíveis como conteúdo em preparação, sem conclusão manual nem desbloqueio automático. Não promover ao domínio de produção enquanto essas regras não forem concluídas.
8. O novo `academy-programs` Edge Function foi atualizado para v2 (ACTIVE) somente para alterar as mensagens/requisitos de publicação. Não foram modificados dados, tabelas, senhas ou a API antiga de cursos avulsos.

**Regressão:** `apps/academia/tests/qa-academy-builder-connected.cjs` — 6 cenários de criação de etapas, módulos, aulas, persistência de campos, URLs Mux opcionais e prontidão de publicação passaram em execução simulada.

**Deploy:** realizar apenas na mesma branch `release/academia-formacoes-main-base-20261122` e URL estável de Preview; preservar `main`, `develop` e `contrem.vercel.app`.
