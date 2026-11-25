# CONTREM Studio — preview inicial

**Branch original:** `feature/academia-studio-preview-20261125`
**Base:** `main` em `05bc5da809ee6ba4c75e328004816a5baeb49a85`  
**Escopo:** editor manual integrado à CONTREM Academia; sem IA.

## Entrega

O ADM da Academia recebe a entrada **CONTREM Studio**. O editor permite criar um treinamento, organizar etapas e aulas, inserir blocos de texto, imagem, vídeo Mux, material de apoio e atividade de alternativa única, salvar/reabrir rascunhos e visualizar a aula no modo aluno.

Os rascunhos da demonstração são salvos somente no `localStorage` deste navegador. O modo demonstrativo não autentica, não sincroniza com o catálogo da Academia e não publica. A entrada autenticada do Studio continua visível apenas para ADM Master e ADM de Conteúdo; essa entrada também usa armazenamento local nesta etapa.

## Arquivos

- `apps/academia/src/index.html`
- `apps/academia/src/assets/cloud-ui.js`
- `apps/academia/src/assets/sw.js`
- `apps/academia/src/assets/studio-editor.js`
- `apps/academia/src/assets/studio-editor.css`
- `apps/academia/tests/release-contract.test.mjs`

## Validação

- `npm ci --prefix apps/academia` — concluído.
- `npm test --prefix apps/academia` — passou: contratos da release e verificações DOM de ADM/funcionários.
- `npm run check` — passou; 54 scripts verificados.
- `npm run test:central` — passou; 4/4.
- `npm run build` — passou.
- `git diff --check` — passou.
- QA e segurança aprovaram somente para avaliação de preview isolada. Não houve teste visual em navegador real.

## Limites e próximo passo

Nenhuma alteração foi feita na `main`, no backend, no Supabase, em SQL/RLS ou no catálogo ativo. A branch foi baseada na `main` a pedido do proprietário e não está pronta para merge em `develop`. Uma nova origem Vercel não está na allowlist atual do Edge Function `academy-workspace`; portanto, o login integrado pode não funcionar nesse host. A CTA de demonstração local existe para permitir avaliar o editor sem autenticação ou chamadas de escrita.

Próxima etapa: abrir a preview, verificar visualmente criação, salvamento, reabertura e renderização responsiva; depois definir homologação isolada e contrato de persistência autenticada antes de gravar rascunhos na Academia. Validar schema, tamanho e URLs no servidor antes de qualquer persistência remota.

## Evolução — aula interativa estilo microlearning

**Data:** 25/11/2026 | **Branch de trabalho:** `feature/academia-studio-interactive-player-20261125` | **Estado:** player implementado; prévia e QA visual pendentes.

- A visão do aluno ganhou a opção **Abrir aula interativa** em cada aula. Ela percorre somente os blocos dessa aula como telas sequenciais, mostra etapa/aula, progresso, navegação anterior/próxima e perguntas com feedback.
- A aula chamada “Prova final” calcula resultado demonstrativo, compara com 80%, libera até duas tentativas nesta sessão da prévia e orienta procurar o ADM depois de duas reprovações. O fluxo considera o formato salvo atual (`modules → lessons → blocks`), sem migrar rascunhos.
- Respostas, nota e tentativas ficam somente em memória nesta prévia; não há gravação oficial de progresso, autenticação, pontuação no catálogo nem sincronização com aluno/backend. Fechar/recarregar limpa o estado demonstrativo.
- O player é inspirado em microlearning/SCORM, mas ainda não produz pacote SCORM nem implementa API/runtime SCORM. Não alegar interoperabilidade com LMS nesta fase.
- O treinamento EPI local pode ser revisado em telas pelo botão novo na visão do aluno; o rascunho permanece no navegador onde foi criado. Revisar responsividade e navegação por teclado antes de promover a preview.
- Cache do service worker atualizado para v2 para entregar os novos recursos sem manter os assets antigos em instalações PWA.

### Verificação de código

- `npm run build` — passou.
- `npm test --prefix apps/academia` — passou: 8 contratos, QA ADM e QA de funcionários.
- `npm run check` — passou: 54 scripts verificados.
- `npm run test:central` — passou: 4/4.
- `git diff --check` — passou.
- Agentes de segurança e QA revisaram o player; foram corrigidos o escopo de telas (agora por aula), o feedback de erro contraditório e a reabertura da prova após aprovação na segunda tentativa.
- Nenhuma publicação foi feita até este registro; próximo passo é validar a prévia visualmente e testar o curso EPI em cada aula.
