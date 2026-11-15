## Ciclo ADM — prévia isolada de 14/11/2026

Escopo atual solicitado: desenvolver somente a administração, fora da main e sem produção. Branch local `feature/adm-cursos-preview`; base preservada em `snapshot-producao`. Não há remoto GitHub da Academia confirmado. Não confundir com relatoriopro. O projeto Vercel existente e o alias de preview serão reutilizados.

Esta versão é um sandbox de fluxo: `cloud-config.js` contém apenas `{preview:true}`. A inicialização do cliente Supabase é interrompida antes de qualquer sessão ou chamada remota. Catálogo, alunos fictícios, liberações e progresso ficam no navegador, em namespace `contrem-adm-preview-*`. Os logins criados aqui funcionam somente na mesma origem/navegador. Não são contas Auth reais; o botão ADM é entrada demonstrativa, sem autenticação de produção. Não promover esta build diretamente para produção.

Implementado: construtor em informações/aulas/revisão; formato aula única ou série; salvar rascunho com vídeo pendente; validação para publicar; ordenar/editar/remover aulas; duplicar curso; busca e filtro por situação; visualização da sala; cadastro de aluno fictício, acesso por curso, ativação/desativação e login de teste. A publicação na prévia libera apenas cursos com status published e matrícula atribuída. Senhas de teste são derivadas com PBKDF2, nunca gravadas como texto puro. O sandbox é demonstrativo e editável pelo próprio navegador, não um limite de segurança.

Sequência para validar: Abrir painel ADM de teste → criar curso → escolher formato → salvar informações → adicionar aula(s) → revisão → publicar na prévia → Alunos → criar login fictício → marcar curso → sair → entrar com o aluno nesta mesma prévia. Use apenas dados fictícios.

Integração final pendente: conectar o construtor ao Auth/RLS real em ambiente de homologação isolado; validar novas regras de status e formato no servidor, filtragem segura do catálogo e revisão do contrato JSON; concluir mídias signed/Mux privadas e upload; executar QA autenticado com o proprietário; somente publicar quando solicitado. Não substituir as políticas e a função de alunos de produção pelo serviço local da prévia.

---

## Estado final — produção Mux, 14/11/2026

Produção publicada e validada: https://contrem-academia.vercel.app/ · dpl_EwJzQCYv4MyFr7dnZvktUFFE7pqS · READY · production. Apresentação no Mux, YouTube removido da reprodução e do botão externo. Aulas antigas ficam pendentes de migração, preservando dados/progresso. QA e próximos passos: docs/QA_MUX_PRODUCAO_2026-11-14.md. Este registro prevalece sobre o histórico abaixo. Documentação finalizada após a publicação; código executável idêntico ao deploy.

---

## Publicação autorizada — Mux e remoção do YouTube, 14/11/2026

O usuário autorizou colocar em produção removendo YouTube. A apresentação permanece no Mux. Reprodução e botão externo do YouTube foram retirados das aulas; URLs antigas só são reconhecidas para compatibilidade de importação e ficam pendentes de migração, preservando dados e progresso. O curso demonstrativo não recebe vídeos falsos de conteúdo técnico. Novas referências de mídia usam Playback ID do Mux; vídeos privados continuam dependentes da configuração do backend e das chaves de assinatura. Não declarar cursos privados já integrados.

Cache v9 e atualização silenciosa preservados. Prévia revisada deve ser validada e a mesma fonte publicada em produção neste ciclo. Registrar IDs finais e QA no pacote.

---

## Registro final da prévia Mux — 14/11/2026

Preview publicada e testada: https://contrem-academia-preview.vercel.app/ · dpl_86QXUxHLgSSDqdCEduogETa3WfiJ · READY · target null. Reprodução real, pular, reabrir e reentrar na demonstração passaram no Chrome cloud. Produção dpl_4GvQkqd5quN3yVRa4Miv4Cpaz4PL preservada.

QA detalhado em docs/QA_MUX_INSTITUCIONAL_2026-11-14.md. Documentação do pacote foi finalizada após o deploy; o código executável de HTML/JS/CSS/SW é o publicado. Não afirmar QA mobile nem reprodução completa.

---

## Apresentação Mux — prévia de 14/11/2026

A apresentação institucional usa o Playback ID público hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500, fornecido pelo usuário. Player e miniatura Mux substituem o YouTube somente no institucional. A apresentação abre em cada entrada na demonstração e continua disponível no painel. Pular/fechar/interromper continuam iguais. Autoplay com som está sujeito às regras do navegador.

Fonte base integral: produção dpl_4GvQkqd5quN3yVRa4Miv4Cpaz4PL; 37/37 arquivos verificados por SHA-1. README recuperado do prefixo do pacote publicado, confirmado por SHA-1 exato e7e9829b6f2312041a7a1a977c1ca8e6f0b42d02; outros 36 vieram do domínio de produção. Snapshot preservado.

O institucional é público por decisão do usuário e dispensa chaves de API no navegador. A integração de aulas privadas assinadas está preparada separadamente, ainda depende de credenciais Mux e integração do backend. Não declarar que as aulas foram migradas. Não incluir segredos no frontend.

Cache do PWA versionado sem reintroduzir aviso de atualização. Nenhum vídeo externo é armazenado no service worker. Publicação desta mudança somente em preview para validação; produção segue no deployment base.

Resultados reais do ciclo e URL da preview serão registrados em QA_MUX_INSTITUCIONAL_2026-11-14.md.

---

## Entrega da integração — 12/11/2026

Banco real: migration 20261112223552_contrem_academy_initial aplicada. Preview conectada: https://contrem-academia-preview.vercel.app/ · dpl_HwDFRTBFZgnArGXQEBWeZLLoRyHy · READY · target null. HTML, scripts de integração, SDK e SW retornaram HTTP 200 em fetch autenticado; SW release b00c7a770516. A preview pode pedir login Vercel antes do login da Academia.

Produção mantida: https://contrem-academia.vercel.app/ · dpl_GejvmXNYnW3D5dJh11oxgP2ZrYRs (PWA local anterior). Nenhuma promoção da nova entrada por conta foi feita antes da validação do usuário. Próximo passo: administrador entrar na preview usando sua conta Supabase existente e conferir carregamento/salvamento reais, então promover a integração quando solicitado. Não solicitar senha em mensagens.

O registro final do pacote foi fechado depois do deployment; documentação pode ser mais recente que a servida. Código executável corresponde à preview publicada.

# ESTADO_VERIFICADO — fonte auditável (12/11/2026)
## Continuidade desta rodada
Último deployment READY encontrado: `dpl_36zUcqmcFZK7FmAjZHoBkL1nchVG`, preview `target: null`, URL `https://va-academia-my3cmr19k-vinicius-alves-projects-fdea38e8.vercel.app/`. Sua árvore contém 11 arquivos em `src/`; todos foram recuperados com SHA-1 idêntico ao ID publicado, incluindo HTML de 36.973 bytes. O código revisto desta rodada parte desse snapshot. Consulte `QA_RESULTADOS_2026-11-12.md` para observações reais e casos não testados. O deployment de validação desta revisão deve ser anotado na entrega final após a Vercel confirmar READY.

Vercel project va-academia / prj_LYGfson8SNvVehn8ClMlpAT5YUwt / team_rdELIBR2FcBtC4aUChhufYOw.
Deployment base preservado: dpl_H78YH4873bnawpiPnyutYRmeySfv, READY, target null.
Preview base: https://va-academia-jnscxss8m-vinicius-alves-projects-fdea38e8.vercel.app/
Arquivos base: src/index.html; src/README.md; src/docs/PLANO_DESENVOLVIMENTO.md.
Fetch autenticado confirmou HTML servido (HTTP 200; 36.727 caracteres) e plano Markdown HTTP 200.
HTML single-page CSS/JS embutidos; index base foi reutilizado sem alterar seu conteúdo na preview de handoff.
Chaves localStorage: va-academia-catalog-v1, va-academia-progress-v1, va-academia-certificates-v1, va-academia-profile-v1, va-academia-activity-v1.
Backup v4: app/schemaVersion/exportedAt/courses/progress/certificates/profile/activity; validator aceita versões 1–4.
Curso demo: Introdução à mecânica de escavadeiras; 3 aulas apontam para https://www.youtube.com/watch?v=nBE8JrByOf0, player ainda a testar.
Não há banco remoto nem auth real. Login, admin, certificados são demonstrativos.
Atenção: há novas previews criadas posteriormente a esta base; sempre selecionar a última READY, sem presumir que o código mudou.

Menu por perfil: código e testes locais de sintaxe/cloud/PWA validados em 12/11/2026. Deploy deste ciclo somente preview; autenticação real ainda precisa de teste manual com a conta ADM.


Acessos por curso (prévia 13/11/2026): consulte `docs/ACESSOS_ACADEMIA_2026-11-13.md`. ADM libera cada curso a aluno ativo; alunos veem somente cursos liberados pelo banco. Produção permanece na versão anterior.


Atualização 13/11/2026: painel visível de backup JSON removido da prévia a pedido do usuário. A persistência normal é Supabase; funções legadas de recuperação permanecem no código por compatibilidade, sem exibição no ADM. O botão de cópia pendente só aparece se houver edição não sincronizada/conflito. Produção não alterada. Prévia `dpl_BDfiJAWAcaQ87PZ4MdGjSZ5V7Bbh`.
