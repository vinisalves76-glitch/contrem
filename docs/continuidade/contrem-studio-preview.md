# CONTREM Studio — preview inicial

**Branch:** `feature/academia-studio-preview-20261125`  
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
