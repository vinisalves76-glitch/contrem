# CONTREM Academia — Comunidade e Fórum

A branch `feature/academia-comunidade-forum` parte da `main` `381202f`. A prévia reusa o layout, os estilos e a navegação da Academia em `/academia/preview-social/index.html` no projeto Vercel `contrem`.

- Aluno: menu **Comunidade** para publicar texto e foto, curtir e comentar. Menu **Fórum** para buscar por texto ou categoria, publicar perguntas, responder e marcar os próprios tópicos como resolvidos.
- ADM: menu **Moderação** para consultar e excluir publicações, comentários, tópicos e respostas. A confirmação informa o alcance da exclusão.
- **Trocar perfil** volta à entrada de teste. Os perfis usam os mesmos dados fictícios no navegador. A sessão real e o banco ficam fora do ambiente de demonstração.

Os arquivos em `apps/academia/preview-social/` montam a prévia usando o HTML atual da Academia. O build central copia esse ambiente com `VERCEL_ENV=preview`. A navegação do aluno em `apps/academia/src/assets/student-navigation.js` reconhece as seções extras declaradas pelo módulo. A entrada demonstrativa não carrega a configuração do Supabase nem o service worker.

Validação local: `npm run check`, `npm test` e o contrato de saída de `npm run test:central` nos builds Preview e Production. O fluxo no Chromium passou em 390, 820 e 1440 px, incluindo foto, curtida, comentário, busca, resposta, resolução de tópico, persistência após recarregar e exclusões pelo ADM. Para abrir localmente, execute `VERCEL_ENV=preview npm run build` e sirva `dist/`.

Uma publicação para contas reais requer persistência compartilhada, autorização de aluno e ADM no servidor e armazenamento restrito de fotos.

## Deployment de teste

Vercel `dpl_HYECCk94mf9A1y32mfZWVTSnctzF`, estado `READY`, commit de código `c7fe3b93ece7fe6044a241a6a3ef93825623339d`. A página e o script de interface retornaram HTTP 200. [Abrir pela Vercel](https://contrem-428sldfwt-vinicius-alves-projects-fdea38e8.vercel.app/academia/preview-social/index.html).
