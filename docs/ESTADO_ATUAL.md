# CONTREM — organização central, 15/11/2026

Atualização da frente ADM: fluxo de edições pendentes corrigido na feature/academia-adm, para integração em develop e preview pelo projeto central contrem. Testes do módulo e da distribuição central passaram; QA visual real segue pendente. Main e produção não foram alteradas por este ciclo. Detalhes e commit de implementação em `continuidade/academia-adm.md` e `../apps/academia/docs/QA_ADM_EDICAO_2026-11-15.md`. O código de produção da Academia continua separado do ADM local.

Em 15/11/2026: foto de capa anexada ao curso implementada e integrada em `develop` no commit `b42f5946db8b68b76e9d6f78341a0d8e3693cd35`; preview Vercel `dpl_EW1DHM8MuGofSE34XVfevcTM8kKX` READY. Build central, testes da Academia e check de sintaxe passaram. O fluxo continua no sandbox; `main` e produção seguem preservadas. Detalhes em `continuidade/academia-adm.md`.

Atualização concluída: fonte `index.html` restaurada e fluxo de capa, vídeo e material de apoio integrado em `develop` no commit `3c04b2d21a236d63905b8065e3024e9adf3d7c6d`. Preview Vercel `dpl_9mM8qKPohpmDLKbhRTifAqgsQnBu` READY no alias estável de homologação. Testes da Academia, build central e check passaram. Arquivos anexados de vídeo/material são locais à prévia; integração Mux remota ainda depende de conta/configuração segura. `main` e produção preservadas. Detalhes em `continuidade/academia-adm.md`.

GitHub confirmado: https://github.com/vinisalves76-glitch/contrem (criado pelo proprietário).
Vercel confirmada: projeto `contrem`, ID `prj_W6DhrOxmIe0QreKEV0WPSFLqHhco`, já vinculado a esse repositório.
Destino principal solicitado: https://contrem.vercel.app/.

Um código-fonte, um build central e caminhos independentes para institucional, Academia, ContremTec e guia. Consulte `VERCEL.md` e `FRENTES_DE_TRABALHO.md`.

`main`: base estável, Academia conectada e site. `develop`: ADM fictício/local, ContremTec demonstrativa e guia revisão 2. Módulos em desenvolvimento não são publicados como produto corporativo na base estável.

## Limites preservados

Academia estável mantém Mux, autenticação existente e dados no mesmo backend. Aulas privadas/upload ainda dependem do backend preparado. ADM novo usa apenas dados fictícios locais. ContremTec não conecta dados reais. Guia é demonstrativo, sem procedimentos técnicos validados.

Nenhum SQL, conta, permissão de banco ou dado real foi alterado na organização. Os endereços anteriores continuam preservados até transição validada.

O registro da publicação central e os commits remotos devem ser consultados em `CONTINUIDADE_CENTRAL.md`. Arquivos de configuração preparados não são, sozinhos, evidência de deploy.

Ciclo ADM em andamento: vídeo de aula por link/Playback ID Mux, botão Adicionar aula com orientação e anexos de apoio mantidos no sandbox local. Testes e build passaram; integração/deploy desta revisão em develop ainda pendentes. Nenhuma mudança em main ou produção. Detalhes em `continuidade/academia-adm.md`.
