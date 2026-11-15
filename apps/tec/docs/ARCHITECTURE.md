# Arquitetura — ContremTec

Frontend modular HTML/CSS/JavaScript preservado. Entrada: `index.html` e `js/app.js`. Demonstração: `js/core/local-preview-adapter.js`, dados em localStorage e anexos em IndexedDB, sem requisições corporativas. Adaptador online inativo: `js/core/supabase-adapter.js`. APIs futuras: `api/`.

`npm run build` copia apenas a interface para `dist/`; não executa APIs nem migrations. O PWA cacheia apenas os arquivos públicos desta aplicação.

O projeto de hospedagem está declarado em `.openai/hosting.json`. Manter sua identidade e URL entre revisões. Não fazer alterações em projetos externos por associação de nome ou domínio.
