# QA — Identidade CONTREM Academia · 12/11/2026

Base preservada: dpl_3wxsxDXvPyKZMmwLmDRmjgGoim3D. Escopo: identidade visual, estrutura de navegação e rótulos; não há novo backend.

| Caso | Resultado | Evidência |
|---|---|---|
| Código integral e snapshot | PASSOU | index.html de 42.383 bytes, SHA-1 be4a0a2fe0f40c8a0ad8ce551e5dce8b43e8facf, igual à árvore da última preview READY; snapshot preservado |
| Sintaxe do script original e da integração visual | PASSOU | node --check no script extraído e em assets/contrem.js |
| IDs únicos e compatibilidade local | PASSOU | 89 IDs únicos; cinco chaves locais e app do backup preservados |
| URLs e backups | PASSOU | node tests/qa-model.cjs: URLs permitidas, schemas v1–v4 e rejeição de entradas inválidas |
| Importação e rollback | PASSOU | node tests/qa-import.cjs: v1–v4 e restauração após falha de gravação |
| Entrada e dashboard desktop | PASSOU | Chrome: tela CONTREM, entrada demonstrativa e área do aluno renderizadas |
| Sala de aula / progresso | PASSOU | Aula aberta, iframe YouTube presente, primeira aula marcada, próxima aula mostra 1/3 concluídas |
| Administração | PASSOU | Curso de teste criado; aula adicionada com URL YouTube e listado como 1 aula |
| Responsividade em celular | NÃO TESTADO | CSS inclui regras até 380px; emulação pelo DevTools indisponível no ambiente. Não afirmar teste em aparelho real |
| Reprodução contínua do vídeo | NÃO TESTADO | Iframe e título público renderizaram; reprodução contínua não foi exercitada |
| Avaliações e certificado ponta a ponta | NÃO TESTADO | Identidade do template atualizada; fluxo completo não foi retestado nesta revisão |
| Preview final / arquivos | PASSOU | dpl_4RaaX8nwWFd2TdKm1PoQpE6LdjV1 READY, target null; HTML, CSS, JS, símbolo e imagem HTTP 200 com acesso autenticado |

Os registros e cursos criados no navegador de QA ficam somente nessa origem e não são incluídos nos arquivos de entrega. Login/admin/certificados continuam demonstrativos. O vídeo do curso exemplo é provisório e não deve ser divulgado como curso próprio.

## Entrega da preview

https://contrem-academia-preview.vercel.app/ é o alias estável atribuído ao deployment de PREVIEW `dpl_4RaaX8nwWFd2TdKm1PoQpE6LdjV1`, READY, target null. URL original: https://va-academia-pa0r0tc9u-vinicius-alves-projects-fdea38e8.vercel.app/. A proteção Vercel permanece ativa; o navegador remoto chegou à tela de login. A UI foi testada localmente com o mesmo HTML/CSS/JS. O fetch autenticado confirmou os cinco recursos. Não declarar teste completo da UI hospedada.

Persistência pós-recarregamento também observada: curso e aula de QA permaneceram, e o progresso do curso demo continuou em 1/3 (33%). O curso de QA foi removido somente do navegador de teste; nenhum curso do usuário foi alterado.

Este registro foi concluído após o deployment e está mais atualizado no pacote que na preview servida. Não foi feito novo deployment apenas para atualizar o registro. Somente uma preview criada neste ciclo; produção e site institucional preservados.
