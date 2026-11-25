# RECUPERACAO — como o Work continua sem histórico do chat
1. Conectar Vercel e localizar projeto por name/id da seção ESTADO_VERIFICADO.
2. Consultar list_deployments e get_deployment para selecionar o READY mais recente, preview, sem produção.
3. Recuperar lista de arquivos e conteúdo completo com list_deployment_files / get_deployment_file_contents. Dados base64 podem ter resposta truncada. Verificar tamanho.
4. Rota verificada: web_fetch_vercel_url(URL preview) leu o index.html COMPLETO (36.727 caracteres), incluindo JS e CSS; docs/PLANO_DESENVOLVIMENTO.md é servido como markdown.
5. Salvar fonte local/snapshot antes da edição; usar index intacto da versão em análise e preservar toda documentação ao implantar.
6. Verificar e registrar hashes/tamanhos; comparar com HTML servido após deployment.
7. Executar QA_WORK, corrigir falhas reais, uma preview nova, e atualizar este handoff.
Se não conseguir fonte íntegro, NÃO reconstruir o app pela descrição, NEM publicar arquivo incompleto.
