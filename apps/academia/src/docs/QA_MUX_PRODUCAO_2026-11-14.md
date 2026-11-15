# Produção Mux — 14/11/2026

Publicado por solicitação explícita: “Coloque em produção removendo o youtube”.

- Produção: https://contrem-academia.vercel.app/
- Deployment: dpl_EwJzQCYv4MyFr7dnZvktUFFE7pqS — READY, target production.
- Preview: https://contrem-academia-preview.vercel.app/ — dpl_5yRWcDQ71csdAKP9cggL55yh98MT.
- Rollback anterior: dpl_4GvQkqd5quN3yVRa4Miv4Cpaz4PL.
- Mesmo projeto Vercel va-academia, prj_LYGfson8SNvVehn8ClMlpAT5YUwt.

A apresentação institucional usa Mux público, Playback ID hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500. Abre em cada entrada na demonstração e pode ser reaberta no painel. Esse ID não é Asset ID nem chave de API. Reprodução e botão externo do YouTube foram removidos das aulas. As três aulas de exemplo ficam pendentes de cadastro no Mux; não foram substituídas pelo vídeo institucional. URLs antigas continuam aceitas somente na recuperação de backups v1–v4, sem reprodução. Dados e progresso foram preservados. Novas mídias públicas aceitam Playback ID ou URL Mux válida.

O backend de aulas privadas assinadas está preparado separadamente; não foi publicado ou conectado neste ciclo. Não afirmar que o Mux público impede compartilhamento. Para aulas privadas, concluir autenticação/autorização no servidor, chaves de assinatura em ambiente protegido e associação dos assets ao banco. Não colocar segredos no frontend. Nenhuma alteração no banco foi feita nesta publicação.

A fonte em published-source/src é a cópia exata dos 38 arquivos publicados, todos verificados por SHA-1. Em src, somente esta documentação final foi acrescentada depois do deploy; o código executável é idêntico. production-source-checks.json registra a comparação anterior à atualização documental. Snapshot de rollback fica em rollback-source/src. Configuração de publicação existente: raiz src, site estático. Não publicar pastas de testes, backend preparado ou snapshots como raiz do site.

O registro abaixo e docs/QA_MUX_PRODUCAO_2026-11-14.md prevalecem sobre referências históricas a preview e YouTube.

## QA PASSOU

- 38/38 arquivos da fonte de produção conferidos contra os hashes da Vercel; alias público aponta para o deployment acima.
- Verificações de sintaxe JS e teste VM tests/qa-video-migration.cjs.
- IDs/URLs Mux válidos aceitos; YouTube, outros hosts, protocolos inseguros, credenciais embutidas e URLs com tokens recusados para cadastro novo.
- Backups versões 1–4 preservados, incluindo referências antigas e vídeos pendentes.
- Chrome cloud no domínio público de produção: login, entrada na demo e apresentação Mux automática reproduzindo até 1:34.
- Pular apresentação e entrar na sala de aula. Aula pendente mostra mensagem clara, iframe about:blank e conclusão desabilitada.
- Sala de aula: zero links/iframes de YouTube no DOM. Aviso #pwaUpdate não visível.
- Voltar aos cursos, sair, entrar novamente: apresentação automática Mux reproduzindo em 0:08. Histórico do curso iniciado preservado.
- Cache PWA v9 e atualização silenciosa mantidos; vídeos externos não entram no cache do shell.

## NÃO TESTADO

- Reprodução integral de 6min08s, verificação auditiva do som ou conexão lenta.
- iPhone/Safari físico, Android físico e atualização de instalação PWA antiga.
- Login de aluno/ADM real, reprodução assinada de cursos e upload Mux automatizado.

## Registro operacional

O revisor automático bloqueou a abertura de um link temporário de revisão de preview. O link foi revogado; não houve nova tentativa de contornar o bloqueio nem desativação de proteção. O QA foi concluído pelo endereço público de produção, cuja publicação foi expressamente autorizada pelo usuário. Uma tentativa de promoção da preview retornou HTTP 422; a publicação em produção foi concluída com o mesmo payload de fonte validado. Os 38 hashes finais foram conferidos. Nenhum token temporário está neste pacote.
