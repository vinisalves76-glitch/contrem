# CONTREM Academia — fluxo ADM e aluno (prévia)

Prévia: https://contrem-academia-preview.vercel.app/ — deployment `dpl_CzCgXSCHSdintCLZWmu6jVTkRd8X`. Produção ainda na versão local PWA anterior.

- ADM exclusivo: `vinicius.alves@irmen.com.br`, conferido no Auth e na associação `academy_members`. A função privada `is_admin()` verifica também o e-mail autenticado; nenhum outro membro é ADM.
- Login de conta existente: sem autoprovisionamento. Alunos só entram depois do cadastro pelo ADM. A demonstração local permanece isolada.
- Painel ADM: criação e edição de curso (capa por URL HTTPS), aulas com vídeo YouTube e link HTTPS de material de apoio, avaliação demonstrativa, além de cadastro de aluno com nome, e-mail e senha inicial. Cada aluno recebe uma conta Auth e associação `student`; a senha não reaparece no painel.
- Painel aluno: cursos e progresso da própria conta. Administração fica oculta e é barrada ao tentar abrir. O catálogo é compartilhado com todos os alunos ativos; ainda não há matrícula por curso nem publicação individual.
- Servidor de cadastro: função `academy-students` valida token com `auth.getUser`, e-mail exato do ADM e associação ativa antes de chamar `auth.admin.createUser`. Usa service role apenas no servidor. Origem do navegador restrita a produção, prévia e localhost; método POST. Se falhar a associação, remove a conta recém-criada. Não envia e-mail automaticamente.
- Banco compartilhado com Relatório Pro: apenas tabelas `academy_*` e `academy_private` foram alteradas. A migration `contrem_academy_admin_only` revogou o autoinsert do aluno. Não mexe em perfis/OS/manutenção.
- Fotos e materiais são links HTTPS públicos; upload direto e biblioteca de mídia são etapas posteriores. Certificados e avaliações seguem demonstrativos, conforme aviso na interface. Vídeos não listados não são proteção contra compartilhamento.
- Login mobile: cabeçalho visual reduzido, campos e ação principal acima da dobra em telas menores; fontes dos inputs 16px para impedir zoom de foco no iPhone. Desktop conserva o layout anterior.

Validação: QA de backup v1-v4, importação, PWA, instalação e serviço cloud passaram; teste transacional RLS confirmou bloqueio de autoinsert, isolamento do aluno, ADM e escrita por revisão; preview Vercel READY e HTML respondeu 200. Ainda falta teste autenticado real com a senha do ADM e teste visual em um telefone físico. Não colocar em produção até aprovação do usuário após testar a prévia.

## Ciclo seguinte: menu por perfil
No acesso conectado, o ADM entra em Treinamentos e vê somente Treinamentos e Alunos no menu. Treinamentos concentra catálogo, aulas, materiais e backup. Alunos abre seção própria de cadastro e lista. O aluno continua com a navegação de aprendizagem, desempenho, perfil e certificados. A demonstração local preserva a navegação histórica para testes e backups. A visão geral consolidada e o acompanhamento de todos os alunos ainda não existem e não aparecem no menu.
