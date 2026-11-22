# CONTREM — um projeto Vercel e um domínio central

Repositório confirmado: https://github.com/vinisalves76-glitch/contrem.
Projeto Vercel: `contrem`, ID `prj_W6DhrOxmIe0QreKEV0WPSFLqHhco`, equipe `team_rdELIBR2FcBtC4aUChhufYOw`.
O vínculo GitHub foi confirmado pela API da Vercel em 15/11/2026.

| Caminho | Área | Código |
|---|---|---|
| `/` | Site institucional CONTREM | `apps/institucional/src` |
| `/academia/` | CONTREM Academia | `apps/academia/src` |
| `/contremtec/` | Tecnologia de manutenção — demonstração local | `apps/tec` |
| `/contremtec/guia/` | Guia visual demonstrativo da ContremTec | `apps/guia/src` |

**Root Directory vazio (raiz do repositório)**. Build: `npm run build`. Output: `dist`. Install: `node --version` (o build usa apenas módulos nativos do Node). Não configurar a raiz para um aplicativo individual.

`scripts/build-central.mjs` monta a distribuição conjunta. Somente HTML e assets web entram na saída; documentos, código de servidor e SQL ficam fora. Academia e ContremTec registram service workers com escopos e caches separados pelo caminho.

`main` contém a Academia estável e, após o pedido explícito de 15/11/2026, a versão demonstrativa da ContremTec com seu guia vinculado. `develop` contém o novo ADM sandbox e os módulos em evolução. O build de produção recusa a configuração de ADM local. A publicação não conecta bancos nem unifica permissões.

Previews usam o projeto e a proteção existentes. Depois de uma build validada, o alias fixo `contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app` acompanha `develop`. Um alias não cria builds adicionais; agrupar as mudanças antes do push. Nunca tratar a demonstração de ADM/ContremTec como autenticação corporativa.

`contrem-academia.vercel.app` e os Sites privados anteriores continuam preservados como origens de transição; não apagar nem redirecionar antes de validar o uso no domínio central. Dados locais pertencem à origem antiga e não migram automaticamente. Contas existentes continuam no mesmo backend da Academia.

Para publicar: validar a branch estável em preview, conferir commit/projeto, e publicar essa fonte no destino autorizado. Não promover a branch de homologação para produção.
