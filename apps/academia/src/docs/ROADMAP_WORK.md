## Ciclo ADM — prévia isolada de 14/11/2026

Escopo atual solicitado: desenvolver somente a administração, fora da main e sem produção. Branch local `feature/adm-cursos-preview`; base preservada em `snapshot-producao`. Não há remoto GitHub da Academia confirmado. Não confundir com relatoriopro. O projeto Vercel existente e o alias de preview serão reutilizados.

Esta versão é um sandbox de fluxo: `cloud-config.js` contém apenas `{preview:true}`. A inicialização do cliente Supabase é interrompida antes de qualquer sessão ou chamada remota. Catálogo, alunos fictícios, liberações e progresso ficam no navegador, em namespace `contrem-adm-preview-*`. Os logins criados aqui funcionam somente na mesma origem/navegador. Não são contas Auth reais; o botão ADM é entrada demonstrativa, sem autenticação de produção. Não promover esta build diretamente para produção.

Implementado: construtor em informações/aulas/revisão; formato aula única ou série; salvar rascunho com vídeo pendente; validação para publicar; ordenar/editar/remover aulas; duplicar curso; busca e filtro por situação; visualização da sala; cadastro de aluno fictício, acesso por curso, ativação/desativação e login de teste. A publicação na prévia libera apenas cursos com status published e matrícula atribuída. Senhas de teste são derivadas com PBKDF2, nunca gravadas como texto puro. O sandbox é demonstrativo e editável pelo próprio navegador, não um limite de segurança.

Sequência para validar: Abrir painel ADM de teste → criar curso → escolher formato → salvar informações → adicionar aula(s) → revisão → publicar na prévia → Alunos → criar login fictício → marcar curso → sair → entrar com o aluno nesta mesma prévia. Use apenas dados fictícios.

Integração final pendente: conectar o construtor ao Auth/RLS real em ambiente de homologação isolado; validar novas regras de status e formato no servidor, filtragem segura do catálogo e revisão do contrato JSON; concluir mídias signed/Mux privadas e upload; executar QA autenticado com o proprietário; somente publicar quando solicitado. Não substituir as políticas e a função de alunos de produção pelo serviço local da prévia.

---

## Entrega da integração — 12/11/2026

Banco real: migration 20261112223552_contrem_academy_initial aplicada. Preview conectada: https://contrem-academia-preview.vercel.app/ · dpl_HwDFRTBFZgnArGXQEBWeZLLoRyHy · READY · target null. HTML, scripts de integração, SDK e SW retornaram HTTP 200 em fetch autenticado; SW release b00c7a770516. A preview pode pedir login Vercel antes do login da Academia.

Produção mantida: https://contrem-academia.vercel.app/ · dpl_GejvmXNYnW3D5dJh11oxgP2ZrYRs (PWA local anterior). Nenhuma promoção da nova entrada por conta foi feita antes da validação do usuário. Próximo passo: administrador entrar na preview usando sua conta Supabase existente e conferir carregamento/salvamento reais, então promover a integração quando solicitado. Não solicitar senha em mensagens.

O registro final do pacote foi fechado depois do deployment; documentação pode ser mais recente que a servida. Código executável corresponde à preview publicada.

# ROADMAP_WORK — Etapas e sequência de evolução
Status base: MVP DEMONSTRATIVO com localStorage, sem banco, autenticação real ou pagamento.
[!] Itens do README = implementados declarados, NÃO testados. Corrigir após QA.
[P0] R0 Recuperar última fonte READY e snapshot.
[P0] R1 Testar área aluno, player real, botões e navegação desktop/mobile.
[P0] R2 Testar persistência, avaliações, certificados, admin e export/import backup v1–v4.
[P0] R3 Corrigir regressões reais + estado vazio + validação + responsividade.
[P1] R4 Atualizar documentação in-project, incluindo handoff e critérios de pronto.
[P0] R5 Gerar uma nova preview, confirmar READY e testar a URL entregue.
[FUTURO] R6 Cadastrar vídeos próprios, refinar catálogo/aluno.
[FUTURO COM DECISÃO] R7 Repositório exclusivo/versionamento do código.
[FUTURO COM AUTORIZAÇÃO] R8 Supabase exclusivo + auth + RLS + migração do localStorage.
[FUTURO] R9 Controle de matrículas, admin segura, certificados verificáveis.
[FUTURO] R10 Catálogo comercial, checkout, pagamento server-side, acesso pós-pagamento.
[FUTURO] R11 LGPD, políticas, suporte, segurança, testes completos e produção autorizada.

Não avançar R8 só porque Supabase foi recomendado: usuário decidiu manter memória local para validar MVP.
# Estado de execução em 12/11/2026
Fonte integral e snapshot: concluídos. QA desktop: realizado em parte, com resultados por caso em `QA_RESULTADOS_2026-11-12.md`. Correções e documentação: preparadas nesta revisão. Preview: pendente de verificação READY no momento da edição. Próximo bloco é concluir QA de importação/mobile e estabilizar vídeo técnico, antes de iniciar qualquer banco remoto.

## Ciclo 2
R0: base `dpl_CuK9vKMo6W5RhP7VkWZ2kBJdsYq6` e snapshot confirmados. R1/R2: testes de modelo para backup v1–v4 passaram; importação por JSON colado e fluxo de aluno precisam de QA de navegador na nova preview. R3: reorganização da sala, responsividade, edição de aulas e alternativa de importação implementadas. R4: docs atualizados. R5: uma preview deste conjunto, com smoke e ID na entrega. R6: conteúdo técnico próprio permanece futuro. R8 segue bloqueado até decisão explícita de banco.

Menu ADM/aluno separado na preview. Futuros: painel consolidado e matrícula por curso exigem consultas e políticas próprias; não apresentar como módulos prontos.


Acessos por curso (prévia 13/11/2026): consulte `docs/ACESSOS_ACADEMIA_2026-11-13.md`. ADM libera cada curso a aluno ativo; alunos veem somente cursos liberados pelo banco. Produção permanece na versão anterior.


Atualização 13/11/2026: painel visível de backup JSON removido da prévia a pedido do usuário. A persistência normal é Supabase; funções legadas de recuperação permanecem no código por compatibilidade, sem exibição no ADM. O botão de cópia pendente só aparece se houver edição não sincronizada/conflito. Produção não alterada. Prévia `dpl_BDfiJAWAcaQ87PZ4MdGjSZ5V7Bbh`.
