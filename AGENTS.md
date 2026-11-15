# CONTREM — instruções para todos os chats e agentes

## Autoridade e organização

O pedido do proprietário em 15/11/2026 autoriza um único código-fonte CONTREM, organizado por setores e módulos, com GitHub para versionamento e Vercel para hospedagem. Esta decisão substitui instruções históricas que proibiam o compartilhamento de repositório entre Academia e ContremTec. A separação funcional, de dados e de permissões continua obrigatória.

1. Leia `00_LEIA_PRIMEIRO.md`, `docs/ESTADO_ATUAL.md`, `docs/FRENTES_DE_TRABALHO.md` e a continuidade do módulo antes de editar.
2. Confira a branch, o status e o remoto. Fonte compartilhada só é atual após `git fetch`; não trabalhe a partir de ZIP antigo por conveniência.
3. `main` representa a base estável. Desenvolva em `feature/*` ou `fix/*` a partir de `develop`. Integre alterações verificadas em `develop`, agrupando a publicação de preview por ciclo.
4. O pedido atual autoriza a centralização da base estável em contrem.vercel.app e a sincronização GitHub/Vercel. Isso não autoriza promover ADM local, ContremTec demonstrativa ou guia para produção corporativa; esses módulos completos permanecem na homologação. Novas funcionalidades em produção exigem pedido no ciclo correspondente.
5. Edite somente os caminhos da frente escolhida. Não regrave diretórios de outros módulos com cópias de outro chat. Consulte a tabela de frentes; resolva conflitos por arquivo preservando as duas funcionalidades.
6. Atualize o registro de continuidade com arquivos, branch, commit, testes, status e próximo passo. Atualize `docs/ESTADO_ATUAL.md` quando o estado real mudar.
7. Unificação do repositório não autoriza unificar Auth, papéis, RLS, caches ou tabelas. Não executar SQL, migrations ou conectar bancos neste ciclo. APIs e migrations importadas são fonte, não infraestrutura automaticamente ativa.
8. Academia mantém Mux e atualização silenciosa. Não reintroduzir YouTube. Preservar os identificadores de backup e armazenamento legados; renomeá-los depende de migração revisada.
9. ADM atual é sandbox local de dados fictícios; nunca usar o serviço da preview como autenticação ou autorização de produção. ContremTec usa adaptador local isolado. Guia contém conteúdo demonstrativo, não procedimentos técnicos validados.
10. Preservar preventiva **125h**, descrição obrigatória para NOK e regras existentes. Não inventar processos ou credenciais.
11. Não enviar segredos, senhas, tokens, arquivos de ambiente, dados pessoais de teste real ou exportações de banco ao repositório. Chaves públicas de cliente existentes não são chaves administrativas.
12. Executar verificações e testes adequados ao módulo, sem alegar QA que não ocorreu. `READY` confirma deploy, não fluxo funcional.
13. O código-fonte canônico é https://github.com/vinisalves76-glitch/contrem, confirmado em 15/11/2026. Repositórios internos de hospedagem e Sites são destinos de publicação/importação; não presumir sincronização bidirecional entre eles e GitHub.

## Comandos comuns

- `npm run check`: configuração do monorepositório, sintaxe e integridade das fontes estáticas.
- `npm run build:academia` e `npm run build:institucional`: builds separados.
- Em `develop`: `npm ci --prefix apps/academia`, `npm test`, `npm run build:tec`, `npm run build:guia`.
- Consulte `docs/VERCEL.md` antes de alterar o vínculo ou publicar. Não publicar a raiz inteira do repositório.

## Publicação central

O único projeto principal da Vercel é `contrem`. Root Directory vazio, `npm run build`, saída `dist`. Não configurar raiz por aplicativo nem publicar fontes internas. Leia docs/VERCEL.md.
