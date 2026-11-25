# QA_WORK — checklist para executar (status inicial NÃO TESTADO)
Resultados efetivamente executados nesta rodada: `docs/QA_RESULTADOS_2026-11-12.md`. Esta lista abaixo é o roteiro de regressão e não substitui evidência de execução.
Legenda: PASSOU / FALHOU / NÃO TESTADO. Registrar evidências, navegador, data e ID deployment.
QA01 Login demonstrativo abre dashboard; deixa claro que não há auth real.
QA02 Catálogo/busca/filtro e estado vazio.
QA03 Iframe do YouTube abre e vídeo reproduz de verdade.
QA04 Abrir no YouTube leva à mesma aula.
QA05 Navegar aulas anterior/próxima/lista.
QA06 Marcar/desmarcar concluída e ver progresso percentual correto.
QA07 Recarregar aba e retomar dados/aula.
QA08 Editar perfil (nome/e-mail opcional/empresa/função) e persistir.
QA09 Histórico, taxa de aprovação, média, horas e cursos completados.
QA10 Admin demonstrativa: criar/editar/excluir cursos, aulas, questões.
QA11 Avaliações: respostas, tentativas, notas, exigência de aprovação.
QA12 Certificado de participação/aprovação, duplicidade e impressão DEMO.
QA13 Exportar backup schemaVersion 4, comparar dados importados em navegador isolado.
QA14 Importar schemas 1, 2, 3 em testes isolados, sem sobrescrever dados pessoais.
QA15 Testar JSON inválido, URLs inválidas, cursos sem aulas e cancelamentos.
QA16 Mobile: menus, player, formulários, overflow e toque.
QA17 Desktop: navegação, visual e estados vazios.
QA18 Falha de conexão, persistência local e limites (não afirmar PWA offline).
QA19 Regressão completa depois de correções.
QA20 Abrir e testar o deployment de PREVIEW efetivamente entregue.

ATENÇÃO: nenhum teste acima está marcado como concluído neste handoff. READY não basta.
