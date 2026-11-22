# CONTREM — organização central, 15/11/2026

GitHub confirmado: https://github.com/vinisalves76-glitch/contrem (criado pelo proprietário).
Vercel confirmada: projeto `contrem`, ID `prj_W6DhrOxmIe0QreKEV0WPSFLqHhco`, já vinculado a esse repositório.
Destino principal solicitado: https://contrem.vercel.app/.

Um código-fonte, um build central e caminhos independentes para institucional, Academia, ContremTec e guia. Consulte `VERCEL.md` e `FRENTES_DE_TRABALHO.md`.

`main`: base estável da Academia e do site, mais a ContremTec demonstrativa com guia revisão 2, cuja publicação foi solicitada pelo proprietário em 15/11/2026. `develop`: novo ADM fictício/local e evolução dos demais módulos. A ContremTec publicada mantém os limites de demonstração; não representa backend corporativo concluído.

## Limites preservados

Academia estável mantém Mux, autenticação existente e dados no mesmo backend. Aulas privadas/upload ainda dependem do backend preparado. ADM novo usa apenas dados fictícios locais. ContremTec não conecta dados reais. Guia é demonstrativo, sem procedimentos técnicos validados.

Nenhum SQL, conta, permissão de banco ou dado real foi alterado na organização. Os endereços anteriores continuam preservados até transição validada.

O registro da publicação central e os commits remotos devem ser consultados em `CONTINUIDADE_CENTRAL.md`. Arquivos de configuração preparados não são, sozinhos, evidência de deploy.

## Integração da Academia com o backend — release isolada, 22/11/2026

Na branch `feature/academia-backend-release-20261122` (PR #13 direcionado à `release/2026-11-22-academia-auth`), a Academia utiliza modo conectado ao Supabase real sem login de demonstração: Auth, associação ativa de membro, catálogo matriculado, progresso/perfil com revisão, gestão de alunos e solicitação autorizada de playback Mux. Os recursos sem validação segura (autoria de cursos, materiais, provas e certificados) permanecem bloqueados. Arquivos, limites e próximos passos em `docs/ACADEMIA_RELEASE_BACKEND_2026-11-22.md`.

CI da implementação: QA release 45051767066 aprovado (51 testes centrais, 5 da release). A preview web foi criada no deployment `dpl_1vxg3KSS8vQCMtbqb8aguHaJBicv`, READY; commits posteriores adicionam somente fontes de Edge Functions/QA/docs. A nova origem CORS foi preparada no GitHub, **não implantada** nas funções Supabase ativas. Mux privado depende de configurações/restrições e vídeo real cadastrado. Não houve merge em `main`, alteração de dados ou publicação em produção.
