# QA — botão de instalação Android / iOS

Base de produção preservada em snapshot-pre-install-ajuste: dpl_HEUcr1o2HBAx1EhQ1mQX87fdRENv. SHA-1 do HTML 18369430a8cb263fc1b7bcf52c2274203614ccb4 e pwa.js a83ccc115ae128aa2fa85db99cc27210e9b72151 conferem com a árvore da última publicação READY.

- PASSOU: node --check assets/pwa.js.
- PASSOU: qa-install.cjs simula Android, iPhone, iPad, desktop, standalone e appinstalled. Oferta não invoca prompt sem toque; toque usa o evento uma vez; tutorial iOS oculta Android; evento tardio habilita botão; dispensa respeitada.
- PASSOU: qa-pwa.cjs confirma cache offline do shell, isolamento, exclusão de vídeos/API e falha segura de instalação do SW.
- NÃO TESTADO: instalação real em Android/iOS do usuário. Prompt nativo depende de elegibilidade e ação do usuário; não há instalação silenciosa.
- PASSOU: Chrome desktop local recebeu o aviso de nova versão, aplicou o SW com confirmação e exibiu data-install-platform=desktop e instruções só de computador.
- PASSOU: produção dpl_GejvmXNYnW3D5dJh11oxgP2ZrYRs READY; pwa.js e sw.js HTTP 200 no mesmo domínio, release f54e05438343. Chrome recebeu o aviso de atualização, aplicou e exibiu o diálogo de desktop sem tutorial iOS. Instalação real em Android/iOS continua NÃO TESTADA.

Não há alteração no catálogo, progresso, chaves locais, formato de backup ou banco. Snapshot pré-alteração preservado. A publicação em produção faz parte da continuidade do pedido de instalação do usuário.
