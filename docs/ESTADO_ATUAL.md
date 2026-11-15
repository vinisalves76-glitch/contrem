# CONTREM — organização central, 15/11/2026

Atualização da frente ADM: fluxo de edições pendentes corrigido na feature/academia-adm, para integração em develop e preview pelo projeto central contrem. Testes do módulo e da distribuição central passaram; QA visual real segue pendente. Main e produção não foram alteradas por este ciclo. Detalhes e commit de implementação em `continuidade/academia-adm.md` e `../apps/academia/docs/QA_ADM_EDICAO_2026-11-15.md`. O código de produção da Academia continua separado do ADM local.

Em 15/11/2026 começou novo ajuste ADM na mesma feature: anexar foto do computador como capa de curso. Testes do módulo, build da Academia e check de sintaxe passaram localmente; integração em `develop` e atualização da preview ainda pendentes. `main` e produção seguem preservadas.

GitHub confirmado: https://github.com/vinisalves76-glitch/contrem (criado pelo proprietário).
Vercel confirmada: projeto `contrem`, ID `prj_W6DhrOxmIe0QreKEV0WPSFLqHhco`, já vinculado a esse repositório.
Destino principal solicitado: https://contrem.vercel.app/.

Um código-fonte, um build central e caminhos independentes para institucional, Academia, ContremTec e guia. Consulte `VERCEL.md` e `FRENTES_DE_TRABALHO.md`.

`main`: base estável, Academia conectada e site. `develop`: ADM fictício/local, ContremTec demonstrativa e guia revisão 2. Módulos em desenvolvimento não são publicados como produto corporativo na base estável.

## Limites preservados

Academia estável mantém Mux, autenticação existente e dados no mesmo backend. Aulas privadas/upload ainda dependem do backend preparado. ADM novo usa apenas dados fictícios locais. ContremTec não conecta dados reais. Guia é demonstrativo, sem procedimentos técnicos validados.

Nenhum SQL, conta, permissão de banco ou dado real foi alterado na organização. Os endereços anteriores continuam preservados até transição validada.

O registro da publicação central e os commits remotos devem ser consultados em `CONTINUIDADE_CENTRAL.md`. Arquivos de configuração preparados não são, sozinhos, evidência de deploy.
