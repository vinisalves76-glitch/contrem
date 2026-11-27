# CONTREM Studio — Criador de Academias (27/11/2026)

## Objetivo
Simplificar o botão do menu para **Studio** e incluir dentro dele a criação e importação de Academias usando o modelo da Academia conectada, sem alterar a produção.

## Branch e escopo
- Base: `main` (commit `0ab867eaf5d85458f6e629e72a7f463e7bafe245`).
- Branch isolada: `feature/studio-criacao-academias-json-20261127`.
- Projeto Vercel original `contrem`, destinado exclusivamente à preview.
- Nenhuma alteração em SQL, Supabase, RLS, autenticação, rotas de aluno ou publicações.
- Não fazer merge ou deploy de produção neste ciclo.

## Entrega
- Menu do ADM: "✦ Studio" (antes "CONTREM Studio").
- Dentro do Studio: seletor Treinamentos / Academias preservando o editor SCORM existente.
- Criador de Academias: informações gerais, objetivos, identidade, certificado, etapas, módulos e aulas.
- Estrutura compatível com `academy-programs`: `stages[]`, `modules[]`, `stage.moduleIds`, `lessons[]`; módulos novos inativos e sem obrigatoriedade de vídeo.
- Importação de JSON de Academia no formato `contrem-academia-v1`, um `definition` existente, ou formato aninhado `stages[].modules[]`. IDs são recriados para não referenciar a Academia original; novos módulos são inativos.
- Exportação JSON editável e modelo para testar a importação em `criador-ia/samples/contrem-academia-modelo.json`.
- Salvamento local e isolado por usuário na **preview**. Nenhuma chamada de gravação no backend compartilhado, mesmo usando conta real. No domínio definitivo, o botão de salvamento foi preparado para acionar a API de Academias existente com revisão e permissões do servidor.
- A publicação, ativação de módulos e matrículas permanecem sob controle do ADM Master no painel Academias existente; o Studio não publica por conta própria.
- Ajuste do tamanho do iframe para dispositivos móveis e páginas extensas.
- Testes automatizados do modelo de JSON, validações, isolamento da preview e preservação dos assets do Studio.

## Testes e homologação
- `npm run check`, `npm test`, build central e demais checagens: GitHub Actions na branch.
- Testes podem confirmar contratos, mas **não comprovam** o fluxo autenticado em navegador. Confirmar manualmente na preview.
- Verificar criar, editar, importar e exportar JSON, salvar rascunho local, trocar abas e abrir no telefone/tablet.
- Para uma futura produção, revalidar o fluxo real da API `academy-programs` sem afetar Academias já cadastradas, manter permissão exclusiva de publicação e checar regressões do Studio SCORM.

## Arquivos
- `apps/academia/src/assets/scorm-entry.js`
- `apps/academia/src/criador-ia/index.html`
- `apps/academia/src/criador-ia/embed-shell.js`
- `apps/academia/src/criador-ia/academy-core.js`
- `apps/academia/src/criador-ia/academy-studio.js`
- `apps/academia/src/criador-ia/academy-studio.css`
- `apps/academia/src/criador-ia/samples/contrem-academia-modelo.json`
- `apps/academia/tests/studio-academies.test.mjs`
- `apps/academia/package.json`
