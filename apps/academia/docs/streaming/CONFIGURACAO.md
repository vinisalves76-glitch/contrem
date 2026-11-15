# Configuração — Mux Free
Não preencher este arquivo com segredos reais.
Configurar chaves diretamente como segredos no ambiente do servidor, nunca em chat, HTML, Git ou pacote.

SUPABASE_URL: URL do projeto atual.
SUPABASE_ANON_KEY: chave pública da integração atual.
SUPABASE_SERVICE_ROLE_KEY: somente servidor; consulta o vínculo após autorização.
STREAM_ENABLED: false até conectar e validar Mux; true depois da configuração.
STREAM_ALLOWED_ORIGINS: https://contrem-academia.vercel.app,https://contrem-academia-preview.vercel.app
MUX_TOKEN_ID e MUX_TOKEN_SECRET: API token restrito à organização/ambiente da Academia, com leitura de assets. Fluxo de upload futuro precisará permissões de escrita separadas ou revisadas.
MUX_SIGNING_KEY_ID e MUX_SIGNING_PRIVATE_KEY: chave de assinatura Mux. Chave privada aceita PEM PKCS1/PKCS8 ou esse PEM em base64.
MUX_PLAYBACK_RESTRICTION_ID: restrição de playback com referrer.allowed_domains exatamente ['contrem-academia.vercel.app','contrem-academia-preview.vercel.app'] e allow_no_referrer=false.

Chave de assinatura não é o token da API. O aluno nunca recebe nenhum desses segredos.
Os três JWTs de playback usam audiências v, t e s para vídeo, miniatura e storyboard, sem PII.
A validade é max(15 min, 2 vezes a duração do vídeo + 30 min), para contemplar aulas longas e velocidade reduzida. Pausas além desse período exigem buscar novo acesso.
O servidor verifica o asset no Mux antes de assinar. Curso falha se houver qualquer playback ID público no mesmo asset.
Para apresentação pública, playback_policy=public dispensa assinatura; o asset continua sujeito à confirmação de estado/ID no servidor.

A configuração Cloudflare anterior permanece suportada por compatibilidade, mas Mux é a escolha atual e nenhum serviço pago foi ativado.
