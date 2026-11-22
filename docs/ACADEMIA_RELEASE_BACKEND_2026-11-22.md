# Integração da Academia ao backend — release isolada (22/11/2026)

## Fonte / proteção contra retrocesso
- Base: `release/2026-11-22-academia-auth` @ `de6a578`, derivada de `main` @ `ec9408d`.
- Branch desta integração: `feature/academia-backend-release-20261122`.
- Não substituir a base pela `develop` nem trazer o ADM fictício. Não mesclar esta branch em `main` automaticamente.
- Domínio de produção `https://contrem.vercel.app` e outros módulos da CONTREM permanecem inalterados.

## Integração realmente existente
- Supabase compartilhado: `vwvesygsudhbaqmayhsz` (não criar outro projeto); clientes usam SOMENTE a chave publicável já existente.
- O modo público `connected` usa Auth Supabase, verifica membro ativo `academy_members`, catálogo restrito da RPC `academy_my_catalog`, sessão persistida no namespace legado e restauração via `getUser`.
- Gestão de alunos (administrador autorizado): Edge `academy-students`; criar conta, ativar/desativar e atualizar matrícula `academy_course_access`. Servidor valida o token, identidade e associação ativa.
- Progresso/perfil: RPC `academy_save_learning`, atualização com `revision`, autorização por usuário/matrícula e preservação do histórico de conteúdos ocultos. Autodeclarado, não equivalência a certificação.
- Player privado: `academy-playback` valida token Auth, matrícula/RLS e UUID `academy_videos` antes de consultar `academy_stream_assets` com privilégios de servidor. Só aceita URL de playback Mux assinada. Respostas atrasadas de outra aula ou sessão são ignoradas.
- Sem fallback de demonstração, sem catálogo local e sem importação automática de cursos de teste.
- Autoria do ADM, provas, notas e certificados continuam bloqueados no modo conectado até implementação segura de upload, banco, correção e validação no servidor.
- Atualização silenciosa PWA e vídeo institucional preservados.

## Estado confirmado do backend
- Edge Functions `academy-students` v4 e `academy-playback` v2, ambas ativas na data da inspeção.
- Migrações existentes `20261122165250_academy_connected_catalog_projection` e `20261122165848_academy_connected_learning_merge`; não reaplicadas neste ciclo.
- Tabelas da Academia com RLS: `academy_members`, `academy_catalog`, `academy_learning_state`, `academy_course_access`, `academy_videos`, `academy_stream_assets`.
- Catálogo não possui curso publicado real e não há vídeos em `academy_videos`; não preencher com conteúdo fictício.
- Mux privado não foi habilitado nem houve leitura/colagem de segredos. A conexão do player será testável apenas depois de configurar credenciais, playback restrito, IDs signed e vínculo vídeo-aula.

## Gates antes da publicação
- CI: `npm run check`, `npm test`, `VERCEL_ENV=production npm run build`, `npm run test:central`, `node --test tests/release.test.mjs` (incluindo `cloud-service.test.mjs`).
- Preview do commit exato e revisão do build-info. **READY não certifica login/streaming real**.
- Validar login com conta autorizada aluno/administrador, recusa de usuário sem associação, matrícula/remoção, restauração e logout.
- Testar vídeo assinado quando Mux estiver configurado e negar aluno não matriculado, sessão inválida, vídeo não publicado.
- Concluir backend de autoria, materiais e avaliações antes de liberar os recursos em produção.
- Verificar domínio exato da nova preview contra CORS das Edge Functions e restrição de domínio Mux. Nunca ampliar por `*`.
- Revalidar a `main`, preservar configuração de produção e submeter PR para revisão; não promover sem aprovação posterior.

## Limites
Os testes automatizados usam doubles e verificações de build e não provam acesso a uma conta real ou player privado em produção. Nenhuma conta, credencial, banco ou registro da ContremTec foi modificado por esta integração de código.
