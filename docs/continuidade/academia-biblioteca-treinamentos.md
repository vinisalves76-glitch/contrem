# CONTREM Academia — Biblioteca de Treinamentos (27/11/2026)

## Objetivo aprovado
Separar a aba **Treinamentos** (consulta e gerenciamento do catálogo) da autoria de cursos, que permanece no **CONTREM Studio**, sem alterar a produção.

## Base e isolamento
- Fonte: `main` na criação da branch em 27/11/2026.
- Branch exclusiva: `feature/academia-biblioteca-treinamentos-20261127`.
- Projeto Vercel existente: `contrem`. Somente deploy **preview**, sem promoção para produção e sem alterações de Supabase, permissões ou migrations.
- Sem merge para `main` ou `develop` neste ciclo.

## Interface implementada
- Biblioteca em largura completa, cartões de treinamento com estado, formato, categoria, quantidade de aulas e duração.
- Busca por nome, categoria e descrição (insensível a maiúsculas e acentos), filtros por publicação e categoria, ordenação por nome A–Z/Z–A, contador e limpeza de filtros.
- Ações de **Editar**, **Duplicar** e **Excluir** preservadas.
- Editor legado de cursos avulsos permanece acessível em uma tela separada após Editar, com retorno para a lista; nenhum botão de criação aparece na biblioteca.
- Treinamento SCORM: Editar abre o projeto correspondente no Studio; Duplicar prepara uma nova cópia editável, sem herdar ID, revisão ou publicação da versão original. A cópia deve ser salva no Studio antes de publicar.
- A exclusão conserva confirmação e restrição ao ADM Master.
- Layout responsivo para desktop, tablet e celular.

## Arquivos alterados
- `apps/academia/src/assets/admin-manager.js`
- `apps/academia/src/assets/admin-manager.css`
- `apps/academia/src/assets/scorm-entry.js`
- `apps/academia/src/criador-ia/app.js`
- `apps/academia/src/assets/cloud-ui.js`
- `apps/academia/tests/release-contract.test.mjs`

## Validação e próximos passos
- Build Vercel da preview `dpl_A8Q7XKZQW3rj4o2H9KQwVf7Pna4c`: READY, commit `abef2e6` (antes de atualizar o teste de contrato).
- Sintaxe das quatro fontes JavaScript modificadas: validada em inspeção estática.
- CI de `abef2e6` falhou em um teste que esperava o antigo texto **CONSTRUTOR DE CURSOS** na biblioteca. O teste foi atualizado para refletir a separação e preservar a edição legada; verificar o CI do novo commit.
- Validar manualmente com login ADM Master na preview: filtros, abertura do editor legado, edição de SCORM no Studio, cópia, exclusão com confirmação, retorno e celular.
- Avaliar antes da publicação se há outras integrações de autoria/duplicação a ajustar. Não promover sem solicitação explícita.
