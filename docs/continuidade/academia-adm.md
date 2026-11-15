# ADM da CONTREM Academia

## Ciclo de 15/11/2026 — continuidade no GitHub central

Entrega confirmada: feature integrada por fast-forward em develop no commit f22ebb91de39d26a8ebd1d18bdb77bcfde77f6f1. A Vercel criou automaticamente uma única preview dpl_Ec9sBHndh8GXuQx2Csxwdie59bHJ, READY, target null. O alias fixo de develop respondeu HTTP 200 em build-info.json e /academia/. Build-info confirmou o commit acima, branch develop e modo homologacao. O JS publicado respondeu 200 e é idêntico ao arquivo testado. A produção dpl_8mmUPopw84defEhECBxxBMYPSQEP continuou com os aliases públicos; main não foi alterada.

Esta finalização documental fica na feature após o deploy, sem um segundo build só para registrar o deployment. O código executável da feature é o da preview. Não alegar QA visual: somente verificações HTTP e testes automáticos/DOM emulado foram realizados.

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
