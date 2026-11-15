# CONTREM — organização atual de 15/11/2026

Publicação atual autorizada: o proprietário pediu colocar a ContremTec em produção. A versão de demonstração será servida em `/contremtec/` no domínio central, com o guia em `/contremtec/guia/`. Isso substitui a restrição histórica de manter apenas a demonstração privada, sem autorizar conexão corporativa nem migrações. A Academia estável permanece preservada.

Leia `../../AGENTS.md`, `../../docs/ESTADO_ATUAL.md` e a continuidade deste módulo. O repositório central único foi autorizado; instruções históricas de projetos independentes abaixo descrevem o ciclo de origem. O isolamento de dados e o escopo de edição por módulo permanecem.

Fonte da aplicação preservada neste diretório. APIs preparadas ficam em `server/`; migrations históricas ficam em `database/historical-migrations/`. Nenhuma dessas pastas é publicada pelo build estático. As APIs não têm dependências/configuração para execução corporativa concluídas. Não criar uma pasta `api/` ativa nem executar SQL sem revisão e autorização no ciclo próprio.

O código de demonstração continua local. Não conectar ao banco da Academia nem ao sistema anterior por causa desta consolidação.

---
# Instruções para agentes — ContremTec

1. Ler `00_LEIA_PRIMEIRO.md`, `README.md` e `docs/CONTINUIDADE_CONTREMTEC.md`.
2. Este é um projeto independente da CONTREM. Não atualizar nenhum sistema anterior. Não reutilizar identidade, credenciais, cache ou dados de outra empresa.
3. CONTREM Academia é um setor distinto, acessível pelo link opcional já existente. Não editar a Academia neste trabalho.
4. A fase atual é reidentificação e homologação privada. Reutilizar este projeto e esta URL para as próximas revisões. Não publicar uma versão corporativa pública nem conectar dados sem instrução expressa.
5. O backend padrão é `js/core/local-preview-adapter.js`, sem rede. O adaptador online é fonte preservada, inativo. Nunca substituir a autenticação real por permissões da demonstração em um ambiente corporativo.
6. Não aplicar SQL nem alterar Auth, RLS, Storage ou bancos de outros projetos. Migrations históricas exigem revisão, isolamento e plano próprio antes do uso.
7. Preservar a manutenção **125h**, os perfis, os fluxos e a regra de descrição obrigatória em NOK. Não criar ciclos alternativos ou novos processos por inferência.
8. Usar `develop` para homologação e branches de trabalho quando necessário. A branch `main` não é destino de desenvolvimento. O repositório de hospedagem privada pode usar sua branch de sincronização própria.
9. Executar `npm run check` e `npm run build`; validar no navegador as telas afetadas. Não afirmar testes não executados.
10. Atualizar a continuidade com o comportamento real, limitações e resultado das verificações. Não incluir segredos, dados reais nem artefatos da empresa anterior.
