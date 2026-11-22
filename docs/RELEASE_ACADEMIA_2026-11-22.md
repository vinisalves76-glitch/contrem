# CONTREM — candidata de lançamento da Academia (22/11/2026)

## Escopo proposto

Branch `release/2026-11-22-academia-auth`, criada diretamente da `main` `ec9408dc`.
Esta versão **não é a promoção integral da `develop`**: a `develop` possui ADM sandbox, avaliações locais e outras funções ainda sem integração de produção.
Portar esses recursos agora poderia substituir o Supabase real por `preview:true` e expor dados locais de teste.

- Autenticação real do Supabase e chave publicável preservadas da `main`. Nenhum token de serviço ou mudança no banco.
- Formulário, atalho e listeners `enter`/`displayName` da demonstração local removidos do login da Academia.
- Encerramento de sessão volta à página de login sem abrir catálogo local, sem alterar os dados salvos por conta.
- Importador legado oculto para substituir catálogo compartilhado explicitamente desabilitado.
- Apresentação institucional Mux permanece acessível pelo botão interno, sem depender do atalho demo.
- Cache do service worker da Academia renovado, mantendo atualização silenciosa.
- Build com `VERCEL_ENV=production` rejeita config de `preview:true`, ausência de configuração Supabase e reintrodução do formulário demo.
- Testes de regressão de autenticação, sessão, login, Mux, PWA e distribuição; workflow de PR para `main`.

## Não incluído / pendências

- **Não integrado:** ADM sandbox, anexos locais, avaliações dinâmicas e outros 28 commits exclusivos da `develop`; exigem API/RLS/autorização e QA próprios.
- **Não alterado:** ContremTec e guia já presentes na `main` (ambos ainda com caráter demonstrativo, sem backend corporativo).
- Não se executou SQL, migrations, Supabase admin nem alteração de permissões.
- GitHub CI e Vercel Preview validam build e regressões estáticas; login com usuário real, RLS e reprodução Mux com conta de aluno exigem E2E manual antes da publicação.
- Não realizar merge nem deploy em produção automaticamente a partir deste documento.

## Gate antes do merge

1. CI de PR: `npm run check`, `npm test`, `VERCEL_ENV=production npm run build`, `npm run test:central`, `node --test tests/release.test.mjs`.
2. Conferir Vercel Preview privada do commit exato.
3. Validar login, perfil admin e aluno, catálogo, aula/Mux, logout e reabertura do PWA com contas reais de homologação.
4. Comparar novamente HEAD da `main` e aprovar explicitamente o merge/publicação.

Não confundir build READY com homologação funcional concluída.
