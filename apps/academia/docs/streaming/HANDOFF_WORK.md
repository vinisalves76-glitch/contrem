# Continuidade — decisão Mux Free
Pedido mais recente: continuar com Mux Free. Usuário ainda não tem conta Mux e recebeu link para criar Free sem cartão.
https://www.mux.com/pricing
Não pedir senha ou chave secreta por chat.

## Concluído
Banco atual inspecionado e estendido para Mux sem remover dados/provedores.
Adaptador de reprodução assina JWTs RS256 no servidor e separa apresentação pública de aula privada.
42 testes Node e 7 testes SQL passaram. SQL com ROLLBACK, sem usuários Auth de teste.
Advisors consultados: sem referência nova à tabela de vínculo; alertas anteriores do projeto não foram tratados neste ciclo.
Sem deploy de backend, sem alteração do site, sem envio de vídeo ao Mux e sem contratação paga.

## Dependência do usuário
Criar/entrar na conta Free do Mux. O usuário não tem conta confirmada nesta sessão. Não alegar conexão ativa.
Nenhum plugin Mux foi encontrado. Quando a conta estiver pronta, fazer conexão/configuração segura no servidor.

## Próximas ações
1. Conferir criação da conta Mux Free e manter sem cartão/upgrade. Usuário autorizou somente a modalidade gratuita.
2. Criar organização/ambiente da Academia, token de API restrito, chave de assinatura e restrição de domínios. Inserir segredos diretamente no servidor.
3. Enviar vídeo original de apresentação (409.381.946 bytes) diretamente ao Mux. Apresentação pode ser pública na demonstração.
4. Para aulas, criar asset exclusivamente signed, qualidade basic e resolução máxima 1080p; não criar playback ID público adicional. Usar direct uploads retomáveis conforme docs Mux, não TUS Cloudflare e não passar MP4 por banco/função Supabase.
5. Obter asset ID, playback ID e política quando pronto. Para aula, cadastrar academy_videos em draft e vincular por video_id em academy_stream_assets. Não publicar vídeo em processamento. Cadastro de apresentação é kind=presentation, video_id=NULL e política public permitida.
6. Recuperar/preservar fonte integral da última versão READY da Academia; ler AGENTS.md e docs atuais antes de editar. Este ZIP não é fonte completa.
7. Integrar ao painel ADM upload retomável e acompanhamento de processamento/limite 10 assets. Nenhum uploader está implementado neste pacote.
8. Implantar backend preparado como endpoint de teste. A apresentação exige fluxo público; aula sempre valida Bearer real, membro ativo e RLS por curso. Gateways precisam permitir fluxo público sem remover validação própria das aulas.
9. Integrar player no mesmo sistema. Endpoint aceita {kind:'course',videoId:'UUID'} ou {kind:'presentation'}; nunca aceita URL/ID de provedor do cliente. O servidor lê o vínculo.
10. Em resposta bem-sucedida, iframeUrl aponta ao player.mux.com; hlsUrl permite player próprio. Tokens não entram em SW/cache/localStorage/logs. Buscar novo acesso ao retornar à aula ou ao expirar; preservar progresso e estado de reprodução.
11. Testar em desktop e Safari/iOS: vídeo real, curso revogado, aluno inativo, link copiado, domínio incorreto, processamento, pausas longas e retomar posição. Token copiado pode funcionar até expirar; não prometer bloqueio absoluto.
12. Criar uma única preview no mesmo projeto/alias, sem preview genérica. Não substituir produção antes de pedido explícito.

## Documentação técnica
https://www.mux.com/docs/guides/upload-files-directly
https://www.mux.com/docs/guides/secure-video-playback
https://www.mux.com/docs/api-reference/video/assets/get-asset
https://www.mux.com/docs/api-reference/system/signing-keys/create-signing-key
https://www.mux.com/docs/guides/player-mux-com-reference
