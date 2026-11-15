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

# CONTREM Academia (anteriormente VA Academia)

## PWA e produção autorizada — 12/11/2026
O usuário autorizou produção neste ciclo. Endereço: https://contrem-academia.vercel.app/. O PWA inclui `manifest.webmanifest`, ícones PNG 192/512/maskable e Apple 180px, `sw.js`, controles de instalação e instruções por plataforma. O manifesto usa `display: standalone` para abrir em janela de aplicativo.

No iPhone/iPad, abrir no Safari e usar Compartilhar → Adicionar à Tela de Início → Abrir como App da Web, quando a opção existir → Adicionar. Em Chrome/Edge para Android/computador, usar o botão Instalar aplicativo; se o navegador não fornecer o prompt, o botão mostra as instruções de instalação pelo menu. A instalação depende do navegador/sistema; não foi gerado APK nem aplicativo de loja.

A interface é pré-carregada por service worker após o primeiro acesso com internet. Vídeos YouTube, abertura externa e o site institucional precisam de conexão. O armazenamento de cursos/progresso continua local. O PWA não sincroniza dispositivos nem implementa autenticação real. Ao mudar da preview para produção, exportar backup na origem anterior e importar na nova antes de cadastrar conteúdo definitivo. Isso também vale para um web app em sistema que isole seu armazenamento.

Atualizações do service worker têm cache versionado por hash do shell. Nunca publicar novo código sem recalcular esse hash. A nova versão é apresentada ao usuário; o recarregamento requer ação para evitar perder formulários em edição. Não remover chaves localStorage ao atualizar cache.

Testes: `node tests/qa-pwa.cjs`, além dos testes existentes. Evidências desta entrega em `docs/QA_PWA_PRODUCAO_2026-11-12.md`.

## Identidade visual — 12/11/2026
Marca CONTREM Academia aplicada sobre a aplicação existente, sem recriar seu modelo de dados. Novas telas de entrada, menu lateral no desktop, navegação compacta por CSS em telas menores, área do aluno, sala de aula, administração e identidade dos certificados. Estilos em `assets/contrem.css`, integração visual em `assets/contrem.js`, símbolo em `assets/logo.svg` e foto ilustrativa gerada em `assets/campo.webp`.

O escopo deste ciclo é visual. Não há autenticação ou banco remoto. O curso de exemplo mantém o vídeo público provisório; não é treinamento técnico próprio da CONTREM. O site institucional é https://contrem.vercel.app e não foi modificado neste ciclo. Chaves locais e o campo `app: 'VA Academia'` no JSON permanecem compatíveis; os arquivos exportados agora usam o nome `contrem-academia-backup-...json`.

Fonte integral do `index.html` comparada com a última preview READY: SHA-1 `be4a0a2fe0f40c8a0ad8ce551e5dce8b43e8facf`, 42.383 bytes. Os demais arquivos do pacote conferem com a árvore da preview, exceto o registro QA do ciclo 2, que já havia sido atualizado após aquele deployment. Snapshot preservado no pacote.

Consulte `docs/QA_IDENTIDADE_CONTREM_2026-11-12.md` para testes realmente executados e limites. Ao abrir outra origem/URL, dados antigos não são transferidos automaticamente: exportar e importar backup na Administração.
Plataforma comercial independente do IRMEN ONE. MVP estático de demonstração, com dados somente no `localStorage`. Não há autenticação, matrícula ou pagamento reais.

## Executar e testar
Na pasta `src`, execute `python3 -m http.server 8765` e abra `http://localhost:8765`. A página também abre como arquivo HTML, mas o servidor local facilita testes. Na raiz do pacote, execute `node tests/qa-model.cjs` e `node tests/qa-import.cjs` (Node 18 ou superior). Os testes funcionais usam uma instância isolada do navegador, pois cada origem mantém dados próprios.

Estrutura: `src/index.html` contém HTML, CSS e JS; `src/docs/` guarda plano, decisões, QA e handoff; `tests/` contém validação do modelo. O snapshot anterior está no pacote de continuidade, separado da pasta implantável.

## Funcionalidades
- Área do aluno, catálogo, busca e player YouTube.
- Progresso por aula, retomada e navegação anterior/próxima.
- Avaliações, tentativas, resultados e certificados demonstrativos.
- Administração local de cursos, aulas (incluindo edição da URL sem perder o ID/progresso) e avaliações.
- Perfil local do aluno; histórico de cursos e painel de desempenho.
- Backup JSON schema v4, incluindo perfil e atividade, com importação de schemas v1–v4 por arquivo ou JSON colado. A importação substitui os dados locais após confirmação e restaura o estado anterior se falhar ao gravar.

## Dados locais e backup
Chaves: `va-academia-catalog-v1` (cursos/aulas/questões), `va-academia-progress-v1` (aulas por ID de curso e tentativas em `assessment:<id>`), `va-academia-certificates-v1`, `va-academia-profile-v1` e `va-academia-activity-v1`. O JSON exportado contém `app`, `schemaVersion: 4`, `exportedAt`, `courses`, `progress`, `certificates`, `profile` e `activity`. As versões 1–3 podem omitir os três últimos objetos; a importação preenche valores vazios. Faça um backup antes de limpar o navegador. Não há sincronização entre aparelhos.

## Preview Vercel
O projeto existente é `va-academia` (`prj_LYGfson8SNvVehn8ClMlpAT5YUwt`). Ele foi implantado por arquivos, sem Git conectado confirmado. Na API de deployments usada neste projeto, inclua **todos** os arquivos com caminho `src/...` e `projectSettings.rootDirectory: "src"`, com `target` omitido (preview); aguarde `READY`, confira `target: null` e teste a URL. Não use `production`, promova ou aponte o domínio de produção. O acesso pode exigir SSO. Consulte `AGENTS.md`, `docs/HANDOFF_WORK.md` e `docs/QA_RESULTADOS_2026-11-12.md` antes de continuar.

## Limitações
Login/admin ainda demonstrativos, sem autenticação ou autorização real. Dados ficam no navegador e não sincronizam entre dispositivos. Certificados são demonstrativos, sem validação pública. Vídeos não listados podem ser compartilhados e a incorporação não impede gravação de tela.

## Próxima fase
Completar QA mobile e reprodução contínua, revisar o conteúdo demonstrativo (o vídeo público atual é infantil) e estabilizar a experiência do aluno. Repositório Git exclusivo e Supabase próprio são decisões futuras; nenhum banco foi conectado.


Atualização de menu 12/11/2026: ADM conectado vê Treinamentos e Alunos em áreas próprias; aluno vê aprendizagem, cursos, desempenho, perfil e certificados. Prévia: https://contrem-academia-preview.vercel.app/ (`dpl_FXAaPEnawfWBbtKoFZuJL6suJtjH`). Produção não alterada. Sintaxe, QA local e HTML remoto 200 passaram; sessão autenticada real não testada.


Acessos por curso (prévia 13/11/2026): consulte `docs/ACESSOS_ACADEMIA_2026-11-13.md`. ADM libera cada curso a aluno ativo; alunos veem somente cursos liberados pelo banco. Produção permanece na versão anterior.


Atualização 13/11/2026: painel visível de backup JSON removido da prévia a pedido do usuário. A persistência normal é Supabase; funções legadas de recuperação permanecem no código por compatibilidade, sem exibição no ADM. O botão de cópia pendente só aparece se houver edição não sincronizada/conflito. Produção não alterada. Prévia `dpl_BDfiJAWAcaQ87PZ4MdGjSZ5V7Bbh`.
