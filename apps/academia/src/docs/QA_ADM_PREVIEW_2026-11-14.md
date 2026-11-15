# QA ADM — 14/11/2026

PASSOU: fonte-base 38/38 hashes iguais à árvore do deployment de produção dpl_EwJzQCYv4MyFr7dnZvktUFFE7pqS; snapshot preservado. Sintaxe de todos os scripts externos e inline. Teste de regressão Mux/backups v1–v4. Teste VM de sandbox: nenhum backend configurado, isolamento de chaves, login inválido, e-mail duplicado, hash de senha, curso rascunho invisível ao aluno, liberação individual, bloqueio de escrita de aluno, conflito de revisão, persistência de progresso, revogação e desativação.

NÃO TESTADO: autenticação real, operações no banco real, player privado assinado, aparelhos físicos, integração em produção. Testes de navegador serão acrescentados somente com evidência real.

PASSOU (DOM emulado com linkedom, não navegador): fluxo de criar curso de aula única; rascunho sem vídeo e bloqueio de publicação; URL Mux inválida; limite de uma aula; série com duas aulas e reordenação; tentativa de converter série em aula única sem perder dados; duplicação com novos IDs; cadastro e matrícula de aluno pelo formulário; login do aluno; menu e rota de ADM ocultos/barrados; sala com aula correta; conclusão persistida após sair/entrar; IDs DOM únicos; chaves locais isoladas. Dependências de teste fixadas em package-lock.json.

Preview dpl_DDoapnGQ8enodhJP11m8jqARUmmJ — READY, target null. URL fixa https://contrem-academia-preview.vercel.app/. Fonte do deployment: 43/43 arquivos conferidos por SHA-1. Fetch autenticado HTTP 200 e conteúdo idêntico para HTML, configuração, serviço da prévia, construtor JS/CSS e SW. A documentação deste pacote foi finalizada após o deploy; o código executável corresponde à prévia.

NÃO TESTADO (navegador real): Chrome cloud redirecionou para login Vercel no endereço da preview. Não houve desativação de proteção, alteração de acesso, login Vercel ou afirmação de QA visual. A tentativa de localhost não estava acessível ao browser cloud. Publicação e testes da preview não alteraram o alias de produção.
