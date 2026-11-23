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

1. Confirmar o projeto Supabase da **CONTREM Academia**, cujo projeto não está disponível entre os projetos mostrados pela conexão atual; o catálogo acessível apresenta apenas \`heavymatch\` e \`relatoriopro\`. Não presumir que outro banco é o da CONTREM.
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
- Banco real da CONTREM acessível por esta conexão: não identificado.
- Publicação real de novas Academias: **não liberada nesta etapa** para não perder segurança nem funcionamento existente.

**Regra fixa:** não reutilizar diretamente \`admin-preview-service.js\`, \`academy-program-store.js\` local ou a conta de aluno fictício em produção. Não reduzir permissões nem ocultar alertas de conflito/salvamento por conveniência.
