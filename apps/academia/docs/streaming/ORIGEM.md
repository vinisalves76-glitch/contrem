# CONTREM Academia — Mux Free + Supabase
Atualização: 14/11/2026. O usuário escolheu Mux Free e informou que ainda não tem conta Mux.

## Estado real
- Mantido o Supabase existente vwvesygsudhbaqmayhsz.
- Migration 20261114212228_contrem_academy_mux_free aplicada após a base 20261114211459_contrem_academy_stream_assets.
- Mux é o padrão do vínculo de mídia. Compatibilidade com Cloudflare preservada, sem contratar serviço.
- IDs de asset e playback separados; aula Mux exige política signed no banco e no servidor.
- Backend Mux preparado, com verificação de sessão/curso e assinatura RS256 real testada.
- Apresentação permite playback público para a demonstração, conforme decisão explícita do usuário.
- 42 testes Node passaram, incluindo regressão Cloudflare e 20 testes novos Mux. 7 testes SQL de constraints/RLS passaram com ROLLBACK.
- Conta Mux, credenciais, upload, deploy do backend, integração frontend e reprodução real ainda pendentes.
- Zero vídeos/assets de teste persistidos. Nenhuma nova conta Auth criada.
- Aplicativo publicado continua usando o fluxo atual. Não há preview funcional do Mux ainda.

Este pacote é uma extensão de banco/backend; não contém o aplicativo inteiro.
Não usar o ZIP como substituição da fonte completa da Academia.
Não reaplicar os SQLs no banco atual: as migrations já estão registradas.

## Arquivos
schema_change.sql: base de streaming já aplicada.
mux_schema_change.sql: extensão Mux já aplicada.
server/playback.mjs: autorização da aplicação e seleção do provedor.
server/mux-provider.mjs: confirmação do asset/playback, domínio e assinatura.
server/index.ts: entrada Deno preparada, não implantada.
tests/: testes executáveis de backend e SQL transacional.
docs/: configuração e sequência de implantação.

## Gratuito selecionado
Mux Free: até 10 vídeos armazenados, 100.000 minutos de reprodução por mês, sem cartão.
A marca Mux aparece no player gratuito. Nenhuma ação para adicionar cartão/upgrade foi realizada.
O limite é por vídeo/asset, não por curso. Cada aula enviada separadamente conta.
A integração não chama endpoints de faturamento nem muda o plano; o usuário deve manter a conta em Free.
Não criar uploads reais antes da conexão da conta. Limites de uso efetivos devem ser conferidos nela.
https://www.mux.com/pricing
https://www.mux.com/blog/free-plan

## Testes
node --test tests/playback.test.mjs tests/mux-provider.test.mjs
Os testes de API usam mocks; as assinaturas RSA são verificadas criptograficamente com chaves efêmeras de teste.
Testes de permissão no banco real: tests/mux-rls.sql.

## Limites da proteção
Tokens podem ser reutilizados por quem os receber até o vencimento. Revogação bloqueia novas emissões, não revoga imediatamente tokens emitidos.
A validade Mux considera a duração do vídeo para evitar corte em aulas longas; não equivale a bloqueio absoluto de compartilhamento.
Restrição de domínio é uma camada adicional e não substitui RLS/autenticação. Nenhum mecanismo impede gravação de tela.
