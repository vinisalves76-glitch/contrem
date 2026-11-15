# QA — revisão Mux Free, 14/11/2026
PASSOU: 42 testes locais Node, sendo 22 regressões de autorização/Cloudflare e 20 novos testes de Mux.
As novas verificações incluem assinatura RS256 real com PEM PKCS1 e PKCS8, em texto e base64; validação criptográfica da assinatura; audiences v/t/s; validade superior à aula de 2 horas; bloqueio de asset/processamento; playback estranho; curso público ou com IDs mistos; domínios extras/wildcard; ausência de referrer; falta de credenciais/configuração; duração inválida; apresentação pública sem JWT; autorização do curso antes da leitura do vínculo/provedor.
PASSOU: 7 testes SQL em transação revertida: Mux como default, bloqueio de curso público, necessidade de playback ID, isolamento de leitura/escrita do aluno, acesso ADM e bloqueio de anônimo.
PASSOU: zero assets e zero vídeos temporários depois do ROLLBACK.
NÃO TESTADO: API real Mux, upload, deploy Deno, frontend, player real, iOS, renovação/retomada, volume e limites efetivos da conta.
O backend ainda não foi implantado e não há preview de streaming real nesta rodada.
