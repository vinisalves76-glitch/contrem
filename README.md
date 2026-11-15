# CONTREM

Código-fonte central da CONTREM, organizado em aplicações independentes. A empresa reúne CONTREM Academia e ContremTec; o site institucional apresenta as duas frentes.

| Aplicação | Caminho | Finalidade |
|---|---|---|
| Institucional | `apps/institucional` | Apresentação da empresa |
| Academia | `apps/academia` | Cursos e área do aluno; ADM novo em desenvolvimento |
| ContremTec | `apps/tec` na homologação | Relatórios e gestão de manutenção |
| Guia interativo | `apps/guia` na homologação | Guia visual de equipamentos da ContremTec |

Comece por `00_LEIA_PRIMEIRO.md`. O estado real e as pendências estão em `docs/ESTADO_ATUAL.md`; o trabalho de cada chat está em `docs/FRENTES_DE_TRABALHO.md`.

## Uso local

Node.js 20 ou superior. Nenhum comando de build publica automaticamente.

```sh
npm run check
npm run build:academia
python3 -m http.server 4173 --directory apps/academia/dist
```

Para a homologação do ADM, na branch de desenvolvimento:

```sh
npm ci --prefix apps/academia
npm test
```

O build principal monta todas as aplicações em caminhos separados no mesmo domínio. Os builds individuais continuam disponíveis para diagnóstico. Não servir o repositório completo em um domínio público. A origem e a base local do navegador mudam entre domínios; dados fictícios do ADM e favoritos não são transportados automaticamente.

## Fluxo

`feature/*` e `fix/*` → revisão e integração em `develop` → preview fixa → aprovação do proprietário → versão estável em `main` → publicação controlada.

O fluxo de produção e preview está definido em `docs/VERCEL.md`. A publicação de produção é deliberada, conforme `docs/VERCEL.md`. A criação e a conexão remota só estão concluídas quando registradas com evidência em `docs/ESTADO_ATUAL.md`.

## Endereço central

Site em `/`, Academia em `/academia/`, ContremTec em `/contremtec/` e guia em `/contremtec/guia/`. Build conjunto: `npm run build`; verificação das rotas e do isolamento PWA: `npm run test:central`.
