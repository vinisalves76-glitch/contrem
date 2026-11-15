# ADM — proteção das edições, 15/11/2026

Base: `3023bbed9a8bbe4cce5b34ccd59ac91942c1606b`, comum a develop e feature/academia-adm. Implementação: `92f765d2478b8dc67580b0b1ca88c31ab6bd6cab`.

## Estrutura atual conferida

Fonte canônica em https://github.com/vinisalves76-glitch/contrem. Projeto de hospedagem central contrem (`prj_W6DhrOxmIe0QreKEV0WPSFLqHhco`), build na raiz e saída dist. A Academia ocupa /academia/; o painel ADM é o sandbox de homologação, sem acesso ao Auth ou ao banco real. A configuração git de publicação só habilita develop. A main observada neste ciclo foi b809ec91ffbba15bb6c40ec31835674dc7cc7108. A produção observada foi dpl_8mmUPopw84defEhECBxxBMYPSQEP, publicada pelo outro ciclo; nenhum deles foi alterado nesta frente.

## Correções

- Aviso visível para informações de curso ou aula alteradas e ainda não salvas.
- Recusar descartar uma edição mantém os campos ao tentar abrir outro curso, duplicar, iniciar outra aula, cancelar, sair ou recarregar os dados.
- Alternar as etapas preserva os campos; publicar exige salvar as edições pendentes.
- Salvar os dados do curso não pode apagar uma aula que ainda está em edição.
- beforeunload pede o aviso nativo quando há alterações; a exibição desse aviso depende do navegador.
- Carga horária validada entre 0,25 e 500 horas, em intervalos de 0,25; duração opcional da aula aceita somente minutos inteiros de 1 a 10.000.
- Cache do shell da Academia versionado; escopo /academia/ preservado.

## PASSOU

`npm --prefix apps/academia test`: regressão de login local, acessos por curso, publicação de aula única/série, reordenação, progresso, Mux/backups e 42 testes de autorização/assinatura do backend preparado. Os testes de interface usam DOM emulado com linkedom: cancelamento de navegação/saída/recarga, preservação da edição da aula, publicação bloqueada com edição pendente, aviso de unload apenas quando necessário e números inválidos foram exercitados.

`npm run check`: configuração e sintaxe, 41 scripts. `npm run build`: montagem central. `npm run test:central`: quatro testes de caminhos, assets, caches e exclusão de fontes internas da distribuição. `git diff --check`: sem problemas.

## Publicação de homologação confirmada

Feature enviada e integrada em develop no commit f22ebb91de39d26a8ebd1d18bdb77bcfde77f6f1. Vercel: dpl_Ec9sBHndh8GXuQx2Csxwdie59bHJ, READY, target null. Endereço: https://contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app/academia/. Verificação autenticada: HTTP 200 em build-info.json, /academia/ e no JS alterado; commit, branch e modo de homologação confirmados, conteúdo JS idêntico ao testado. Status Vercel do commit no GitHub: success. Não houve segunda publicação para esta finalização documental.

## NÃO TESTADO

Navegador real, layout visual ou aparelhos físicos neste ciclo. Aviso nativo de fechamento em navegadores móveis. Contas reais, backend conectado, uploads e reprodução privada ponta a ponta. Os testes do backend preparado não significam que ele está implantado. Nenhum SQL, conta real ou permissão foi alterado. Main e produção preservadas.
