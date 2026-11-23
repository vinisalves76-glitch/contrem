# CONTREM Academia — Cursos Avulsos + Academias — Implementação de homologação
Data: 22/11/2026 · branch exclusiva: `feature/academia-trilha-formacao-mecanicos`.

## Decisões consolidadas (proprietário)

- CONTREM Academia = plataforma de ensino; Cursos Avulsos e Academias são ofertas diferentes.
- Cursos Avulsos mantêm o editor atual (aula única ou série), Mux, fotos, materiais e avaliações.
- Uma Academia é composta de etapas e módulos ordenados, cada módulo com aulas e prova.
- Módulo da Academia é **exclusivo**, não vendido como avulso nem compartilhado com outra formação.
- Acesso manual liberado **somente pelo ADM Master**; pagamento online ficará para outro ciclo.
- Matrícula na Academia é integral, mas progressão é sequencial por conclusão de aulas **e aprovação na prova**.
- Após reprovação, próxima tentativa exige solicitação do aluno e autorização do ADM Master, a cada nova tentativa.
- O ADM escolhe emissão de certificado por curso avulso e Academia; módulo interno não emite certificado próprio.
- O ADM escolhe acesso à Academia sem prazo ou com validade por matrícula.
- O sistema deve admitir diversas Academias, não apenas Formação de Mecânicos.
- ADM de Conteúdo cria/edita, não publica/exclui/cria login/concede matrícula; **integração do perfil em andamento em outra frente**, não simulada como conta Master aqui.

## O que foi desenvolvido nessa branch

### ADM

- Nova aba `Academias` ao lado de `Treinamentos/Cursos Avulsos` e `Alunos`.
- Criar quantas Academias forem necessárias, com nome, descrição, público, objetivos, preço de referência e habilitação de certificado.
- Adicionar e renomear etapas; reordenar etapas e módulos; mover módulo entre etapas.
- Criar módulos exclusivos e usar o **editor existente** para nome, foto, carga horária, aulas, materiais anexados, links Mux e provas. Sem duplicar formulários de autoria.
- Formação inicial preparada sob demanda com 3 etapas, 12 módulos e 78 aulas planejadas, em rascunho; importação não sobrescreve edições já feitas na preview.
- Formação de demonstração de 2 módulos fictícios com vídeo Mux público de teste para exercitar matrícula/progresso; não constitui conteúdo técnico validado.
- Publicar Academia apenas quando todos seus módulos estiverem publicados, com aulas Mux e provas.
- Proteção de edição/arquivamento de formação com matrícula ativa até existir versionamento formal.

### Matrículas

- Novo quadro na aba `Alunos` para matricular em Academia publicada.
- Matrícula única por aluno e Academia, renovável e sem duplicação, com origem manual/venda externa/cortesia/convênio.
- Validade sem prazo ou com data, suspensão e reativação.
- Cursos avulsos continuam no quadro de liberação original, sem listar os módulos internos.
- Histórico das solicitações de reavaliação e botões para o Master autorizar/recusar.

### Aluno

- `Meus Cursos` continua mostrando apenas cursos avulsos.
- `Minhas Academias` possui cartões de formações matriculadas, mapa completo de etapas, status e progresso.
- Conteúdo de módulo bloqueado não é fornecido no catálogo da conta de teste; primeiro módulo liberado após matrícula, seguinte após todas as aulas e prova aprovada.
- Reprovação bloqueia retentativa, gera solicitação ao Master e permite iniciar uma nova tentativa aprovada uma única vez.
- Certificado de formação demonstrativo ao completar todos os módulos quando habilitado no ADM.
- Certificados de módulos internos desativados; curso avulso passa a ter configuração de habilitação no editor.

### Arquitetura de demonstração

- Política pura: `apps/academia/src/assets/academy-program-core.js`.
- Persistência local isolada: `academy-program-store.js` em `contrem-academia-programs-preview-v1`, lendo matrículas avulsas e progresso do sandbox existente `contrem-adm-preview-db-v1`.
- Interface ADM e aluno: `academy-program-ui.js`, `academy-program-ui.css`.
- Adaptações pontuais: `admin-manager.js`, `admin-preview-service.js`, `cloud-ui.js`, `assessment-student.js`, `index.html`.
- Matriz pedagógica prévia: `trilha-formacao/catalog.js`. A tela anterior `/academia/trilha-formacao/` é visual e ilustrativa; **o fluxo integrado real de teste é `/academia/`**.

## Fluxo de teste recomendado

1. Abrir `/academia/?academias=1` na URL Preview da branch; `Abrir painel ADM de teste`.
2. Aba `Academias`: preparar formação de 12 módulos (rascunho) e editar módulo com o construtor existente.
3. Para validar matrículas/progressão sem produzir vídeos, criar `TESTE · Academia de Progressão`, com 2 módulos publicados fictícios.
4. Aba `Alunos`: entrar ou criar aluno de teste, conceder matrícula na Academia de teste, sem prazo ou com validade.
5. Sair, entrar como `Aluno de teste`; abrir `Minhas Academias` e confirmar módulo 2 bloqueado.
6. Abrir módulo 1, concluir aula, responder prova; se reprovado, solicitar segunda tentativa.
7. Voltar ao Master, em `Alunos`, autorizar pedido. Reentrar como aluno; iniciar uma tentativa. Ao aprovar, confirmar módulo 2 desbloqueado; repetir para obter certificado demonstrativo.
8. Confirmar que o módulo interno não aparece em `Meus Cursos` nem nas matrículas individuais e que não gera certificado próprio.
9. Verificar prazo vencido, suspensão, reativação, e proteção de edição em formação matriculada.

## Validação

- Verificação estática de sintaxe de 10 arquivos JS/CJS + script inline original: **OK**.
- Contratos entre scripts, ordem de carregamento, separação de matrículas e exclusividade: **OK**.
- Teste em memória das políticas e persistência local (18 verificações): matrícula idempotente, bloqueio inicial de módulo 2, reprovação, pedido, aprovação Master, consumo da autorização, desbloqueio, certificado e suspensão: **OK**.
- Teste repetível no repositório: `apps/academia/tests/qa-academy-programs.cjs`.
- **Pendente:** navegador real/E2E, upload real, reprodução vídeo em todos os dispositivos, testes de concorrência entre abas, integração real do ADM de Conteúdo, Supabase Auth/RLS e pagamento.

## Regras de segurança e integração futura

**NÃO USAR O SANDBOX COMO BACKEND REAL:** todos os dados criados nessa preview estão no navegador e podem ser alterados pelo usuário; não garantem autorização, integridade ou certificados comerciais. A implementação produtiva exigirá RLS, função de servidor para matrícula e autorização Master, graduação de provas no backend, serviço de emissão de certificado verificável, escopo de acesso para vídeos Mux assinados, auditoria e migrador de catálogo.

Não alterar `main`, `develop` nem produção. `develop` avançou com alterações da frente de ADM de Conteúdo, Auth e outros módulos **durante este trabalho**. Antes de integração, executar merge/rebase controlado na feature, revisar conflitos dos arquivos compartilhados, preservar a implementação de staff mais recente e executar os novos testes. Não sobrescrever arquivos recentes do `develop` com esta versão de preview.

Não há configuração de gateway de pagamento ou migração Supabase aplicada neste ciclo.


## Correção de navegação — Portal da Academia liberada

**Relato:** aluno com matrícula de Academia liberada clicava no cartão da formação e permanecia em Minha aprendizagem, sem entrar no portal específico.

**Causa:** o evento `button.onclick` executava somente `renderStudentDetail()`, que atualizava uma seção situada abaixo dos cartões na mesma página. Não havia mudança de tela nem posicionamento para exibir o mapa.

**Correção na mesma feature:**
- `academy-program-ui.js`: cria `#academyPortalView` como `main` separado, com título, resumo e validade da matrícula; o cartão chama `openAcademyPortal(id)`, que valida a matrícula existente, desenha as etapas e os módulos e troca a tela atual pelo portal.
- O portal tem **Voltar às minhas Academias** e, ao sair de uma aula iniciada pelo portal, retorna ao portal, preservando a navegação no contexto da formação.
- `academy-program-ui.css`: estilos dedicados ao portal e layout responsivo.
- `apps/academia/tests/qa-academy-portal-navigation.cjs`: regressão do clique, seleção da Academia, mudança de tela, retorno e restrição de acesso.

**Verificação executada:** sintaxe JS válida; teste isolado do caminho do clique passou (renderização → troca para portal → rolagem ao início); tentativa de abrir ID inexistente não navega; presença das regras de retorno comprovada na fonte. **Não houve teste E2E em navegador real.**

**Importante:** o controle de matrícula e desbloqueio permanece restrito ao **sandbox local da Preview**. A correção não altera banco real, Supabase Auth/RLS, `develop`, `main` nem produção. Antes de integrar à base mais recente, reconciliar modificações concorrentes de outros trabalhos.


## Portal visual original integrado ao login do aluno — Preview v2

O usuário aprovou visualmente a antiga rota \`/academia/trilha-formacao/\` e definiu que esse painel, com a barra lateral azul-marinho, logo CONTREM, banner com escavadeira, etapas, indicadores, trilha e Laboratório Virtual, deve abrir **a partir da matrícula na conta do aluno**. Não deve haver uma segunda experiência genérica paralela. O botão **Voltar para meu perfil** entra no menu original.

Implementação desta versão:

- \`trilha-formacao/index.html\` e \`style.css\` **continuam sendo o layout original de referência**. Quando abertos com \`?integrated=1&request=...\`, carregam \`integrated.js\` e \`integrated.css\`; sem esse parâmetro preservam a demonstração isolada anterior.
- \`academy-program-ui.js\` cria um iframe **mesma origem** em tela cheia sobre a sessão da CONTREM Academia ao clicar em uma Academia do aluno. Usa somente \`store.studentPrograms()\` e acesso a módulos liberados para construir o resumo, identificando a próxima aula via progresso. A sala de aula utiliza o construtor/player existente, voltando depois ao painel visual original.
- O iframe espera uma mensagem com a identificação exclusiva da abertura, recebe os dados autorizados, renderiza e confirma a exibição antes de ficar visível. A troca de Academia recarrega o iframe para não mostrar conteúdo de outra matrícula. Todas as mensagens conferem origem, janela, token e identificador da Academia.
- \`integrated.js\` fornece o menu **Visão geral**, **Minha trilha**, **Laboratório virtual**, **Sobre o programa** e **Voltar para meu perfil**, com cartões de etapas dinâmicos, status/bloqueios reais do sandbox e botão **Continuar de onde parei**. O Laboratório Virtual mantém o espaço e o visual, com conteúdo em desenvolvimento.
- \`academy-program-store.js\` e o ADM \`academy-program-ui.js\` agora aceitam chamada superior, título principal, palavra em laranja, descrição, título das etapas, imagem de capa e frase/descrição de cada etapa. Upload de imagem JPG/PNG/WebP até **900 KB**, guardado apenas no navegador em homologação; na ausência de capa personalizada fica a imagem original. A Formação de Mecânicos nova recebe as chamadas de exemplo baseadas na prévia.
- Mantidas matrículas, validade, progressão sequencial, autorização da nova tentativa, certificados demonstrativos e separação de cursos avulsos.

Testes: \`apps/academia/tests/qa-academy-integrated-preview.cjs\` (novo) e \`qa-academy-portal-navigation.cjs\` (atualizado). Confirmar a navegação no navegador, especialmente troca entre duas Academias, abertura de módulo e botão voltar.

Limitações: **os dados de homologação estão em localStorage**; não há autenticação/autorização real pelo Supabase nesse novo portal, upload persistente de servidor, emissão de certificado comercial ou pagamentos. O backend precisará verificar matrículas e emitir links Mux de forma segura antes de liberar em produção. Não alterar \`develop\` ou \`main\` durante esta integração. O merge futuro com \`develop\` exige revisão, pois a frente de autenticação de ADM de Conteúdo avançou em paralelo.


## Correção do clique que voltava ao topo (Preview)

Relato: ao clicar na Academia liberada, a interface apenas rolava até o início da página geral do aluno, sem abrir o painel.

Causa provável identificada na navegação: a versão anterior deixava o iframe do painel `hidden` e esperava uma confirmação da página interna para exibi-lo. Enquanto isso, executava `show('studentView')` e `scrollTo({top:0})`. Se a confirmação não fosse recebida, a navegação permanecia silenciosamente na página geral.

Correções na branch isolada:
- A tela do portal é exibida **imediatamente** com abertura visual azul-marinho, carregamento do iframe não oculto e sobreposição controlada.
- Confirmada a renderização da Academia escolhida, a tela de carregamento desaparece; permanece a barra lateral, banner e trilha originais.
- Uma falha da renderização do iframe gera mensagem na tela, com **Tentar novamente** e **Voltar ao meu perfil**, em vez de apenas rolar a página.
- Controle por identificador de abertura impede confusão entre Academias e mensagens de navegações antigas; erros são informados da página filha para a pai.
- Os testes `qa-academy-integrated-preview.cjs` e `qa-academy-portal-navigation.cjs` foram atualizados; testaram estrutura, matrícula, separação de dados, abertura imediata, fluxo de retorno e JavaScript válido.

**Limite:** os testes executados são automatizados de código e simulados, não são testes visuais reais no navegador. A causa raiz de eventual ausência de resposta do iframe poderá ser identificada pela mensagem mostrada ao aluno. A correção é restrita à preview local; `main`, `develop` e produção permanecem intactos.


## Publicação por formação + Ativo/Inativo dos módulos — regra atualizada

**Decisão do usuário (substitui a regra anterior de publicação conjunta obrigatória):**
A Academia completa pode ser publicada **sem vídeos e sem provas cadastrados**. Uma formação de 12 módulos pode estar visível para seus alunos matriculados enquanto os conteúdos ainda são preparados. Publicar a formação NÃO libera automaticamente os módulos.

### ADM Master — liberação incremental

- Em **ADM → Academias → selecionar formação**, cada módulo tem uma chave **Ativo para alunos / Inativo**.
- Os módulos criados pela matriz Formação de Mecânicos começam **inativos**, preservando o conteúdo em preparação.
- O ADM pode publicar a estrutura geral da Academia em rascunho sem links Mux.
- Para ativar um módulo, o ADM deve preencher pelo menos o vídeo Mux válido da **primeira aula**. As demais aulas podem receber vídeos posteriormente; até lá, não podem ser concluídas nem acessadas fora de ordem.
- A chave Ativo ativa a publicação do módulo no catálogo da preview, limitada à matrícula e à aprovação dos módulos anteriores. Desativar preserva progresso e aprovações.
- É possível abrir o construtor anterior a partir do módulo para inserir links Mux, apostilas, atividades e prova, inclusive na Academia já publicada. Não alterar IDs, apagar aulas concluídas ou reordenar conteúdos com matrícula ativa sem versionamento e estratégia de migração; esses controles precisam ser implementados no backend real antes da produção.
- Matrículas, validade e nova tentativa em reprovação final continuam sob liberação exclusiva do ADM Master.

### Experiência do aluno

1. Academia publicada aparece no portal visual aprovado após o aluno acessar **Minhas Academias**.
2. Módulos inativos e futuros continuam **visíveis no mapa**, mas com acesso bloqueado.
3. Módulo ativo exige matrícula válida e aprovação dos anteriores. Se a primeira aula ainda não tiver vídeo Mux, não há acesso.
4. Na sala de aula, o botão manual **Marcar como concluída** não é aceito para módulos da Academia.
5. A aula é concluída pelo evento \`ended\` do Mux, depois da verificação de cobertura de reprodução em pelo menos **95%** dos segundos do vídeo. Adiantar até o fim, isoladamente, **não** marca como concluído. O acompanhamento é feito por \`player.js\` (Mux iframe).
6. Se a aula possui atividade configurada no editor, é necessário **aprovação nessa atividade** para liberar a próxima aula, além do vídeo concluído.
7. A próxima aula não abre enquanto a anterior não cumprir os dois requisitos. Aulas com vídeo ainda não publicado permanecem bloqueadas.
8. Se o módulo possui prova final, essa prova só pode ser iniciada depois de todas as aulas e atividades aprovadas. O próximo módulo só é liberado após aprovação nessa prova. Se o módulo não tem prova final configurada, cumprir todas as aulas e atividades aprova o módulo.
9. Reprovação na prova **final do módulo** segue exigindo nova tentativa autorizada pelo ADM Master, conforme definição anterior.
10. A conclusão de todos os módulos é pré-requisito do certificado final da Academia quando habilitado.

### Armazenamento de preview e limites

- \`academy-program-core.js\`: \`moduleActive\`, \`firstVideoReady\`, \`lessonCompleted\`, \`nextLessonIndex\`, \`buildMap\`, \`publishReady\`; agora separa publicação editorial de liberação pedagógica.
- \`academy-program-ui.js\`: publica a Academia sem conteúdos, mostra a chave por módulo, preserva os estados anteriores e não publica módulos automaticamente.
- \`academy-lesson-gate.js\`: eventos do iframe Mux \`timeupdate\`/\`seeked\`/\`ended\`, bloqueio de marcação manual e próxima aula; somente no ambiente da Academia, não nos Cursos Avulsos.
- \`assessment-student.js\`: registra o resultado da atividade por aula e continua a aplicar o pedido de nova tentativa na prova final.
- \`admin-preview-service.js\`: preserva as chaves locais \`video-watched:<courseId>\` e \`lesson-assessment:<courseId>:<lessonId>\` na sessão.
- \`trilha-formacao/integrated.js\`: indica no mapa módulos inativos e aguardando vídeo.

**ATENÇÃO:** esses registros são **sinais do navegador em homologação**, e não um sistema auditável ou resistente a fraude. A checagem não garante que a pessoa prestou atenção durante todo o vídeo, apenas que houve reprodução rastreada. Na versão com usuários reais, o backend deverá validar matrícula, impor bloqueios no servidor, controlar conteúdo por versão, usar autorização Mux/signed playback e armazenar histórico e eventos de progresso em banco seguro. Sem isso, um aluno técnico pode manipular localStorage/JavaScript. Não promover esta etapa para produção por esse motivo.

Os testes de regressão \`qa-academy-programs.cjs\`, \`qa-academy-publication.cjs\` e \`qa-academy-lesson-watch.cjs\` cobrem formação sem vídeos, módulos inativos, aulas, aprovação e tentativas. Tests são simulados; teste E2E em navegador real ainda necessário.

**Ambiente autorizado:** \`feature/academia-trilha-formacao-mecanicos\` e sua URL de Preview estável. \`main\`, \`develop\` e produção permanecem inalterados.


## Correção ADM Ativar/Desativar versus acesso do aluno — 23/11/2026

O ADM e o aluno mostravam situações diferentes: o domínio anterior misturava o controle manual Ativo/Inativo com a exigência de vídeo na primeira aula.

- O ADM Master dispõe de dois botões explícitos, Ativar e Desativar, em cada módulo da Academia, no lugar de checkbox. Apenas a opção corrente fica selecionada (cor e aria-pressed).
- Ativar define moduleEnabled=true e permite o acesso à página do módulo para alunos com matrícula válida e ordem de progressão cumprida, mesmo sem vídeo Mux cadastrado.
- Desativar define moduleEnabled=false e bloqueia o módulo para o aluno; não exclui o progresso anterior.
- O status do construtor (draft/published) é diferente da decisão do ADM (moduleEnabled). Salvar aula não desfaz uma ativação manual. Para módulos antigos sem moduleEnabled, o status published é tratado como ativo por compatibilidade.
- Módulos sem vídeo podem apresentar programa e descrição, mas a aula continua indisponível, sem player e sem contagem de progresso. A atividade da aula e o próximo módulo só liberam conforme as regras de vídeo e avaliações.
- O filtro do catálogo do aluno agora aceita módulos ativos que estejam no estado draft do construtor, desde que a matrícula da Academia e a progressão autorizem. O filtro exclui os desativados.
- O painel do aluno diferencia módulo ativo com vídeo pendente de um módulo efetivamente bloqueado pelo ADM.
- A operação aguarda a sincronização do catálogo da preview e exibe mensagem de erro se houver falha. O ADM pode voltar ao perfil do aluno e abrir a mesma Academia para verificar.

Os testes de regressão de domínio verificam ativação mesmo sem Mux, desativação, estado do rascunho e proteção de aulas, matrículas e módulos posteriores. A implantação está restrita à branch feature/academia-trilha-formacao-mecanicos.

Limites: este ambiente de demonstração usa localStorage e autorização somente em JavaScript. Não garante segurança contra adulteração dos dados pelo aluno. Na versão real, as permissões precisam ser aplicadas no backend com persistência segura, sem publicar dados de alunos reais durante os testes.
