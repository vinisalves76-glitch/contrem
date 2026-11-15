## Organização CONTREM — 15/11/2026

O repositório único foi autorizado. Caminho: `apps/academia/`; branch: `feature/academia-adm`; integração de testes: `develop`. Ler as instruções da raiz. Referências abaixo a branch apenas local ou ausência de remoto descrevem o pacote de origem; o estado atual da conexão está em `../../docs/ESTADO_ATUAL.md`.

O código executável do ADM foi importado sem alterações. Preservar a produção na `main`. Os dados da preview são fictícios e locais; não migrá-los para contas reais automaticamente.

---
# Continuidade ADM da CONTREM Academia — 14/11/2026

Trabalhar somente em `feature/adm-cursos-preview`, fora da main. Não publicar produção. Não existe remoto GitHub da Academia confirmado: a branch é local, transportada no bundle Git deste pacote.

Preview fixa: https://contrem-academia-preview.vercel.app/
Deployment: dpl_DDoapnGQ8enodhJP11m8jqARUmmJ (READY, preview).
Base de produção preservada: dpl_EwJzQCYv4MyFr7dnZvktUFFE7pqS em https://contrem-academia.vercel.app/.

Comece pelo botão Abrir painel ADM de teste. Cadastre cursos e alunos fictícios. Curso de aula única aceita uma aula; série aceita várias e permite reordenar. Salve rascunho, adicione vídeos Mux públicos, revise e publique na prévia. Em Alunos, crie o login e marque os cursos. Saia e entre com esse aluno no mesmo navegador/origem.

Tudo é sandbox local. Não há acesso às contas nem gravações no Supabase de produção. Os dados não sincronizam entre navegadores/aparelhos. Não usar esta implementação local como autenticação de produção. Integração final requer validar Auth/RLS, contratos de curso/status e mídia privada no servidor.

Código editado: src/assets/admin-manager.js e .css; admin-preview-service.js; integração em cloud-ui.js, cloud-store.js, cloud-config.js e index.html. Testes: npm ci && npm test. Abrir localmente: python3 -m http.server 4173 --directory src (em um ambiente com acesso local ao navegador).

QA detalhado em src/docs/QA_ADM_PREVIEW_2026-11-14.md. Testes automáticos e DOM emulado passaram. QA visual real pendente por login Vercel. Não confundir READY com QA visual. Snapshots anteriores e backend privado preparado continuam preservados nas pastas originais.

Versionamento: CONTREM_ACADEMIA_ADM.bundle contém snapshot-producao e feature/adm-cursos-preview. Pode ser clonado com git clone CONTREM_ACADEMIA_ADM.bundle contrem-academia-adm. Não conectar ao repositório do sistema de manutenção por engano.
