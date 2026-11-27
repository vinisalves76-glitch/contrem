# CONTREM — organização central, 15/11/2026

GitHub confirmado: https://github.com/vinisalves76-glitch/contrem (criado pelo proprietário).
Vercel confirmada: projeto `contrem`, ID `prj_W6DhrOxmIe0QreKEV0WPSFLqHhco`, já vinculado a esse repositório.
Destino principal solicitado: https://contrem.vercel.app/.

Um código-fonte, um build central e caminhos independentes para institucional, Academia, ContremTec e guia. Consulte `VERCEL.md` e `FRENTES_DE_TRABALHO.md`.

`main`: base estável da Academia e do site, mais a ContremTec demonstrativa com guia revisão 2, cuja publicação foi solicitada pelo proprietário em 15/11/2026. `develop`: novo ADM fictício/local e evolução dos demais módulos. A ContremTec publicada mantém os limites de demonstração; não representa backend corporativo concluído.

## Limites preservados

Academia estável mantém Mux, autenticação existente e dados no mesmo backend. Aulas privadas/upload ainda dependem do backend preparado. ADM novo usa apenas dados fictícios locais. ContremTec não conecta dados reais. Guia é demonstrativo, sem procedimentos técnicos validados.

Nenhum SQL, conta, permissão de banco ou dado real foi alterado na organização. Os endereços anteriores continuam preservados até transição validada.

O registro da publicação central e os commits remotos devem ser consultados em `CONTINUIDADE_CENTRAL.md`. Arquivos de configuração preparados não são, sozinhos, evidência de deploy.

## Prévia da biblioteca de treinamentos — 27/11/2026

A branch `feature/academia-biblioteca-treinamentos-20261127` parte da `main` e mantém toda mudança fora da produção. A aba Treinamentos passa a ser biblioteca para busca, filtros e gerenciamento, com edição de cursos comuns em tela separada e edição/duplicação SCORM no CONTREM Studio. Build preview `dpl_A8Q7XKZQW3rj4o2H9KQwVf7Pna4c` pronto no projeto Vercel `contrem`; CI GitHub aprovado na revisão do teste de contrato (commit `09b5288`). Sem alterações em Supabase, RLS ou produção. Ver `docs/continuidade/academia-biblioteca-treinamentos.md`.

## Preview do CONTREM Studio com criação de Academias — 27/11/2026

Branch `feature/studio-criacao-academias-json-20261127` derivada da `main` `0ab867e`. Menu com botão **Studio** e construtor local de Academias integrado ao editor de treinamentos já existente. Importação/exportação JSON, etapas, módulos, aulas e exemplo de formação. Preview isolada: rascunhos locais por usuário, sem gravar no backend compartilhado. Nenhuma alteração de banco, Auth ou produção. Registros em `docs/continuidade/studio-academias-json.md`.

## Ajuste visual do Studio — 27/11/2026

A página inicial do Studio deixou de exibir o painel de demonstração "TESTE O FLUXO COMPLETO" (bloqueio e etiquetagem) e os atalhos para carregar/baixar seu JSON de exemplo. A criação normal de cursos, a importação de JSON, o catálogo e as Academias permanecem inalterados. Branch `fix/studio-remover-bloco-exemplo-20261127` criada a partir da `main`; publicação somente via PR protegido após testes.

## Prévia de imagens personalizáveis no Studio — 27/11/2026

Branch `feature/studio-imagens-curso-card` derivada da `main` `9e18c2c`. O editor de treinamentos permite enviar JPG/PNG/WebP ou informar URL HTTPS para a capa do curso e para a imagem do card, salvando ambas no rascunho e no JSON editável. O player e o catálogo usam essas imagens após a publicação. A migration `20261127213000_academy_studio_course_images.sql` cria o bucket público com envio restrito à equipe e estende a publicação e a compatibilidade visual do progresso. Migration aplicada no projeto Supabase compartilhado após os checks, sem publicar o frontend em produção neste ponto.

## Foto nos cards da biblioteca — 27/11/2026

Branch `fix/treinamentos-foto-card-descricoes` derivada da `main` `27c2b81`. O Studio explica junto de cada campo onde a capa e a foto do card aparecem. A biblioteca ADM de Treinamentos mostra a foto salva no curso publicado (`photo`, alimentada por `cardImage` no Studio) e a capa das Academias quando disponível. Sem mudanças de banco. Testes e build locais passaram; integração e deploy são registrados no PR.

## Limpeza da tela inicial do Studio — 27/11/2026

A home do CONTREM Studio deixa de exibir o atalho **Recuperar edição deste navegador**. O seletor técnico de arquivo JSON permanece no DOM com `hidden` e estilo explícito para não aparecer como campo solto; a importação funciona somente pelo botão **Importar treinamento**. A lógica de recuperação local e dados existentes não são apagados. Mudança isolada na branch `fix/studio-limpar-atalho-recuperacao-20261127` a partir da main vigente, sem alterações de Supabase, backend, credenciais ou outros módulos.

## Configurações gerais do treinamento — 27/11/2026

Branch `feature/studio-configuracoes-treinamento` derivada da `main` `791783b`. O Studio reúne, antes dos módulos, título, público, capas, classificação (Básico/Intermediário/Avançado), carga horária decimal, nota mínima, tentativas, atividades e avaliação final. O importador converte durações antigas de JSON em horas e o editor salva `hours` e a descrição legível `duration`. A migration `20261127223000_academy_studio_course_settings.sql` publica nível e minutos reais, atualiza o catálogo e preserva progresso em alterações só de metadados. A aplicação na base e o deploy dependem da validação da branch.
