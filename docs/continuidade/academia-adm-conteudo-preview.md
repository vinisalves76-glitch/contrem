# CONTREM Academia — ADM de Conteúdo: criação direta de login (preview)

## Regras funcionais definidas pelo proprietário

- **ADM Master**: cria diretamente o funcionário pelo formulário **Nome completo + E-mail de login + Senha inicial**. Ao salvar, a conta já está ativa e o profissional pode entrar com essas credenciais. **Não existe convite nem envio de e-mail**.
- **ADM de Conteúdo**: pode visualizar e editar todos os cursos e aulas, criar rascunhos e editar avaliações. Não pode publicar, despublicar, excluir cursos ou aulas.
- **Cursos publicados**: qualquer alteração do funcionário é uma revisão de rascunho. O conteúdo que o aluno vê permanece inalterado até a aprovação explícita do Master.
- **Matrículas**: o funcionário consulta alunos e pode conceder/revogar matrícula apenas nos cursos publicados. Não pode criar logins de alunos, cadastrar outros funcionários ou desativar alunos.
- **Acessos**: apenas o Master pode desativar e reativar o funcionário. A senha não é exibida na listagem e não pode ser recuperada em texto claro.
- **E-mail**: um e-mail não pode identificar simultaneamente aluno e funcionário. O login ignora letras maiúsculas no e-mail, mas a senha continua exata.

## Implementação da preview

Branch `feature/academia-adm-conteudo-preview`, originada de `develop`. Pull request #18 ainda em **draft**, sem merge na `main`.

Interface:
- ADM Master > Funcionários > formulário de Nome completo, E-mail de login, Senha inicial > **Criar login do funcionário**.
- A conta aparece imediatamente como **Ativo** na listagem. O Master pode desativar e reativar.
- O funcionário sai da sessão do Master e entra usando **E-mail** e **Senha** no formulário normal da Academia.
- Para o colaborador, o menu Funcionários, formulário Criar aluno, publicação e exclusão ficam ocultos; a camada de serviço local também recusa essas ações.
- O editor mantém o construtor Developer de cursos, aulas, provas e materiais.

Segurança demonstrativa:
- Senha no protótipo é convertida em PBKDF2-SHA256 com salt exclusivo antes de ser armazenada no localStorage de **teste**.
- Apenas o ADM Master de **teste** pode criar usuários com papel `content_admin`.
- `listStaff` retorna somente id, nome, e-mail e estado, nunca senha ou hash.
- Cadastros incompletos de convites de versões antigas da preview são ignorados na migração dos dados locais.

## Limitação técnica essencial

**A preview é uma simulação no navegador**. O modo `preview:true` de `develop` usa `admin-preview-service.js` + localStorage e não comunica as contas entre navegadores/computadores. O login criado na preview funciona **no mesmo navegador e perfil** onde foi cadastrado. Ele **não é uma conta real no Supabase** e não está disponível em `contrem.vercel.app`.

Nenhuma tabela, regra RLS, Auth, Edge Function ou material do projeto Supabase de produção foi alterado. A `main` e o domínio de produção não sofreram alterações.

## Próximo estágio: login real compartilhado

Para que o funcionário entre em outro computador/telefone e trabalhe em cursos compartilhados, é necessária a implementação no backend e a homologação isolada:

1. Adicionar a role `content_admin` na tabela `academy_members` com RLS e permissões específicas, sem mudar a role `admin` do Master.
2. Criar endpoint restrito ao Master, autenticando o JWT no servidor, para chamar `auth.admin.createUser({email,password,email_confirm:true,...})`; associar `academy_members` e estado do novo usuário, com rollback em caso de erro. **Nunca colocar chave service_role no frontend**.
3. Isolar `academy_catalog` publicado do catálogo editorial por curso/revisão; impedir que o funcionário altere publicação e exclusões também em RPC/RLS, e publicar somente por ação explícita do Master.
4. Habilitar consulta/matrícula de alunos em cursos publicados no backend para `content_admin`, mas negar criação de Auth users e bloqueio/desbloqueio de alunos.
5. Testar autenticação e dados com três contas de verdade (Master, colaborador, aluno) e em computadores diferentes, em Supabase Branch isolada, sem alterar dados reais.

O Supabase pediu **aprovação explícita do custo** da Branch isolada. Essa permissão não foi concedida, portanto nenhum ambiente de backend isolado foi criado ou usado. Não implantar apenas o frontend em produção como se os logins reais já existissem.

## QA e fluxo de teste

- ADM Master de teste → **Funcionários** → preencher os três campos → **Criar login do funcionário**.
- Validar confirmação e status `Ativo`, sem a senha aparecer na listagem; testar rejeição de e-mail duplicado e senha curta.
- **Sair** → informar e-mail/senha na tela de login → entrar como ADM de Conteúdo.
- Verificar criação/edição de curso e aula, matrículas, bloqueio de publicação, exclusão, novos logins e desativação de alunos.
- Voltar ao Master; revisar/publicar e suspender funcionário; suspenso não consegue entrar.

Regressões devem passar no GitHub Actions antes de gerar uma nova Vercel Preview. PR permanece em rascunho até aprovação.
