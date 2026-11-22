# CONTREM — instruções para todos os chats e agentes

## Integração real da Academia autorizada — 22/11/2026

O proprietário solicitou iniciar a substituição da demonstração por Academia integrada ao banco e ao Mux. Esta autorização atualiza os limites históricos que proibiam conectar o backend da Academia: permite preparar e verificar Auth, autorização, funções e mudanças aditivas restritas a `academy_*` / `academy_private` no projeto existente. Não altera módulos operacionais do banco compartilhado nem autoriza importar cursos QA como conteúdo real. A demonstração não será publicada como produção. O ciclo está em `feature/academia-integracao-producao`; estado, alterações remotas e bloqueios constam de `docs/ACADEMIA_INTEGRACAO_PRODUCAO.md`. A substituição pública depende da conclusão dos fluxos reais, incluindo provas/certificados no servidor e configuração Mux; não remover as proteções para publicar funcionalidades incompletas.

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


## Sincronização obrigatória entre ChatGPT, Codex local e GitHub (anti-retrocesso)

**Fonte canônica:** o GitHub `vinisalves76-glitch/contrem`, na **branch apropriada ao módulo e à tarefa**. O Codex no VS Code trabalha sobre um clone **local** e não recebe automaticamente os commits enviados por outros chats ou ferramentas. Um chat ChatGPT com acesso ao GitHub trabalha no remoto, mas **não** atualiza a pasta local do usuário. Nenhum agente deve supor que duas cópias estão sincronizadas.

### Ao começar toda tarefa

1. Identificar **repositório, módulo, branch, HEAD local e HEAD remoto**, e ler as instruções atuais (`AGENTS.md`, `00_LEIA_PRIMEIRO.md`, documentos de estado/frente, `AGENTS.md` do módulo). Informar se a leitura foi local ou remota.
2. **Codex/VS Code local:** antes de analisar ou editar código, verificar `git status --short --branch` e `git branch --show-current`; conferir `git remote -v` e executar `git fetch origin` quando permitido. Comparar o HEAD local com `origin/<branch>` (por exemplo `git log --oneline --left-right HEAD...origin/<branch>`). A simples existência de `origin` não significa que a pasta está atualizada.
3. Se a árvore estiver **limpa** e a branch local estiver atrás, executar `git pull --ff-only origin <branch>` antes de trabalhar; se houver **divergência, erro de fetch, modificações locais ou conflito**, **parar e informar**. Não presumir versão atual, nem sobrescrever, perder ou descartar trabalho do usuário.
4. **ChatGPT/integração GitHub:** obter novamente os arquivos da branch remota e comparar commits antes de qualquer escrita; usar a SHA atual para proteger atualizações. Não editar diretamente `main`. Antes de comunicar a entrega, informar branch, commit, arquivos alterados e se foi necessário sincronizar o VS Code.
5. Se outro chat, Codex ou agente publicar alterações durante a tarefa, revalidar a base remota **antes do push ou PR**. Não fazer push de código baseado em uma revisão ultrapassada nem substituir pastas completas por cópias antigas. Resolver mudanças concorrentes por arquivo, preservando funcionalidades e registrando conflitos.

### Proteção de trabalho local e branch

- **Nunca** executar automaticamente `git reset --hard`, `git clean -fd`, `git push --force`, descartar mudanças, sobrescrever arquivos alterados, apagar branch, fazer stash ou rebase destrutivo para contornar divergência. Solicitar orientação quando houver risco de perda.
- Não misturar commits de `main`, `develop` ou branches de outras frentes. Em tarefas comuns, criar `feature/*` ou `fix/*` atualizada a partir de `develop`; `chore/agentes-piloto` é exceção temporária para validação dos agentes.
- O envio ao GitHub exige commit/push **na branch correta**, revisão do diff e autorização dentro do fluxo. **Push não é deploy; deploy READY não é aprovação funcional.** A Vercel utiliza as regras de `docs/VERCEL.md` e a homologação em `develop` deve manter a Preview existente.
- Caso o computador não tenha Node.js/npm ou o ambiente do Codex bloqueie escrita em `.git/FETCH_HEAD`, **não alegar que sincronizou ou executou testes locais**. Solicitar `git fetch` / `git pull --ff-only` no terminal normal do VS Code quando seguro; executar testes pelo GitHub Actions após push autorizado e analisar os logs.
- Ao concluir tarefa remota, sempre avisar que o clone local **não foi atualizado automaticamente** e fornecer o comando seguro `git pull --ff-only origin <branch>` (somente quando a árvore local estiver limpa e sem divergência).
- Se alterações tocarem o mesmo módulo em chats distintos, consultar `docs/FRENTES_DE_TRABALHO.md` e os commits mais recentes, coordenar qual branch é a fonte da mudança e registrar o resultado nos documentos de continuidade.

### Qualidade e limites

- Desenvolvedor implementa; `testes` e `seguranca` revisam de forma independente; achados relevantes retornam para correção. Executar CI, builds e testes adequados, e declarar limites de cobertura (sandbox ADM não equivale a backend de produção).
- **Regras escritas não fazem sincronização automática, não substituem branch protection e não garantem que qualquer chat carregará este arquivo.** Em toda nova conversa ChatGPT sobre CONTREM, abrir o repositório conectado e ler este `AGENTS.md` e o contexto da frente antes de alterar código.

## Coordenação entre agentes (piloto)

Este processo complementa — e **não substitui** — as regras anteriores deste AGENTS.md, os AGENTS.md dos módulos e `docs/FRENTES_DE_TRABALHO.md`.

- O agente principal do Codex é o **coordenador**, que planeja, delimita o módulo e delega tarefas.
- Use `desenvolvedor` para alterações delimitadas; depois, `testes` e `seguranca` devem revisar de modo independente o diff final. Revisores não editam código de produto.
- Em caso de REPROVADO ou INCONCLUSIVO, indique os riscos, retorne para correção e repita a revisão necessária. Nenhum agente aprova o próprio código.
- O primeiro teste **somente leitura** de `docs/AGENTES_PILOTO.md` foi concluído. Na `develop`, as tarefas reais seguem o fluxo de branches e a revisão independente; não confundir o roteiro histórico do piloto com bloqueio permanente à implementação.
- Nunca publicar em `main`, realizar merge para produção, fazer deploy de produção ou alterar Supabase/Mux/migrations sem autorização específica. Na `develop`, o fluxo passa a ser `feature/*` ou `fix/*` → testes + revisão de segurança → Pull Request → integração homologada. Commits e push devem ocorrer apenas na branch de trabalho autorizada, após revisão do diff.
- O coordenador encerra com evidências: arquivos, testes de fato executados, relatórios dos revisores, pendências e impacto. CI ou Preview READY não comprovam funcionamento de subagentes.
- O proprietário autorizou a integração à `develop` em 16/11/2026 após piloto e CI aprovados. Essa autorização não inclui `main`, publicação em produção, mudanças de RLS/SQL, nem credenciais reais.
