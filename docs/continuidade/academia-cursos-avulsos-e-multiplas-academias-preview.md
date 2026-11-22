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
