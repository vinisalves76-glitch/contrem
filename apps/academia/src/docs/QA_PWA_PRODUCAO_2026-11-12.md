# QA — PWA e produção CONTREM Academia

Produção foi autorizada pelo usuário em 12/11/2026. Base visual preservada: dpl_4RaaX8nwWFd2TdKm1PoQpE6LdjV1, índice SHA-1 39229f0e7aad8dd7c3a3e9af85952539dad0e746. Snapshot anterior incluído no pacote.

| Caso | Status | Evidência |
|---|---|---|
| Sintaxe JS | PASSOU | node --check no app extraído, pwa.js e sw.js |
| Manifesto / ícones | PASSOU | display standalone, scope /, arquivos 192/512 e maskable; dimensões PNG conferidas |
| Modelos e backups | PASSOU | qa-model.cjs e qa-import.cjs, schemas v1–v4 mantidos |
| Cache offline / isolamento | PASSOU | qa-pwa.cjs: navegação e assets em cache com fetch falhando; exclui YouTube/API/POST, preserva caches de outros apps, falha segura no pré-cache inválido |
| Service worker real no Chrome de QA | PASSOU | interface exibiu atributo data-pwa-ready=true e mensagem Ambiente preparado para abrir sem conexão neste navegador |
| Ajuda de instalação | PASSOU | botão abriu diálogo acessível com instruções iPhone/iPad e Android/computador |
| Instalação efetiva em aparelho do usuário | NÃO TESTADO | Depende de ação no telefone/computador do usuário |
| Reprodução de vídeos offline | NÃO SE APLICA | Não há download/cache de vídeos YouTube |
| Produção / recursos HTTPS | PASSOU | Deployment dpl_HEUcr1o2HBAx1EhQ1mQX87fdRENv READY, target production; domínio final abriu sem login; HTML, manifesto, SW, JS e ícones responderam HTTP 200 sem autenticação |

Não há banco remoto, autenticação real ou sincronização entre dispositivos. Dados permanecem vinculados à origem; usar backup para transferir da preview. Cache é apenas da interface do app.

## Produção concluída

URL: https://contrem-academia.vercel.app/. Deployment: `dpl_HEUcr1o2HBAx1EhQ1mQX87fdRENv`, READY, target production. Manifesto servido como `application/manifest+json`, SW como `application/javascript`, todos com `max-age=0, must-revalidate`. O navegador remoto abriu a aplicação sem login Vercel, exibiu `data-pwa-ready=true` e o diálogo de instalação. O prompt nativo beforeinstallprompt não foi observado no Chrome gerenciado; foi exercitada a ajuda alternativa. Não afirmar instalação efetiva em telefone ou janela standalone real do usuário.

Registro encerrado após o deployment; a documentação deste pacote está mais atualizada que a cópia publicada. O código do PWA não foi alterado após os testes e a publicação. O site institucional contrem.vercel.app e o alias de preview permanecem separados.
