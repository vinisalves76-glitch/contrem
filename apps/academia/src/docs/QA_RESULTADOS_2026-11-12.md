# QA da VA Academia — 12/11/2026

Base testada no navegador: `dpl_36zUcqmcFZK7FmAjZHoBkL1nchVG`, preview protegida, Chrome desktop (viewport aproximado 1340×900), dados fictícios em origem isolada. Esta matriz descreve **a base antes das correções**. Os testes do código corrigido incluem `node tests/qa-model.cjs`; o smoke da nova preview deve ser relatado após o deployment.

| Caso | Resultado | Evidência resumida |
|---|---|---|
| QA01 entrada demo | PASSOU | Nome de demonstração abre catálogo e aviso de login simulado. |
| QA02 busca/estado vazio | PASSOU | Busca inexistente mostra mensagem; “mecânica” encontra o curso. |
| QA03 vídeo incorporado | NÃO TESTADO | Iframe carregou título, miniatura e duração de 9:01; após Play ficou em 0:00 com spinner no navegador remoto. Reprodução contínua não foi confirmada. |
| QA04 YouTube externo | NÃO TESTADO | Link aponta ao mesmo ID `nBE8JrByOf0`; a abertura externa não foi executada. |
| QA05 navegação | PASSOU | Próxima aula abriu “Revisão”; anterior retornou. |
| QA06 progresso | PASSOU | Marcação de aula mostrou 1/3, depois 3/3 e liberou certificados. Desmarcação não foi exercitada. |
| QA07 persistência | PASSOU | Após recarga, progresso 1/3 e perfil persistiram; entrada continuou demonstrativa. |
| QA08 perfil | PASSOU | Nome e e-mail fictícios salvos e nome restaurado após recarga. Empresa/função não exercitadas. |
| QA09 histórico/desempenho | NÃO TESTADO | Histórico exibiu curso iniciado e 33%; médias e horas não foram comparadas após a avaliação. |
| QA10 admin | NÃO TESTADO | Seleção de curso e inclusão de questão persistiram na navegação; CRUD de curso/aula/exclusão não foi exercitado. |
| QA11 avaliação | PASSOU | Resposta errada deu 0%, correta deu 100%, duas tentativas e aprovação. |
| QA12 certificados | FALHOU | Ambos foram emitidos e abriram documento; certificado impresso exibia apenas “identificador demonstrativo”, sem aviso destacado de demonstração. Corrigido no código. Impressão em papel/PDF não executada. |
| QA13 backup v4 | NÃO TESTADO | Download exportado com confirmação na interface; importação/restauração travou no seletor remoto de arquivos. Conteúdo do download não inspecionado via UI. |
| QA14 importação v1–v3 | NÃO TESTADO | Fixtures passaram no teste de modelo Node; UI de upload não testada. |
| QA15 JSON inválido | NÃO TESTADO | Validador testado por modelo com URLs/IDs inválidos; erro de arquivo pela UI não testado. |
| QA16 mobile | NÃO TESTADO | Browser remoto não ofereceu mudança de viewport nesta rodada. |
| QA17 desktop | PASSOU | Catálogo, sala e admin renderizaram e responderam aos cliques no Chrome desktop. |
| QA18 offline | NÃO TESTADO | Sem PWA ou garantia de HTML offline. |
| QA19 regressão | NÃO TESTADO | Teste de modelo após correções: URLs YouTube, schema v1–v4 e rejeição de dados inválidos. Fluxo completo pós-correção depende da nova preview. |
| QA20 nova preview | NÃO TESTADO | Confirmar `READY`, `target: null` e smoke antes de declarar entrega. |

## Falhas e correções desta rodada
- A nota mínima 0% era lida como 70% por uso de `||`; substituído por `??`/conversão numérica.
- URLs de qualquer domínio com parâmetro `v` eram aceitas como YouTube; agora só hosts e formatos YouTube explícitos com ID de 11 caracteres.
- O certificado impresso ganhou aviso visível “DEMONSTRAÇÃO · SEM VALIDAÇÃO PÚBLICA”.
- Excluir curso deixava tentativas e atividade órfãs, que tornavam o backup inconsistente; a exclusão limpa essas chaves.
- Importação agora valida referências de progresso e IDs seguros, grava as cinco chaves com restauração em falha e atualiza o perfil/seleção local.

## Próximo QA dirigido
1. Validar importação v4 e v1–v3 por seletor de arquivos em contexto descartável, comparando catálogo/progresso/perfil antes e depois.
2. Conferir vídeo com reprodução contínua e vídeo público tecnicamente adequado para mecânica pesada.
3. Testar viewport 390 px, estado vazio, CRUD completo e impressão/PDF dos certificados.


Atualização de menu 12/11/2026: ADM conectado vê Treinamentos e Alunos em áreas próprias; aluno vê aprendizagem, cursos, desempenho, perfil e certificados. Prévia: https://contrem-academia-preview.vercel.app/ (`dpl_FXAaPEnawfWBbtKoFZuJL6suJtjH`). Produção não alterada. Sintaxe, QA local e HTML remoto 200 passaram; sessão autenticada real não testada.
