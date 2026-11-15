# Acessos da CONTREM Academia

ADM: apenas a conta Auth `vinicius.alves@irmen.com.br` com membro ativo admin. Alunos criados por essa conta no painel, sem autoprovisionamento. A mesma função Edge protegida cria, lista, ativa/desativa e libera/revoga cursos. O papel Auth do sistema de manutenção não concede poderes na Academia.

O catálogo completo `academy_catalog` é visível somente ao ADM pela Data API. Alunos recebem os cursos concedidos através de `academy_my_catalog()`, que valida a associação ativa e filtra `academy_course_access`. A tabela de liberações usa RLS: leitura do próprio aluno ou ADM; gravação somente pelo servidor após verificar a sessão, e-mail do proprietário, membro admin ativo e existência do curso. Ao criar aluno, nenhum curso é liberado automaticamente. O ADM marca cada curso no módulo Alunos.

Desativar um aluno impede novas leituras e gravações da Academia; não remove histórico. Revogar um curso impede nova leitura do conteúdo após recarregar a conta. Conteúdo já carregado numa sessão aberta ou cache do aparelho não pode ser apagado remotamente; recomenda-se atualizar a tela para refletir imediatamente mudanças de permissão. Links públicos do YouTube e materiais compartilhados anteriormente continuam acessíveis por seus endereços.

Certificados e avaliações ainda demonstrativos. Não usar para certificação oficial. Não há acesso de instrutor, turma, venda nem vínculo automático com o sistema de manutenção. Produção não publicada neste ciclo.

Validação: teste transacional confirmou catálogo bruto invisível ao aluno e filtragem exata por uma liberação; rollback restaurou o banco. Testes locais de backup, PWA, instalação e cloud passaram. Autenticação real pelo usuário e sessão de aluno cadastrado pendentes de validação na prévia.
