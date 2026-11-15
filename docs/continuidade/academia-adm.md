# ADM da CONTREM Academia

Frente do chat “ADM da Academia”. Branch: `feature/academia-adm`; caminho: `apps/academia/`.

Fonte: pacote `CONTREM_ACADEMIA_ADM_PREVIEW_2026-11-14.zip`, deployment `dpl_DDoapnGQ8enodhJP11m8jqARUmmJ`. O código executável confere com a preview; quatro documentos foram finalizados depois da publicação. A versão estável Mux da Academia permanece em `main`.

Construtor de curso em informações/aulas/revisão; aula única ou série; rascunho, publicação demonstrativa, ordenação/edição/remoção de aulas, duplicação, busca/filtro, visualização de sala, alunos fictícios e matrícula por curso. Tudo fica neste navegador/origem. O sandbox não acessa o Auth nem o banco real.

Backend de mídia privada recuperado do pacote de streaming, preservado em `server/` com testes de autorização e assinatura. SQL é referência do ciclo anterior, não deve ser reaplicado. Nenhum deploy de backend ou alteração de banco é parte da organização.

Próximo passo: concluir os fluxos do ADM, revisar contratos e testar Auth/RLS em homologação isolada; validar mídia privada e upload; só integrar à produção mediante pedido. Não substituir o serviço conectado pela implementação local.

Testes: `npm ci --prefix apps/academia`; `npm --prefix apps/academia test`. Build estático: `npm run build:academia` na raiz.
