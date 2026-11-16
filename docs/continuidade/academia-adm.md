# ADM da CONTREM Academia

## Ciclo de 15/11/2026 — continuidade no GitHub central

Entrega confirmada: feature integrada por fast-forward em develop no commit f22ebb91de39d26a8ebd1d18bdb77bcfde77f6f1. A Vercel criou automaticamente uma única preview dpl_Ec9sBHndh8GXuQx2Csxwdie59bHJ, READY, target null. O alias fixo de develop respondeu HTTP 200 em build-info.json e /academia/. Build-info confirmou o commit acima, branch develop e modo homologacao. O JS publicado respondeu 200 e é idêntico ao arquivo testado. A produção dpl_8mmUPopw84defEhECBxxBMYPSQEP continuou com os aliases públicos; main não foi alterada.

Esta finalização documental fica na feature após o deploy, sem um segundo build só para registrar o deployment. O código executável da feature é o da preview. Não alegar QA visual: somente verificações HTTP e testes automáticos/DOM emulado foram realizados.

## Ciclo — foto de capa anexada no ADM

Concluído e integrado em `develop` no commit `b42f5946db8b68b76e9d6f78341a0d8e3693cd35`. O campo de URL foi substituído por seletor de arquivo JPG/PNG/WebP, prévia removível e redução no navegador (imagem final limitada a 700 KB). A capa persiste no rascunho local, aparece no cartão de curso do ADM e na área do aluno; ao editar, a capa existente é preservada. A validação de catálogo permite somente data URLs de imagem Base64 até 1 MB. Cache da Academia versionado para atualizar a prévia sem intervenção do aluno.

Arquivos: `apps/academia/src/assets/admin-manager.js`, `admin-manager.css`, `apps/academia/src/index.html`, `apps/academia/src/sw.js`, `apps/academia/tests/qa-admin-dom.cjs`. Testes: `npm test --prefix apps/academia` (inclui 42 casos), `npm run build` central, `npm run check` e `git diff --check`; todos passaram. O primeiro teste falhou por dependência `linkedom` ausente no checkout; após `npm ci --prefix apps/academia`, a suíte passou. Vercel publicou `dpl_EW1DHM8MuGofSE34XVfevcTM8kKX` com estado READY, alias compartilhado `https://contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app/academia/`; `build-info.json` confirma o commit `b42f5946db8b68b76e9d6f78341a0d8e3693cd35`, branch `develop` e modo homologação. O JS, CSS e service worker foram lidos da implantação e responderam HTTP 200. A inspeção visual no navegador de teste foi impedida pela proteção SSO da Vercel; não houve integração com armazenamento remoto de imagens. Nenhum arquivo de produção ou `main` foi alterado.

Próximo passo: avaliar a capa no navegador do proprietário e, depois, avançar o fluxo do ADM para integração real de imagens apenas quando esse ciclo for autorizado. Esta entrega permanece restrita à prévia e ao sandbox local.

## Ciclo — anexos de aula e restauração da fonte completa

O proprietário apontou que também precisava anexar vídeos e conteúdo de apoio. A versão anterior publicada em `b42f5946db8b68b76e9d6f78341a0d8e3693cd35` continha `index.html` truncado; foi restaurado da base íntegra antes deste ciclo e a funcionalidade da capa foi reaplicada. A fonte voltou a 56 KB e termina com o documento HTML completo.

Novo fluxo de prévia: MP4/WebM de até 500 MB por aula; PDF, imagens JPG/PNG/WebP e documentos DOC/XLS/PPT (incluindo variantes OOXML) ou TXT de até 50 MB. Os arquivos são guardados em IndexedDB no navegador da prévia, enquanto o catálogo local guarda somente metadados. O vídeo anexado reproduz na sala do aluno da prévia e o material fica acessível pela aula. A foto de capa permanece selecionável no cadastro do curso. Estes anexos não são enviados à conta Mux nem ficam compartilhados entre aparelhos.

Arquivos: `apps/academia/src/assets/admin-preview-media.js`, `admin-manager.js`, `admin-manager.css`, `apps/academia/src/index.html`, `apps/academia/src/sw.js`, `apps/academia/tests/qa-admin-dom.cjs`. Testes executados: suíte da Academia (42 verificações do backend e testes DOM emulado, incluindo upload, leitura do vídeo e do material), build central, check e diff check; todos passaram. Commit integrado em `develop`: `3c04b2d21a236d63905b8065e3024e9adf3d7c6d`. Vercel: `dpl_9mM8qKPohpmDLKbhRTifAqgsQnBu`, READY, target Preview; alias `https://contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app/academia/`. `build-info.json` confirma o commit, a branch `develop` e homologação; HTML completo (55.742 caracteres), ADM, módulo local de mídia e service worker responderam HTTP 200. A página abriu no browser de QA em login/SSO da Vercel, então não houve QA visual real. Main e produção não foram alteradas. O uploader Mux real depende de conectar a conta e as chaves pelo ambiente seguro do servidor.

O deploy anterior b42 foi substituído pela integração de correção acima; não usar aquele deployment como preview atual. A URL de homologação é o alias estável de `develop` indicado nesta seção.

Estrutura conferida diretamente no GitHub e na Vercel. Fonte canônica: `vinisalves76-glitch/contrem`. Desenvolvimento em `feature/academia-adm`; homologação compartilhada em `develop`. Não continuar a partir do checkout/ZIP anterior isolado nem publicar no antigo projeto de Academia por conveniência. O endereço de teste atual é https://contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app/academia/.

Base desta rodada: 3023bbed9a8bbe4cce5b34ccd59ac91942c1606b. Commit de implementação: 92f765d2478b8dc67580b0b1ca88c31ab6bd6cab. Arquivos alterados: admin-manager.js/.css, sw.js e tests/qa-admin-dom.cjs dentro de apps/academia. Acrescentado apps/academia/docs/QA_ADM_EDICAO_2026-11-15.md.

Corrigido o descarte silencioso de campos ao trocar de curso/aula, duplicar, sair ou recarregar. A navegação entre etapas preserva os campos; a publicação fica bloqueada enquanto há edição não salva. Salvar curso não apaga aula pendente. Validações de horas/minutos incluídas. Cache versionado dentro do escopo da Academia.

Testes executados: suíte da Academia (DOM emulado, acessos, Mux/backups e 42 casos do backend preparado); check de 41 scripts; build central e quatro testes de rotas/cache/distribuição. QA visual real e aparelhos físicos não executados. Nenhuma alteração em Auth/banco/SQL. Main, produção e outras frentes preservadas. Integração deste ciclo deve ocorrer apenas em develop, gerando uma preview pelo vínculo Git existente; confirmar o commit publicado em build-info.json.

Próximo passo: validar o percurso do instrutor no navegador e concluir os requisitos de cadastro/organização de cursos com o proprietário. Integração real de autenticação, permissões, mídia privada e upload continua pendente e separada do sandbox.

---

Frente do chat “ADM da Academia”. Branch: `feature/academia-adm`; caminho: `apps/academia/`.

Fonte: pacote `CONTREM_ACADEMIA_ADM_PREVIEW_2026-11-14.zip`, deployment `dpl_DDoapnGQ8enodhJP11m8jqARUmmJ`. O código executável confere com a preview; quatro documentos foram finalizados depois da publicação. A versão estável Mux da Academia permanece em `main`.

Construtor de curso em informações/aulas/revisão; aula única ou série; rascunho, publicação demonstrativa, ordenação/edição/remoção de aulas, duplicação, busca/filtro, visualização de sala, alunos fictícios e matrícula por curso. Tudo fica neste navegador/origem. O sandbox não acessa o Auth nem o banco real.

Backend de mídia privada recuperado do pacote de streaming, preservado em `server/` com testes de autorização e assinatura. SQL é referência do ciclo anterior, não deve ser reaplicado. Nenhum deploy de backend ou alteração de banco é parte da organização.

Próximo passo: concluir os fluxos do ADM, revisar contratos e testar Auth/RLS em homologação isolada; validar mídia privada e upload; só integrar à produção mediante pedido. Não substituir o serviço conectado pela implementação local.

Testes: `npm ci --prefix apps/academia`; `npm --prefix apps/academia test`. Build estático: `npm run build:academia` na raiz.
## Ciclo — uso do Mux e botão Adicionar aula

Ciclo atual: o vídeo da aula é informado por link do player Mux ou Playback ID; removido o seletor de arquivo de vídeo da prévia. A publicação exige Playback válido em cada aula. O Mux continua sendo o player/hospedagem. Foto da capa continua com seletor de imagem; anexos de apoio (PDF, imagens e documentos) continuam disponíveis apenas nesta prévia/local do navegador.

O botão “Adicionar aula” não fica mais desativado quando ainda não há curso selecionado nem quando o curso é de aula única. Sem curso, tenta salvar os dados válidos em edição e abre a aula; se o curso não estiver válido, mostra orientação e retorna às informações. Em curso de aula única já preenchido, informa como mudar para série de aulas.

Validação local: `npm test --prefix apps/academia` (inclui 42 casos do backend preparado e DOM emulado), `npm run build:academia`, `npm run check` (42 scripts) e `git diff --check`; todos passaram. O DOM emulado cobre link Mux, feedback/ação do botão, seletor de anexo de apoio e capa. Não houve QA visual real, integração com upload Mux, alteração de banco, main ou produção.

A primeira integração em `develop` confirmou o HTML e os scripts novos na preview. A versão do cache do service worker foi incrementada para esta revisão; ela será incluída no commit final do ciclo. Próximo passo: confirmar o deploy com esse cache atualizado e revisar o fluxo na própria preview.

## Ciclo — aulas e provas de teste, 16/11/2026

Branch `feature/academia-aulas-teste`, baseada em `origin/develop`. O ADM agora oferece “Criar aulas e provas de teste”: exige link/Playback ID Mux público informado pelo proprietário e adiciona, sem sobrescrever cursos existentes ou duplicar IDs, uma aula única e uma série de três aulas publicadas somente no sandbox. Cada curso tem quatro questões e nota mínima de 75%. A matrícula continua explícita em Alunos, sem criação de contas reais. Gabarito: B, A, D, C. O vídeo informado é compartilhado entre as quatro aulas e o conteúdo identifica sua finalidade fictícia.

Arquivos: `apps/academia/src/assets/admin-manager.js`, `apps/academia/src/sw.js`, `apps/academia/tests/qa-admin-dom.cjs`. Validação: suíte completa da Academia passou (DOM emulado e 42 casos do backend), check de 42 scripts, build central e diff check. O fluxo emulado cobre criação idempotente, matrícula, conclusão, reprovação, aprovação no limite de 75%, emissão dos dois certificados e persistência após novo login. Reprodução real de mídia e QA visual não executados. A tentativa de consultar o stream Mux por HTTP foi bloqueada pelo proxy do ambiente. Produção e banco preservados.

Uso: abrir ADM de teste → Criar aulas e provas de teste → informar Mux → Criar cursos → Alunos → criar login fictício e liberar cursos → sair e entrar como aluno no mesmo navegador/origem. Para reprovação, marcar A/B/A/A; para aprovação, B/A/D/C (100%) ou B/A/D/A (75%). Próximo passo: validar visualmente vídeo, navegação e impressão na homologação. Publicação deste ciclo deve ficar somente em develop/Preview.

Publicação confirmada: commit `2899966aefc9e6a33903e18eec68bf0685d4586f` enviado a `develop`; deployment `dpl_EXPJPmX2qgZe2iDkcE8rFxZwDmat` READY, alvo Preview, build estático em aproximadamente 3,5 segundos. Alias compartilhado `https://contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app/academia/`. `build-info.json` respondeu 200 e confirmou commit, develop e homologacao; o asset publicado contém `createTestCourses`. Não houve QA visual nem reprodução real de vídeo. Este registro posterior fica na feature para evitar novo build apenas documental.

## Ciclo — entrada do aluno de teste no login, 16/11/2026

Pedido: mostrar como entrar na área do aluno junto ao login da homologação. Implementação em `feature/academia-aulas-teste`, continuidade da base `2899966` de develop, instruções lidas no clone do ambiente e remoto atualizado via fetch. Acrescentado cartão “ÁREA DO ALUNO · CONTA DE TESTE” somente quando `preview:true`, com instruções para preparar os cursos no ADM, entrar sem senha pelo botão e sair para alternar perfis. O botão prepara uma identidade fictícia local reservada, distinta do ADM, e libera somente os IDs QA publicados. Sem cursos QA publicados, orienta a preparação e conserva a tela de login. Reentrar preserva progresso, provas e certificados; cursos reais ou rascunhos não são liberados. A senha aleatória interna é armazenada somente como hash e não é exposta como credencial de acesso.

Arquivos: `apps/academia/src/assets/admin-preview-service.js`, `cloud-ui.js`, `apps/academia/src/sw.js` e testes `qa-admin-preview.cjs`/`qa-admin-dom.cjs`. Banco, Auth, Mux e produção não alterados. Revisões independentes dos agentes testes e seguranca registradas ao concluir o ciclo. O clone do VS Code do proprietário não é sincronizado automaticamente por este ambiente.

Validação final: desenvolvedor implementou; agentes `testes` e `seguranca` revisaram independentemente e retornaram APROVADO. Ambos executaram a suíte Academia; testes também executou check (42 scripts), build central e diff check; tudo passou. Uma falha inicial de roster foi corrigida antes da revisão final ao impedir criação do aluno quando não há cursos QA publicados. Sem QA visual, reprodução Mux ou impressão real nesta rodada. Publicação somente Preview pelo PR para develop; nenhum arquivo de produção alterado.

## Ciclo — cursos prontos ao entrar como aluno, 16/11/2026

O proprietário solicitou abrir a prévia e visualizar o fluxo sem cadastro prévio. Branch `feature/academia-cursos-prontos` criada a partir de `develop` atualizado (`f4a4ac0`), preservando os commits documentais do ciclo anterior na branch antiga. Instruções e continuidade lidas localmente; fetch remoto conferido antes da edição. O botão de aluno passa a preparar automaticamente somente os dois cursos QA ausentes, com aulas/provas demonstrativas e vídeo público de exemplo Mux já usado nos testes. Conteúdo identifica a natureza fictícia e repetição do vídeo. Cursos existentes e estados dos alunos devem ser preservados; nenhuma infraestrutura real alterada.

A consulta HTTP do stream pelo shell foi bloqueada pelo proxy do ambiente (403 CONNECT), portanto não representa teste de reprodução. A validação funcional desta rodada usa o serviço local e DOM emulado. O clone do VS Code do proprietário não é atualizado automaticamente.

Arquivos: `admin-preview-service.js` (builder compartilhado e seed aditivo), `admin-manager.js` (reuso do builder), `cloud-ui.js` (instruções prontas), `sw.js` (cache), testes `qa-admin-preview.cjs`/`qa-admin-dom.cjs`. Desenvolvedor concluiu; revisores independentes `testes` e `seguranca` retornaram APROVADO. Suite Academia (DOM emulado, migração, serviço e 42 backend), check de 42 scripts, build central e diff check passaram. Fluxo fresco cobriu 2 cursos/4 aulas, validade do catálogo/backup, conclusão de três aulas, prova 100% e dois certificados; reentrada preserva progresso, questões editadas e rascunhos. Nenhuma disponibilidade/reprodução real de mídia ou impressão foi comprovada.
