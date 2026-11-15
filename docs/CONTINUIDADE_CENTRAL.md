# Continuidade da centralização

Pedido atual: usar o repositório `vinisalves76-glitch/contrem`, conectado pelo proprietário ao projeto Vercel `contrem`, como fluxo único para todo o projeto.

Fonte recuperada do pacote organizado anterior, sem recriar os aplicativos. Centralização em `/`, `/academia/`, `/contremtec/` e `/contremtec/guia/`. Manifestos, cache e service workers adaptados para caminhos independentes.

Controles: main estável, develop homologação; código de servidor e SQL fora do build; bloqueio de produção para o ADM sandbox. O institucional passa a oferecer acesso direto à Academia e à ContremTec.

Consultar o registro final da execução para commits e deployments. Cada chat deve buscar o código remoto atual e editar somente sua frente. Os repositórios de Sites anteriores não são sincronizados automaticamente com este GitHub.

## Sincronização confirmada

- GitHub: https://github.com/vinisalves76-glitch/contrem.
- Código estável publicado a partir do commit `3d553cff639327a5b574f050da6850fc942e2326`.
- Código de homologação validado a partir do commit `d1129dcc739012ec73dd48db38e6be6a7a1bb90c`.
- Árvores remotas conferem exatamente com as árvores locais testadas (inclusive binários).
- Preview estável de validação: `dpl_D2eg1FaQuSDvUSTrNixi8JEmBgUh`, READY.
- Preview integrada: `dpl_J8eokTw4gzcwdGF6CFVZT8ezJAmm`, READY.
- Produção central: `dpl_HQzBvnSE5SUWuZUunCfXi2MLqoyy`, fonte main estável.
- Preview fixa da homologação: https://contrem-git-develop-vinicius-alves-projects-fdea38e8.vercel.app/. Esse alias acompanha os novos builds de develop.

Verificados: build central estável e de homologação; quatro testes de rotas/escopo/cache; regressão do ADM e do player; 42 testes do backend preparado e check ContremTec. HTTP 200 para Academia, ContremTec e guia na preview; build-info confirma o modo e o commit. Backend corporativo, login real e aparelhos físicos não foram testados neste ciclo. Nenhuma alteração de banco.

A branch main não publica automaticamente por configuração deliberada. Depois de uma aprovação, fazer a publicação explícita da fonte main no mesmo projeto. Develop atualiza automaticamente a preview, com a proteção existente. Commits finais apenas de documentação não alteram os arquivos executáveis publicados.

## Navegador público

Verificados site, acesso a /academia/, login visual, entrada na demo, abertura do iframe Mux, painel e retorno ao institucional em nova aba. /contremtec/ exibe ambiente em preparação na base estável. Login real e reprodução integral não foram testados.
