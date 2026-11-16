# CONTREM — piloto dos agentes Codex

**Situação:** piloto executado com delegação dos três agentes, revisão independente e GitHub Actions aprovados. Em 16/11/2026 o proprietário autorizou integrar essa configuração à `develop`. Este arquivo preserva o roteiro histórico do piloto; o uso contínuo segue o `AGENTS.md` e os fluxos por módulo. A `main` continua reservada à produção.

## Objetivo e papéis
- **Coordenador:** agente principal do Codex; planeja, delega e consolida resultados.
- **`desenvolvedor`:** implementa mudanças pequenas e delimitadas, somente quando a tarefa autorizar.
- **`testes`:** revisa o diff e executa verificações adequadas; não altera código de produto.
- **`seguranca`:** revisão independente de autenticação, RLS, armazenamento, vídeos, uploads e segredos.

## Fluxo histórico do piloto (somente leitura)
1. Abrir o projeto na branch de teste e ler `AGENTS.md`, `00_LEIA_PRIMEIRO.md` e as regras do módulo afetado.
2. O coordenador define o escopo e os critérios de aceite; para o piloto, **somente leitura** do projeto.
3. Delegar explicitamente ao `desenvolvedor` uma análise de localização do código (sem edição no piloto), ao `testes` uma análise dos comandos de validação e ao `seguranca` uma análise de riscos.
4. Consolidar relatórios independentes, com limites e evidências verificáveis.
5. Não executar push, commit, merge, deployment, migrations ou operações no Supabase ou Mux.
6. Aprovação expressa para integração à `develop` obtida em 16/11/2026; tarefas reais posteriores seguem revisão e testes obrigatórios, sem publicação em produção.

## Roteiro do primeiro teste Codex (sem mudança) — já executado

> Coordenador da CONTREM: este é um teste de agentes, **somente leitura**. Abra os arquivos de regras e peça ao `desenvolvedor` para identificar onde está o cadastro de aulas no módulo Academia; ao `testes` para listar e avaliar os testes relevantes sem modificar arquivos; e ao `seguranca` para verificar riscos de autorização no cadastro ADM, distinguindo sandbox de produção. Espere os três retornarem. Forneça evidências por agente, arquivos consultados, riscos, status e confirme que nenhum arquivo foi alterado. Não faça commit, push ou deploy.

## Verificações disponíveis
- `python3 tests/validar_agentes.py` — checa estrutura dos agentes (não executa modelos).
- `npm run check`, `npm test`, `npm run build`, `npm run test:central` — checks da aplicação, executados pela CI existente.
- Na branch `chore/agentes-piloto` roda também a GitHub Action de validação de agentes.

## O que não é prova de funcionamento
TOML válido, CI verde e Vercel `READY` não provam que os subagentes foram executados. A comprovação depende do log de uma sessão Codex na qual os três papéis efetivamente trabalharam.

## Segurança
Não conceder autonomia para editar `main`; não colocar tokens em arquivos; proteção de branch e checks obrigatórios precisam ser configurados na interface do GitHub por alguém com permissão administrativa.

## Evidência de validação

- Delegação: `desenvolvedor`, `testes` e `seguranca` executaram revisões independentes no Codex, conforme relatório compartilhado pelo proprietário; execução real observada no VS Code.
- Desenvolvimento: testes adicionais de validação do cadastro de aulas na Academia; primeira execução da CI identificou falha na preparação do cenário de aula única.
- Correção: os testes passaram a editar a aula existente para preservar a regra de aula única; GitHub Actions da CONTREM voltou a passar no commit `f207a8daaef55d868f01a222afb790645e140b23`.
- Sincronização ChatGPT/Codex/GitHub: protocolo anti-retrocesso consolidado no `AGENTS.md`, validado por CI no commit `b928bfda05582c470b13fe6e4a02a8562d1a6ee2`.
- **Limites:** testes de DOM emulado não equivalem a QA visual em navegador; sandbox ADM não representa autorização segura de produção; proteção de `main` precisa de configuração administrativa separada.
