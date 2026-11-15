# Publicação ContremTec — 15/11/2026

Pedido do proprietário: “Coloque em produção o contremtec”.

## Conteúdo da release

Fonte baseada na `main` remota `13904ffd4c7232e812b80bf1fe6573ab7624e2f1`. Somente ContremTec e guia vinculado foram importados da homologação `3023bbed9a8bbe4cce5b34ccd59ac91942c1606b`; a Academia estável e o institucional permanecem com as mesmas fontes executáveis.

Destinos: `/contremtec/` e `/contremtec/guia/` no projeto Vercel `contrem` (`prj_W6DhrOxmIe0QreKEV0WPSFLqHhco`). O botão ContremTec do site passa a abrir a aplicação completa de demonstração.

O login corporativo continua desativado. A entrada é **Explorar demonstração**; dados e relatórios ficam neste navegador. Guia com conteúdo ilustrativo. APIs, SQL e código de servidor continuam fora da distribuição estática. Nenhum dado real, cadastro de conta ou migração de banco faz parte desta publicação. O novo ADM da Academia não foi incluído.

## Verificação da release

Executar checks de sintaxe e isolamento da ContremTec, build com `VERCEL_ENV=production` e testes centrais de rotas/cache. Conferir ausência de alterações na Academia e no institucional por Git. Validar a fonte da release em preview antes da publicação solicitada e conferir a rota pública no navegador ao concluir.

O resultado final, o commit e o deployment são registrados no histórico de execução. Nenhum estado READY deve ser interpretado como validação de backend corporativo.
