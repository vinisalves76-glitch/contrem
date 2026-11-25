# Frentes de trabalho

| Frente | Caminhos de responsabilidade | Branch de trabalho | Situação |
|---|---|---|---|
| Empresa e infraestrutura | raiz, `docs/`, `.github/`, `apps/institucional/` | `chore/organizacao-contrem` | Organização e sincronização |
| Academia estável | `apps/academia/src/` | correção isolada a partir da base estável | Produção Mux preservada em `main` |
| ADM da Academia | `apps/academia/src/`, `tests/`, `server/`, `database/` dentro do módulo | `feature/academia-adm` | Sandbox local, integração real pendente |
| ContremTec | `apps/tec/` | `feature/contremtec` | Demonstração publicada por solicitação; banco não conectado |
| Guia tipo Volvo | `apps/guia/` | `feature/guia-equipamentos` | Guia demonstrativo publicado com a ContremTec; integração operacional pendente |

`develop` é a integração de homologação. Mudanças simultâneas no mesmo módulo exigem comparar commits, não copiar uma pasta antiga. Cada branch só existe remotamente depois do push confirmado; consultar `docs/ESTADO_ATUAL.md`.

As pastas `server/` e `database/` da Academia são preparação de integração e não são publicadas pelo build estático.

## Remoto confirmado

As branches main, develop, feature/academia-adm, feature/contremtec e feature/guia-equipamentos existem no GitHub CONTREM. O fluxo do domínio central está em docs/VERCEL.md. A organização de infraestrutura usa branches chore quando necessário, sem um novo projeto Vercel.
