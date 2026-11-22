# CONTREM Academia — ADM de Conteúdo (homologação isolada)

## Regras aprovadas pelo proprietário
1. **Publicação:** somente `admin` (ADM Master) publica e retira cursos de publicação. O funcionário `content_admin` cria e edita, submetendo rascunhos para revisão.
2. **Catálogo:** o funcionário visualiza e edita **todos** os cursos, não apenas os criados por ele. Alterar um curso já publicado gera revisão editorial, **sem modificar a versão publicada vista pelos alunos** antes de aprovação do Master.
3. **Exclusões:** o funcionário não exclui cursos nem aulas. Os controles são ocultados, os handlers recusam exclusão e o adaptador de dados verifica IDs e IDs de aulas contra o catálogo anterior. O Master pode excluir.
4. **Alunos:** funcionário visualiza alunos e altera matrículas em **cursos já publicados**. Não cria usuários, não pode desativar alunos, não vê a área de Funcionários. O Master continua podendo criar logins e alterar status.
5. **Convite:** Master informa nome e e-mail; empregado define a própria senha por convite de uso único, com prazo de sete dias. O token é armazenado como hash, sem senha em texto aberto.

## O que foi implementado nesta preview
- Partiu exclusivamente da branch `develop` em `feature/academia-adm-conteudo-preview`, **sem merge nem modificações em `main`**.
- Menu **Funcionários**, painel de convites e listagem de funcionários restritos ao Master.
- Convite de teste, aceite e primeira senha, login do funcionário, desativação/reactivação apenas pelo Master.
- Admin editor com construtor de cursos e aulas, biblioteca, avaliações, reordenação, mídia e acesso a matrículas.
- Distinção visual entre `ADM MASTER` e `ADM DE CONTEÚDO`; botão Publicar, Retirar publicação, Excluir curso/aula, formulário Criar aluno e botão Funcionários não aparecem ao funcionário.
- Catálogo editorial separado do catálogo publicado na simulação. Regras de acesso são checadas também no adaptador de dados local, além da UI.
- Matrícula do funcionário limitada a cursos já publicados; nunca habilitar matrícula em rascunhos.
- Testes de política e de fluxo DOM (Master, funcionário, aluno) adicionados à suíte que já existe na `develop`.

## Limitações honestas da preview
**Esta é uma simulação isolada em navegador, não o backend de produção.** A `develop` usa `cloud-config.js` com `preview:true`, `admin-preview-service.js` com localStorage e entrada administrativa de teste. O link de convite demonstra a jornada de criação da senha no **mesmo navegador e perfil** onde o Master gerou o convite. Ele **não envia um e-mail real** e não funciona de forma compartilhada entre computadores/navegadores.

Não foi criado usuário real no Supabase, não foram alterados papéis, tabelas, RLS, Storage, Auth nem Edge Functions no projeto Supabase de produção. Não foi realizada alteração de produção na Vercel. Esta preview é para homologação visual e funcional das regras.

O Supabase conectado em produção atualmente possui `academy_members.role` apenas `admin/student`; a autorização do administrador usa `academy_private.is_admin()` e a função de usuários `academy-students` concede somente ao Master o cadastro. **Nunca** trocar somente a checagem da interface e considerar os acessos seguros. Antes da publicação real, implementar e testar num banco separado:

1. Nova role `content_admin` em `academy_members` com política RLS e RPC própria; papel `admin` inalterado.
2. Espaço editorial de versões/rascunhos independente de `academy_catalog`, com transações e controle de revisão. Edição de publicado não altera o conteúdo entregue ao aluno até aprovação explícita do Master.
3. Contratos server-side: funcionário pode criar/editar rascunhos (com proibição de exclusão) e gerenciar matrículas de alunos ativos em cursos publicados; só Master pode publicar, despublicar, criar usuários e convidar funcionários.
4. Edge Function privilegiada para `inviteUserByEmail`, verificando JWT e autorização Master no servidor. Aceite de convite via Supabase Auth e `updateUser({password})` com URL de redirecionamento permitida. Nunca expor service role no browser.
5. Materiais privados por RLS; mídia Mux assinada; garantir que permissões não escalam por `user_metadata`.
6. Testes negativos reais com contas de Master, funcionário, aluno e token expirado; auditar triggers, GRANT e RLS, com recuperação em caso de conflito.

**Bloqueio externo:** criar uma Supabase Branch isolada gera custo computacional; a ferramenta solicitou `confirm_cost_id` e confirmação explícita do proprietário. Por isso nenhuma branch de banco foi criada e nenhuma migração foi aplicada ao banco ativo. É necessária a aprovação do custo antes dos testes reais no Supabase sem afetar a produção.

## Uso da preview
- Abrir `/academia/` na URL de preview da branch.
- **Abrir painel ADM de teste → Funcionários → Criar convite de ADM de Conteúdo**.
- Copiar o link, abrir **no mesmo navegador/perfil** e definir senha.
- Sair, entrar com e-mail/senha de teste, criar curso, editar aula, gerenciar acesso em Alunos, confirmar que não há Criar usuário, Funcionários, Publicar ou Excluir.
- Sair, voltar pelo botão **Abrir painel ADM de teste**, revisar rascunho, publicar, verificar que aluno matriculado passa a visualizar o treinamento.

A preview nunca deve ser promovida para `main` por engano. Primeira etapa de implementação do backend real exige decisão específica sobre ambiente isolado e revisão de segurança.
