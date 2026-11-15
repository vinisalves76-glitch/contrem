## Entrega ADM finalizada

Prévia READY em https://contrem-academia-preview.vercel.app/ — dpl_DDoapnGQ8enodhJP11m8jqARUmmJ. Ler CONTINUIDADE_ADM.md na raiz do pacote e docs/QA_ADM_PREVIEW_2026-11-14.md para escopo, testes e limitações. A documentação foi finalizada após o deploy; o código executável é idêntico ao publicado na prévia. Produção preservada.

---

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

## Estado atual: integração Supabase

O usuário autorizou usar o mesmo projeto Supabase do Relatório Pro. O aplicativo agora oferece entrada por conta e demonstração local separada. O login/admin do modo de conta têm Auth/RLS reais; avaliações/certificados continuam demonstrativos. Nenhum dado local é enviado automaticamente. Leia `docs/INTEGRACAO_SUPABASE_2026-11-12.md` para estrutura, limitações, testes e migração do catálogo. As descrições abaixo sobre ausência de backend são histórico anterior e não descrevem o modo de conta.

## Publicação atual do instalador

Produção https://contrem-academia.vercel.app/ · dpl_GejvmXNYnW3D5dJh11oxgP2ZrYRs · READY · 12/11/2026. Instalação diferenciada Android/iOS. Documento de QA finalizado após publicação no pacote.

## Instalação por plataforma — revisão de 12/11/2026

Pedido atual autoriza ajustar o botão na aplicação publicada. Android mostra uma oferta dispensável de instalação. O toque abre o prompt nativo quando `beforeinstallprompt` estiver disponível; a confirmação final é do navegador. Se indisponível, apresenta instruções Android e habilita o botão nativo quando o evento chegar. iPhone/iPad mostram somente o tutorial Safari / Adicionar à Tela de Início, sem instruções Android. App em standalone ou evento appinstalled ocultam os controles; a dispensa da oferta Android é respeitada na sessão. Teste de estados em `tests/qa-install.cjs` (simulação de plataforma, não aparelho real). Cache SW precisa ser versionado a cada edição do shell. Domínio de produção mantido.

## Produção atual — CONTREM Academia PWA

https://contrem-academia.vercel.app/ · `dpl_HEUcr1o2HBAx1EhQ1mQX87fdRENv` · READY · production. Publicação autorizada pelo usuário. Instalação depende do navegador/dispositivo. Registro detalhado em `docs/QA_PWA_PRODUCAO_2026-11-12.md`.

## Preview CONTREM entregue

https://contrem-academia-preview.vercel.app/ · `dpl_4RaaX8nwWFd2TdKm1PoQpE6LdjV1` · READY · target null (preview). Proteção Vercel ativa. Para transportar dados locais entre URLs, exportar backup no endereço anterior e importar no novo. QA detalhado em `docs/QA_IDENTIDADE_CONTREM_2026-11-12.md`. O registro final deste pacote é posterior ao deploy.

# HANDOFF OPERACIONAL COMPLETO — VA ACADEMIA → CHATGPT WORK
## Atualização da rodada de 12/11/2026
Fonte base recuperada integralmente do deployment de handoff `dpl_36zUcqmcFZK7FmAjZHoBkL1nchVG` (READY, target null). Todos os 11 arquivos conferidos por SHA-1 com a árvore da Vercel; `index.html` tem 36.973 bytes e SHA-1 `80f48b38384f863161842efb8aec180bec1badcc`. Snapshot anterior preservado no pacote, separado do código editado. Não há Git conectado confirmado.

QA real de Chrome desktop e resultados/limitações por caso estão em `docs/QA_RESULTADOS_2026-11-12.md`. Os fluxos de entrada, busca, aula, progresso, perfil, avaliação e certificados foram exercitados na base. Reprodução contínua de vídeo, importação pela UI e mobile ficaram pendentes. Correções pontuais estão no `index.html`; teste de modelo em `tests/qa-model.cjs` (fora da pasta `src`) passou. Não houve banco remoto nem alteração em produção.

Retomada: conferir o deployment mais recente READY; comparar seu `src/index.html` ao código deste pacote; ler QA e plano; completar testes pendentes antes de qualquer nova arquitetura. Não interpretar esta atualização como QA total concluído.

**Referência:** 12/11/2026 | **Origem:** Vercel va-academia | **Destino:** ChatGPT Work
**MISSÃO:** Continuar o projeto existente; não recomeçar. Recuperar fonte integral, testar, corrigir e apresentar uma única preview de validação. Não publicar produção sem autorização.

## 1. Contexto de produto
VA Academia substituiu a ideia IRMEN Academy e é negócio comercial independente, para vender cursos técnicos. Foco inicial em manutenção/mecânica, escavadeiras, hidráulica e equipamentos de mineração. Não se relaciona ao sistema IRMEN ONE/Relatório Pro, nem usa seus dados.
Objetivo final: catálogo comercial, compra/matrícula, aluno autenticado, player e materiais, progresso, provas e certificados (participação e aprovação), painel administrativo. Ordem de implementação mudou por decisão do usuário: começar pela EXPERIÊNCIA DO ALUNO / VÍDEOS, antes de checkout e banco.

## 2. Vídeos
YouTube hospedará conteúdos. Na demonstração usar vídeos PÚBLICOS; posteriormente vídeos próprios NÃO LISTADOS fornecidos pelo usuário. Player incorporado e botão Abrir no YouTube. Guardar só ID/URL e metadados. Vídeo não listado não é controle de acesso e player não bloqueia captura ou compartilhamento.

## 3. Arquitetura atual
Aplicação estática SPA index.html com CSS/JS inline, implantação direta Vercel API, sem GitHub conectado confirmado. Banco remoto e auth não existem. Dados em localStorage, sem sincronização entre dispositivos. Administração e login são demonstrativos. Certificados gerados no browser, sem validação pública. Loja/pagamento real não implementados.
Chaves locais: va-academia-catalog-v1; va-academia-progress-v1; va-academia-certificates-v1; va-academia-profile-v1; va-academia-activity-v1.
Backup exporta {app:'VA Academia',schemaVersion:4,exportedAt,courses,progress,certificates,profile,activity}. Importador anuncia compatibilidade v1-v4 e precisa ser testado.

## 4. Infraestrutura verificada antes deste handoff
Projeto Vercel: va-academia | Project ID prj_LYGfson8SNvVehn8ClMlpAT5YUwt | Team ID team_rdELIBR2FcBtC4aUChhufYOw.
Referência de código-fonte a preservar: deployment dpl_H78YH4873bnawpiPnyutYRmeySfv READY (preview, target null), URL https://va-academia-jnscxss8m-vinicius-alves-projects-fdea38e8.vercel.app/ .
Arquivos dessa referência: src/index.html, src/README.md, src/docs/PLANO_DESENVOLVIMENTO.md.
A Vercel confirmou HTTP 200 no index HTML (36.727 caracteres) e na página docs/PLANO_DESENVOLVIMENTO.md. Alguns arquivos grandes vieram truncados pelo leitor de arquivos da API; web_fetch_vercel_url trouxe HTML inteiro. Verificar integridade e snapshot antes de editar.
Depois de ler isto, conferir se existem deployments MAIS RECENTES que a referência; o deployment que contém este handoff pode ser mais recente. O trabalho começa pela versão READY mais recente, não por URL antiga.

## 5. O que já foi declarado como implementado
Dashboard Minha Academia, catálogo e busca, curso com lista de aulas, player YouTube e link externo, botão concluir aula, progresso/retomada, navegação anterior/próxima, administração local de cursos/aulas/avaliações, questões e tentativas, resultados, certificados demonstrativos participação/aprovação, perfil nome/e-mail opcional/empresa/função, histórico e desempenho, backup JSON schema v4 com importação v1-v4. 
ESTADO DE QUALIDADE: descrito por README/código e deployment READY, MAS sem QA de navegador concluído. Não marcar nenhuma dessas funções como PASSOU antes de testar.

## 6. Restrições obrigatórias
- NÃO publicar produção, NÃO misturar IRMEN ONE, NÃO usar Firebase ou criar Supabase nesta rodada.
- Preservar dados localStorage e compatibilidade de backup v1–v4. Não fazer migração sem plano.
- Não tratar demo/admin como auth real nem certificado como verificado. Não afirmar que o player bloqueia cópias.
- Trabalhar em blocos com autonomia, evitando previews em excesso; uma preview por ciclo quando possível.
- Persistir documentação dentro do código; entregar relatório de fonte, alterações, QA, preview e próximo passo.

## 7. Plano exato da próxima rodada (EXECUTAR NESTA ORDEM)
### BLOCO 0 — Fonte e snapshot
Verificar deployment READY mais recente do projeto; recuperar fonte COMPLETA index.html, README, plano e docs deste handoff; comparar tamanho e integridade; salvar snapshot preservado. Se o código integral não puder ser lido, parar antes de qualquer redeploy.
### BLOCO 1 — QA REAL desktop e mobile
Testar login demo; catálogo/busca; curso; reprodução do YouTube no iframe e no site; aula anterior/próxima; marcar aula; persistência pós-refresh; perfil/histórico/desempenho; admin cadastro/edição/exclusão; avaliação e tentativas; certificados e impressão; backup export/import v4 e fixtures v1-v3 em navegador isolado; erros de JSON e estados vazios. Anotar PASSOU/FALHOU/NÃO TESTADO.
### BLOCO 2 — Correções
Corrigir erros de fluxo efetivamente observados; proteger dados locais e compatibilidade de importação; tratar estado vazio e UI mobile. Refazer os testes afetados.
### BLOCO 3 — Documentação
Atualizar README, docs/PLANO_DESENVOLVIMENTO.md, docs/HANDOFF_WORK.md, docs/ROADMAP_WORK.md, AGENTS.md e registro. Explicar setup/deploy, chaves locais, limitações e atualizações.
### BLOCO 4 — Entrega da preview
Criar UM deployment PREVIEW Vercel com todas as correções/docs, verificar READY e smoke test da URL publicada. Entregar ID, URL, passos testados, resultado, bugs remanescentes e próxima tarefa concreta.

## 8. Evolução depois do ciclo atual
1. Estabilizar UX aluno/mobile e conteúdos reais do usuário.
2. Decidir origem versionada (por ex. GitHub exclusivo), sem conectar automaticamente.
3. Quando o usuário autorizar explicitamente: Supabase próprio para auth real/PostgreSQL/RLS, alunos, matrículas, cursos, progresso, migração do local.
4. Administração segura, avaliações/certificados verificáveis e histórico persistente.
5. Loja, precificação, pagamentos, liberação após confirmação e suporte.
6. LGPD, segurança, testes finais e somente então produção mediante aprovação.

## 9. Entregáveis obrigatórios da rodada Work
Versão base (ID/URL) | arquivos recuperados íntegros | implementações/correções | matriz QA real | ID/URL da preview READY | pendências e riscos | próximo bloco definido e documentação atualizada.

## 10. Aviso de segurança
O deployment possui proteção Vercel/SSO: use acesso autorizado, sem desabilitar proteção. Tokens de compartilhamento temporários não devem ser armazenados aqui.

## Continuidade do ciclo 2 (12/11/2026)
Última preview de referência antes da edição: `dpl_CuK9vKMo6W5RhP7VkWZ2kBJdsYq6`, READY, `target: null`. Fonte local conferida com SHA-1 Vercel do `index.html` (`bf175065d109985cc90513fc1cdf31b73f65e470`) e snapshot preservado. A implantação anterior listou `src/src/...` na árvore fonte, embora sirva `/` e `/docs/`; ao montar a implantação por API com `rootDirectory: "src"`, usar caminhos `src/...` no array de arquivos, como no ciclo anterior. A tentativa com caminhos relativos (sem o prefixo) falhou: a Vercel informou que a Root Directory `src` não existia (`dpl_6a8xXPxsgXFHTZD9g3XG4d4GfL91`, ERROR).

Nesta revisão, aula/vídeo aparecem antes de avaliação/certificação, layout mobile foi ajustado, aulas podem ser editadas sem trocar ID, e backups podem ser importados via JSON colado além do arquivo. Schema v4 e chaves locais não mudaram. `tests/qa-model.cjs` e `tests/qa-import.cjs` passaram. Resultados de navegador e ID da nova preview devem constar no pacote final da rodada. Não declarar mobile nem reprodução contínua testados sem evidência.
# Atualização CONTREM Academia — 12/11/2026

O nome público passa a CONTREM Academia. O pedido atual é a aplicação visual da marca; a lógica de cursos, aulas, progresso, avaliações e backups foi mantida. O rebranding está em `assets/contrem.css` e `assets/contrem.js`, com pequenos ajustes de estrutura e texto no HTML. `snapshot-base/` no pacote preserva o app recebido antes da edição.

Base selecionada: `dpl_3wxsxDXvPyKZMmwLmDRmjgGoim3D`, READY, target null. O SHA-1 do HTML do pacote é exatamente `be4a0a2fe0f40c8a0ad8ce551e5dce8b43e8facf`, igual à árvore fonte Vercel. A API de conteúdo retornou base64 truncado; a cópia integral do pacote foi validada contra esse SHA-1 antes de editar. Demais hashes conferem exceto o QA do ciclo 2, atualizado depois da implantação anterior.

Preservar o projeto Vercel existente `va-academia`, não confundir com o site institucional `contrem`. Somente PREVIEW. Chaves locais e `app: 'VA Academia'` do backup são intencionalmente legados. Nova URL não herda dados do localStorage anterior; usar exportação/importação. Nenhuma migração automática.

Testes/limites desta rodada em `QA_IDENTIDADE_CONTREM_2026-11-12.md`; status do deployment final anotado no pacote após a Vercel responder. Não converter a marca aprovada em alegação de autenticação ou certificação real.

# PWA e liberação em produção — 12/11/2026

Pedido mais recente autoriza EXPRESSAMENTE produção e instalação como aplicativo. Ele substitui a restrição de apenas preview para este ciclo. Produção desejada: https://contrem-academia.vercel.app/. Projeto existente `va-academia` preservado; site institucional `contrem` permanece separado.

Base: preview `dpl_4RaaX8nwWFd2TdKm1PoQpE6LdjV1`, HTML SHA-1 `39229f0e7aad8dd7c3a3e9af85952539dad0e746`. Snapshot `snapshot-pre-pwa/` no pacote. Novo manifesto/ícones, SW de cache somente do shell, ajuda de instalação iOS/Android/desktop e atualização mediante ação do usuário. Nenhuma chave local ou schema alterado. Não confundir cache offline do shell com vídeos offline, sincronização ou autenticação.

Atualizar o hash de `CACHE_NAME` quando qualquer arquivo em `SHELL` mudar. Uma release anterior serve seu shell coerente até aplicar a atualização. Documentos no pacote podem receber o ID de deployment depois da publicação; isso não exige redeploy apenas de documentação.


### Menu por perfil — 12/11/2026
O menu conectado do ADM agora possui Treinamentos e Alunos; o menu do aluno permanece distinto. Consulte `FLUXO_ADM_ALUNO_2026-11-12.md`. A seção Alunos reaproveita a tela ADM, mas não mostra formulário de treinamento ou backup. Produção ainda não atualizada.


Acessos por curso (prévia 13/11/2026): consulte `docs/ACESSOS_ACADEMIA_2026-11-13.md`. ADM libera cada curso a aluno ativo; alunos veem somente cursos liberados pelo banco. Produção permanece na versão anterior.


Atualização 13/11/2026: painel visível de backup JSON removido da prévia a pedido do usuário. A persistência normal é Supabase; funções legadas de recuperação permanecem no código por compatibilidade, sem exibição no ADM. O botão de cópia pendente só aparece se houver edição não sincronizada/conflito. Produção não alterada. Prévia `dpl_BDfiJAWAcaQ87PZ4MdGjSZ5V7Bbh`.
