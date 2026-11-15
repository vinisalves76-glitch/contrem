# ContremTec

Setor de tecnologia de manutenção da CONTREM. A CONTREM Academia é o setor de capacitação, com acesso externo opcional pelo menu.

Projeto independente criado em 15/11/2026 a partir da versão operacional publicada, commit-base `bf5c5186ca1c080a0063657f3b86b2ec5dd9998b`. O projeto anterior permanece intacto.

## Executar e conferir

- `npm run check`: identidade, isolamento de configuração, sintaxe e imports.
- `npm run build`: gera `dist/` para demonstração estática.
- Servir `dist/` por HTTP e clicar em **Explorar demonstração**.

## O que funciona nesta versão

Identidade nova no login, navegação, biblioteca, relatórios, prompts de IA e PWA. Editor de relatório, modelo visual e salvamento local usam o código funcional existente com um adaptador isolado. Anexos da demonstração ficam no IndexedDB deste navegador. A interface operacional foi preservada, inclusive a manutenção 125h e as validações NOK do checklist.

## Limites explícitos

Demonstração local, sem autenticação corporativa, dados reais, e-mail, API de IA ou funções administrativas no servidor. Rotinas operacionais que dependem de RPC exibem essa condição. Dados locais não sincronizam com o projeto anterior. Usar **Sair** encerra a sessão local, preservando o conteúdo de teste neste dispositivo.

O adaptador Supabase e as APIs estão preservados no código-fonte para conexão posterior revisada. Não há chaves nem endpoints do projeto anterior. Não foram executadas migrations. `supabase/migrations/` contém a base estrutural copiada para revisão futura, sem a vinculação de identidade administrativa anterior; não executar automaticamente.

## Continuidade

Leia `00_LEIA_PRIMEIRO.md`, `AGENTS.md` e `docs/CONTINUIDADE_CONTREMTEC.md` antes de editar. A URL privada deste projeto deve ser reutilizada nas próximas revisões. Não promover nenhuma alteração no projeto anterior.
