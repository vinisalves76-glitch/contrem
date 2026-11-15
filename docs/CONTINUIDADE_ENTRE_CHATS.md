# Como continuar em outro chat

Chats não compartilham automaticamente o estado do editor. O repositório e estes arquivos são o ponto comum. Um Site que outro chat edita não atualiza o GitHub sozinho.

## Ao começar

1. Abrir o repositório CONTREM confirmado em `docs/ESTADO_ATUAL.md`.
2. Ler as instruções obrigatórias e a linha da frente em `docs/FRENTES_DE_TRABALHO.md`.
3. Executar `git fetch origin`, conferir alterações locais e consultar a branch da frente.
4. Comparar a fonte remota atual com a versão do chat. Importar somente o delta do próprio módulo; não substituir a árvore inteira.

## Ao encerrar

Registrar em `docs/continuidade/<frente>.md`: objetivo, base, arquivos alterados, testes realmente executados, limites, próximo passo, commit e eventual deployment. Fazer commit e enviar a branch autorizada. Atualizar a tabela quando uma alteração for integrada em `develop`.

Somente a homologação integrada em `develop` deve atualizar a preview compartilhada; agrupar mudanças antes de enviar evita builds a cada ajuste. Uma URL fixa não reduz, por si só, o número de builds.

## Instrução para iniciar os chats existentes

“Continue a frente indicada em docs/FRENTES_DE_TRABALHO.md no repositório CONTREM. Leia 00_LEIA_PRIMEIRO.md e AGENTS.md, atualize a branch remota e trabalhe apenas no módulo correspondente. Preserve as outras frentes, registre a continuidade e não publique produção.”

Os links dos protótipos anteriores continuam registrados como origem. Para atualizar um Site privado, usar o mecanismo próprio de publicação e conservar sua audiência; um commit neste repositório não transfere a proteção de acesso de uma hospedagem para outra.
