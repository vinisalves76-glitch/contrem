# Academia — integração real, ciclo de 22/11/2026

Pedido: substituir o sandbox pela aplicação integrada ao banco, autenticação e Mux. Branch `feature/academia-integracao-producao`, base `develop` `7b41fb2929ab515f34b15fff85982579cc36e751`. Esta entrega inicia a integração; não constitui liberação do sistema completo em produção.

## Infraestrutura confirmada sem copiar dados pessoais

- Supabase existente: `relatoriopro`, ref `vwvesygsudhbaqmayhsz`, compartilhado com manutenção. Escopo limitado à Academia.
- Inventário por contagem: dois membros, um administrador ativo; um catálogo com zero cursos; zero vídeos e zero vínculos de streaming. Nenhum curso QA foi importado.
- Tabelas `academy_members`, `academy_catalog`, `academy_learning_state`, `academy_course_access`, `academy_videos` e `academy_stream_assets` possuem RLS. Não editar tabelas operacionais/profiles/125h.
- Vercel: projeto `contrem`, produção atual preservada. Nenhum segredo de servidor é emitido no build estático.
- Mux: proprietário confirmou acesso à conta. Credenciais/configuração privada e asset de teste ainda precisam ser configurados/validados; não presumir conexão a partir de Playback ID público.

## Primeiro incremento implementado

Modo `connected` usa Auth real e associação ativa da Academia; contas de outros módulos sem associação não entram. O navegador recebe configuração pública por build, sem acesso demonstrativo de fallback. Catálogo e progresso são vinculados à conta. A reprodução exige UUID de vídeo do banco e resposta Mux signed do servidor, com validade e origem verificadas. Troca de conta/aula/saída invalida respostas atrasadas.

Autoria local, anexos IndexedDB, provas corrigidas no navegador e certificados locais ficam indisponíveis no modo conectado. O progresso desta etapa é autodeclarado, sem alegação de certificação ou antifraude. O modo de QA isolado continua disponível para desenvolvimento; seus dados não são migrados automaticamente.

## Alterações remotas deste ciclo

- Migração `academy_connected_catalog_projection`: substitui a projeção do catálogo para o aluno por whitelist, exige matrícula e `published`, remove questões/gabaritos, URLs públicas e metadados locais, e obtém UUIDs de vídeos publicados pelo banco. Helper privado não é executável por anon/authenticated; a RPC preserva seus grants. Revisada pelo coordenador, teste SQL sintético primeiro em transação revertida e depois repetido após aplicação. Membros e quantidade de cursos preservados; anônimo sem EXECUTE.
- Migração `20261122165848_academy_connected_learning_merge`: adiciona `academy_save_learning` com identidade ativa, revisão otimista e merge somente dos cursos/aulas publicados autorizados. Preserva cursos ocultos, histórico de provas e a coluna de certificados. A proposta inicial teve erro de sintaxe no teste rollback (CASE); corrigido pelo coordenador e retestado antes de aplicar. Testes sintéticos e recusa de sessão anônima passaram após aplicação; nenhuma linha de aluno foi usada como fixture persistente. A migração do catálogo ficou registrada como `20261122165250_academy_connected_catalog_projection`.
- Edge `academy-students` versão 3: fonte recuperada da versão remota 2 e adicionadas somente origens centrais exatas à allowlist CORS. Mantém `getUser(token)`, e-mail administrativo, associação ativa e isolamento `academy_*`.
- Edge `academy-playback` versão 1: publica o handler existente com autorização por usuário/matrícula/RLS antes de leitura do vínculo privilegiado e assinatura Mux. Origem padrão `https://contrem.vercel.app`; `STREAM_ENABLED` não foi ativado. Segredos ficam no ambiente Supabase. `verify_jwt=false` usa a autenticação explícita do handler (o ramo de apresentação pública é separado).

As fontes e testes SQL estão em `apps/academia/database/integration/`; a fonte de gestão de alunos está em `apps/academia/server/students/index.ts`. Não reaplicar o SQL histórico de streaming como bootstrap.

## Build conectado

Usar o build central `npm run build`. Configuração obrigatória:

```text
ACADEMY_MODE=connected
SUPABASE_URL=https://vwvesygsudhbaqmayhsz.supabase.co
SUPABASE_PUBLISHABLE_KEY=<chave publishable pública do projeto>
ACADEMY_PLAYBACK_FUNCTION=academy-playback
```

O modo preview é rejeitado em `VERCEL_ENV=production`; chaves `service_role` / `sb_secret_` são rejeitadas como configuração pública. JWT anon legado só é aceito se pertencer ao projeto configurado. O build emite configuração em `dist/academia/assets/cloud-config.js` e preserva o namespace conectado legado, separado do preview. `build:academia` isolado continua sendo cópia de fontes de QA; não é o comando de publicação central.

## Mux — configuração segura pendente

Configurar no servidor Supabase, não no navegador/Git/chat: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_PRIVATE_KEY`, `MUX_PLAYBACK_RESTRICTION_ID`. O token de API deve permitir ler os assets; upload administrativo exigirá contrato/permissões próprios. A chave de assinatura é distinta do token de API.

`STREAM_ALLOWED_ORIGINS` contém origens HTTPS exatas. A restrição Mux deve ter `allow_no_referrer=false` e domínios exatamente correspondentes. Aulas precisam exclusivamente playback IDs `signed`, sem segundo ID público que permita contornar a matrícula. Só definir `STREAM_ENABLED=true` após configurar, vincular e validar um vídeo real em `academy_videos` + `academy_stream_assets`, com testes negativos de aluno sem matrícula/inativo.

As variáveis Mux não foram obtidas pelo agente. Sua ausência não é contornada com Playback ID público. O dono deve configurá-las diretamente em Edge Functions → Secrets no projeto existente. Se testar em preview conectada, acrescentar a origem exata autorizada tanto à allowlist do servidor quanto à restrição Mux antes de ativar.

## Próximas etapas obrigatórias

1. Configurar Mux e comprovar reprodução real de uma aula autorizada, recusando não matriculado/inativo.
2. Integrar autoria de cursos, publicação e vinculação/upload Mux com validação no servidor. Não enviar o catálogo fictício automaticamente.
3. Criar bucket/metadados de materiais/capas com permissões por curso; downloads privados e limpeza de arquivos obsoletos. O bucket de vídeo histórico não é biblioteca de materiais.
4. Implementar provas e certificados no servidor: gabaritos privados, versão da prova, tentativas por aluno, submissão atômica/idempotente, nota calculada no servidor e certificado verificável. Os campos de certificado/assessment em `academy_learning_state` são históricos demonstrativos, não fonte de verdade.
5. QA real de login ADM/aluno, revogação, múltiplos aparelhos, recuperação e atualização PWA; então concluir release de produção sem promover o sandbox.

## Limites de verificação

Testes de contrato/DOM usam mocks e não equivalem a login com conta real ou reprodução Mux. A rede do Codex atualmente permite package managers/GitHub, mas nega `vwvesygsudhbaqmayhsz.supabase.co`; o smoke HTTP direto parou em CONNECT 403 do proxy. Metadados e SQL foram verificados pelo conector Supabase. Para E2E, permitir o host do projeto e os hosts Mux necessários nas configurações de rede do ambiente; não contornar o proxy. Changelog/docs Supabase também tiveram bloqueio HTTP; documentação atual de Auth/Storage foi consultada via conector.

Verificações finais: `npm run check` (54 scripts), `npm test` (25 testes Node de configuração, 89 Node da Academia e suítes DOM/contratos existentes), `npm run build` / `npm run test:central` (4/4), build conectado com `VERCEL_ENV=production` / testes centrais (4/4), `git diff --check`: aprovados. Segurança e testes revisaram independentemente o delta conectado; não aprovaram produção completa. Os testes SQL de projeção/merge passaram antes e após as migrações, com rollback dos testes.

O advisor sinaliza [RPCs SECURITY DEFINER executáveis por autenticados](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). As RPCs da Academia são intencionais: têm `search_path` vazio, identidade ativa obrigatória, projeção/merge limitado, anônimo sem EXECUTE e helpers privados sem grants de cliente. Não tratar a auditoria como ausência de avisos; funções de manutenção preexistentes não foram alteradas.
