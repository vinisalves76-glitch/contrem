# Diagnóstico de falha de sincronização da Academia — 26/11/2026

## Ocorrência e conclusão

Mensagem relatada: “Não foi possível concluir a operação. Seus dados locais foram preservados. Verifique a conexão e tente novamente.”

Não foi possível determinar a causa exata da tentativa do usuário: o código de produção substituía praticamente todo erro remoto por essa mesma mensagem e não registrava qual operação falhou. A mensagem é gerada no cliente da Academia ao falhar autenticação/carregamento ou sincronização; por si só, não prova indisponibilidade do site, do Vercel ou do banco.

## Evidências consultadas

- `https://contrem.vercel.app/academia/` respondeu HTTP 200 durante a verificação.
- O último deployment de produção consultado estava `READY`, vindo da branch `main` no commit `05bc5da` (23/11/2026). As versões da branch de trabalho paralela apareceram como deployments de preview, com `target: null`.
- O Vercel não reportou clusters de erros de runtime no período de 24 horas. A leitura de logs individuais foi recusada pelo limite de retenção do plano Hobby; portanto, ausência de logs não foi tratada como ausência de erro.
- O projeto Supabase usado pela Academia estava `ACTIVE_HEALTHY`. No recorte de 24 horas, as chamadas `POST` observadas às Edge Functions administrativas retornaram 200; não houve registro de erro nas Edge Functions. Houve um `OPTIONS 403` sem cabeçalho Origin em 25/11, de navegador Android, sem evidência que o conecte à falha relatada. Duas respostas 400 no Auth foram explicitamente `invalid_credentials` e também não comprovam a origem da mensagem atual.

## Ajustes nesta branch

- O log do cliente agora informa a etapa da sincronização (catálogo ou progresso), horário, status/código de erro e referência curta, sem incluir e-mail, token, dados do aluno ou mensagem SQL.
- A mensagem explica qual gravação falhou e orienta a nova tentativa; quando offline, confirma que as alterações seguem guardadas localmente.
- `AGENTS.md` passa a declarar que produção é serviço crítico: agentes paralelos não escrevem na `main`, não alteram aliases de produção nem publicam diretamente. Releases exigem revisão, CI, validação em preview e plano de rollback; falha em qualquer etapa interrompe a publicação.

## Limites e próximo passo

O site e os serviços estavam disponíveis durante a inspeção; isso não identifica retroativamente qual ação falhou no aparelho. Se o erro se repetir após esta correção ser revisada e publicada, a referência e a etapa mostradas na tela permitirão separar falha de catálogo, progresso e conexão. Não houve alteração na `main`, no deployment, nas funções, no banco ou nas migrations nesta ocorrência.

Branch de trabalho: `fix/production-stability-guardrails`, aberta da `main` estável `05bc5da`. Alterações ainda precisam passar por revisão/CI antes de qualquer integração.
