# Criador de treinamentos com IA — prévia 27/11/2026

Base: main remota 05bc5da809ee6ba4c75e328004816a5baeb49a85, após git fetch.
Branch: feature/scorm-ai-preview-20261127. Worktree exclusivo; alterações de outros agentes não foram copiadas.

## Entrega

Rota isolada apps/academia/src/criador-ia/. Usa identidade da Academia existente e o HTML de referência anexado pelo proprietário. Entrada direta sem autenticação para demonstração; não substitui o portal conectado nem suas permissões. O menu da produção não foi alterado.

Fluxo: início → tema/público → materiais/fontes → estrutura editável → tema visual/atividades/avaliação → geração demonstrativa → edição → aluno → revisão → ZIP SCORM 1.2. Modelos locais para LOTO, EPI e diesel; outros temas abrem modelo editável explicitamente incompleto. Nenhuma pesquisa ou geração real é alegada na UI.

Materiais TXT lidos no navegador; outros formatos apenas listados como extração pendente. Nenhum upload ou chamada de API. Rascunho e progresso ficam em chave local própria contrem-ai-preview-v1. Sem contato com banco, Auth, RLS ou APIs de produção. Fotografias ilustrativas oficiais SANY, não diagramas ou instruções de bloqueio específicos dos modelos.

SCORM: manifesto na raiz, um SCO, runtime HTML autocontido sem dependências de rede. Imagens externas não são incluídas na exportação. Comunicação SCORM 1.2 com API pai/opener, status, nota, suspend_data, lesson_location, session_time, commit e finish. Avaliação requer visita/conclusão dos módulos, nota e limite de tentativas. Revisão do usuário habilita exportação de teste; não equivale à validação técnica do conteúdo.

## Integração real proposta

- Uma função no backend existente recebe sessão Supabase e valida ADM Master/Conteúdo com as regras reais do projeto; não confiar no papel enviado pelo cliente.
- OPENAI_API_KEY apenas em secret do servidor; nunca localStorage, fonte HTML, repositório ou pacote SCORM. Modelo via OPENAI_MODEL, explicitamente aprovado.
- POST /api/academy-ai/jobs com idempotency key, etapa (research/outline/content), briefing e referências aprovadas. GET /api/academy-ai/jobs/:id com ownership, status, resultado e uso.
- Responses API com web_search para pesquisa; armazenar URLs/trechos retornados e data da consulta. Busca não garante correção; referências e texto precisam de revisão do instrutor.
- Extração dos materiais em serviço autenticado, com limites de arquivo e armazenamento privado. Tratar instruções dentro de anexos/fontes como conteúdo não confiável.
- Gerar JSON validado por schema (objetivos, módulos, blocos, avaliações, fontes); o renderizador do curso não deve executar HTML/JS arbitrário da IA.
- Processar em jobs com fila/retry controlado/cancelamento; limites por usuário e orçamento; 401/403/429/503 distintos; não fazer fallback silencioso para simulação.
- Versionar rascunho e aprovações; somente ADM Master publica. Editor pode reutilizar a aula SCORM posteriormente integrada à Academia. Enviar somente pacote aprovado ao aluno.
- Regras de duas tentativas no LMS e liberação pelo ADM dependem de backend; o SCO demo não concede tentativas extras.

## Limites e próximos passos

Não há endpoint de IA ativo nem configuração de secret nesta prévia; o usuário ainda não forneceu chave. Ativar IA real exige implementação do serviço autenticado, definição de orçamento e configuração segura do secret, depois QA em homologação. Testar importação SCORM no LMS final antes de promover. Nenhuma migração ou publicação na CONTREM de produção neste ciclo.

Hospedagem isolada de prévia: Site appgprj_6b096a2080948191b08c112f1843d4fc. A cópia de hospedagem não é sincronização bidirecional com o GitHub canônico.

## Ajuste da interface — 27/11/2026

Retirados o item de menu e a página de Integração de IA. Retirados os três cartões explicativos e o rodapé técnico da visão geral. A identificação de demonstração permanece no cabeçalho e na geração para não sugerir IA conectada. Configuração de chave somente por segredo de backend; conexão com OpenAI Developers pendente de habilitação pelo proprietário. Nenhuma chave desta sessão foi acessada, reutilizada ou criada.

## Prévia conectada com base na main — 27/11/2026

Branch exclusiva: feature/academia-scorm-connected-20261127, base main 05bc5da809ee6ba4c75e328004816a5baeb49a85. Preserva as telas, Auth, catálogos, matrículas e Mux da main. Acesso pelo menu ADM → Criar treinamento interativo. A rota do criador verifica getUser e academy_members; não há entrada demonstrativa sem login.

Persistência real: migration remota 20261127115010_academy_authoring_drafts_connected_preview adiciona somente academy_authoring_drafts, com RLS para equipe ativa, grants mínimos, sem DELETE, gatilho SECURITY INVOKER e revisão otimista. Guarda projeto editável, título, auditoria, data e estado de revisão. Rascunhos ficam separados do catálogo publicado. Nenhum curso, usuário, matrícula ou nota existente foi modificado. A UI exige Salvar no banco; edição pendente fica isolada por usuário no navegador, recuperável explicitamente. O banco é a origem da biblioteca.

Transporte da prévia: api/academy-proxy.js encaminha somente as quatro funções existentes da Academia, com JWT do usuário e chave publicável; não usa serviço privilegiado. Verifica origem da própria hospedagem, método, tipo/tamanho do corpo e alvo fixo. Sem cache. O SDK mantém Auth e REST diretos e usa transporte same-origin para Edge Functions nas hospedagens Vercel. Isso evita substituir funções em produção apenas para liberar CORS de nova preview.

Validação realizada: check de 60 scripts; build central; sete contratos release; QA DOM de ADM e funcionário existentes; quatro testes centrais; três testes do proxy; QA DOM do novo criador (wizard/editor/save/conflito/aluno); teste SQL transacional com role authenticated de inserção/leitura/update/revisão/conflito (rollback completo); teste SQL de não membro sem leitura/inserção (rollback completo). Auditoria Supabase não apontou problema na nova tabela/função; avisos preexistentes de outros módulos não foram alterados.

Limites objetivos: geração/pesquisa por IA ainda demonstrativa por ausência de chave. Prévia do aluno do criador é administrativa e não grava nota oficial na Academia. Exporta SCORM, mas importação no LMS final e publicação de aulas SCORM no catálogo existente ainda exigem integração posterior. PDF/Word/PPT continuam somente listados; TXT e texto são guardados no projeto. Esta é a validação da autoria conectada, não uma liberação de produção da IA ou do player LMS.

## Publicação e matrículas do treinamento — 27/11/2026

Após revisão, ADM Master usa Publicar treinamento. A RPC academy_publish_authoring_draft valida a conta e a revisão, cria uma versão do conteúdo e atualiza atomicamente academy_editor_catalog e academy_catalog, preservando os demais cursos. Curso de aula única scorm-<draft UUID> aparece no painel Treinamentos e no checklist de Cursos Avulsos em Alunos. Botão Ir ao painel ADM e matricular alunos abre diretamente essa seção. ADM de Conteúdo revisa e salva; publicação exclusiva do Master continua conferida no backend.

O conteúdo do aluno é uma fotografia dos campos pedagógicos aprovados, sem briefing ou materiais privados do autor. Editar o rascunho não altera a versão publicada. Nova publicação cria outra versão quando o conteúdo muda; matrículas continuam e alunos que já iniciaram ficam na versão em que começaram, sem apagar tentativas/histórico. A entrada na sala do curso abre scorm-player, com o mesmo login e verificação de matrícula ativa. Aula de vídeo continua no Mux.

academy_scorm_runtime aplica sequência de módulos, atividades, nota e limite de tentativas no servidor. Aluno não recebe o gabarito. Tentativas possuem identificador para impedir consumo duplicado em retry. A aprovação atualiza o progresso da Academia, protegido contra conclusão manual pelo endpoint legado. Tabelas de conteúdo publicado e aprendizagem não concedem acesso direto ao cliente; wrappers públicos SECURITY INVOKER chamam funções privadas com verificações de identidade/acesso.

Migrations aditivas aplicadas: 20261127120827_academy_scorm_publication_and_runtime; 20261127121046_academy_scorm_strict_publication_validation; 20261127121232_academy_scorm_verified_progress. Não houve publicação real de treinamento nesta entrega. O teste SQL transacional scorm-publication-transaction.sql publica, matricula, avalia e revoga dentro de uma transação com rollback integral. Conferência posterior: zero snapshots e zero históricos SCORM de teste; os dois catálogos permanecem com o mesmo curso anterior.

Testes: publicação visível nos catálogos ADM/aluno; preservação dos cursos existentes; negação sem matrícula/revogação; gabarito removido; sequência; nota e duas tentativas, idempotência do envio; proteção do progresso contra autodeclaração; versões imutáveis; negação de publicação a funcionário. QA DOM do criador estendido para confirmação da revisão, botão Publicar e link de matrículas; teste da sala interativa confirma isolamento de conclusão manual e restauração da sala Mux. QA autenticado real em navegador segue dependente da conta do proprietário; não confundir os testes SQL/DOM com esse QA.

Esta seção substitui os limites anteriores de publicação e player pendentes. Continua pendente ativar a API de pesquisa/geração real (sem chave disponível) e extração de documentos PDF/Word/PPT. A exportação ZIP é separada da publicação nativa deste conteúdo.


## Criação no mesmo menu da Academia — 27/11/2026

Ajuste na mesma branch feature/academia-scorm-connected-20261127. Criar com IA mantém o menu e cabeçalho administrativos existentes e abre diretamente Tema e público em uma superfície de conteúdo incorporada. O criador deixa de apresentar seu menu lateral próprio. Edição de treinamento interativo publicado também abre nessa área. Retornar pelo menu conserva a edição da superfície enquanto a sessão permanece ativa. Links antigos do criador encaminham para o painel original após autenticação. URLs de rascunho preservam o modo incorporado.

Após publicar, o retorno ao menu solicita a atualização do catálogo existente; o link de matrículas abre o painel completo atualizado. Preservados os controles de sessão/papel e o aviso existente de edição pendente do ADM. Nenhuma alteração no backend, no banco ou na main neste ajuste.

Validação: build central; check de 65 scripts; sete contratos release; QA DOM ADM e funcionário; sete testes proxy/central; QA DOM do criador tanto pela entrada comum quanto pela entrada direta no wizard; QA da sala SCORM; novo teste de navegação (menu preservado, criação direta, edição, retenção de iframe, bloqueio por edição pendente, origem de mensagem e encerramento de sessão). QA visual com conta autenticada continua dependente da validação do proprietário na prévia.


## Cartão do curso interativo no aluno — 27/11/2026

O cartão publicado usa capa confinada à arte, texto e ação em área legível. O botão Abrir treinamento e um clique no cartão usam a sala autenticada existente; matrícula continua obrigatória no serviço. A imagem enviada mostrou sobreposição da capa e ausência de ação visível; corrigidos estilos e marcação HTML sem mudar cursos Mux ou permissões. Validação local: check, build, sete contratos e QA ADM/funcionário, QA sala SCORM e navegação de autoria. Conferência visual com conta real e matrícula fica para a prévia do proprietário.

## Sala imersiva do treinamento interativo — 27/11/2026

Ao entrar em curso SCORM, a Academia esconde menus, painel, cabeçalho e painel lateral de aula. A sala autenticada ocupa toda a largura e a altura útil da tela; um cabeçalho próprio mostra Tela cheia e Sair do curso. A ação Sair restaura o painel do aluno e encerra a sala carregada. A experiência de aulas Mux permanece como antes. O conteúdo SCORM aumenta até 1280px e a rolagem principal fica no treinamento; o modo tela cheia é opcional pelo botão. Validação: build, check de 66 scripts, sete contratos e QA ADM/funcionário, QA de sala SCORM e teste dedicado de entrada/saída e vídeo convencional. QA visual autenticado pendente na prévia.
