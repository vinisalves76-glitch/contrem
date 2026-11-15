# QA — apresentação Mux, 14/11/2026

Preview: https://contrem-academia-preview.vercel.app/
Deployment dpl_86QXUxHLgSSDqdCEduogETa3WfiJ — READY, target null.
Produção confirmada em dpl_4GvQkqd5quN3yVRa4Miv4Cpaz4PL. Não houve promoção.

## PASSOU
- Fonte base integral: 37/37 arquivos com SHA-1 igual à árvore base. README recuperado de prefixo do pacote anterior e validado pelo hash exato.
- Fonte publicada da preview: os 37 arquivos têm os hashes esperados. Vercel listou prefixo src/src/ na árvore, conforme o comportamento de empacotamento prévio; aplicação é servida na raiz.
- HLS público Mux: HTTP 200 e manifesto #EXTM3U. Player HTTP 200; miniatura HTTP 200 image/jpeg.
- Login aparece antes da demonstração, sem modal antecipado.
- Abrir demonstração local cria automaticamente a janela institucional com iframe Mux.
- Reprodução real no Chrome cloud: tempo de mídia avançou até 0:14 na primeira entrada e 0:23 depois de sair e entrar novamente.
- Pular apresentação fecha a janela e permite acessar o painel.
- Assistir à apresentação no painel reabre o player: reprodução observada em 0:05.
- Ir para a Academia fecha a janela; sair retorna ao login; nova entrada na demo abre a apresentação novamente.
- Aviso #pwaUpdate não visível. Cache versionado; código SW restringe cache ao shell de mesma origem.

## NÃO TESTADO
- Vídeo integral de 6min08s, áudio auditivo ou qualidade em conexão lenta.
- iPhone/Safari físico, Android físico, mobile emulado e migração de instalação PWA antiga.
- Login real de aluno/ADM e reprodução assinada das aulas; nenhuma senha solicitada.
- Upload automatizado/admin Mux e conexão de API da conta.

Tentativa de Chrome local por Playwright não pôde iniciar devido à restrição de sockets do ambiente. QA real foi realizado no Chrome cloud, não contado como teste local de navegador.
A prévia tem proteção Vercel; autenticação de revisão foi temporária, sem desabilitar a proteção. Segredo do link temporário não está neste pacote.
Autoplay com som funcionou neste Chrome, mas depende do navegador e da interação do usuário em outros dispositivos.
