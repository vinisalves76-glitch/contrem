# CONTREM Academia — unificação do construtor de aulas

Data: 2026-11-23. Origem: comparação visual entre o construtor de módulos da Academia e a edição de cursos avulsos.

## Decisão funcional do proprietário

O editor de aulas dos **cursos avulsos** é o fluxo padrão de criação/edição para ambos os contextos. A Academia conserva a hierarquia **Academia > etapa > módulo > aulas**, o painel de trilha, status, matrículas, publicação restrita ao ADM Master e regras de não exclusão. O lançamento de aulas não deve ter uma implementação paralela com menos recursos.

## Fluxo esperado

1. ADM > Academias > selecionar formação > etapa > módulo > Gerenciar aulas.
2. Abrir o mesmo editor funcional de cursos avulsos (não apenas layout parecido): informação da aula, vídeo Mux/Playback ID, materiais de apoio por aula e comuns ao módulo, atividades, avaliação/prova e revisão.
3. Gravar conteúdo sempre com contexto explícito `academyId` / `moduleId` / `lessonId`, preservando ordenação. Alterações de aula não devem afetar cursos avulsos.
4. Voltar ao módulo sem perder alterações não salvas; alertar antes de descartá-las.
5. Cursos e aulas da Academia não podem ser excluídos; conteúdos são editáveis conforme perfil; só ADM Master publica e ativa módulos.
6. Manter matrícula, permissões, conclusão e estrutura de trilhas da Academia.

## Evidências de código e bloqueio identificado

- `apps/academia/src/assets/admin-manager.js`: editor avulso com formulários existentes de aulas e materiais, campos de URL/Playback ID Mux e integração com avaliação.
- `apps/academia/src/assets/academy-connected-ui.js`: editor administrativo próprio de módulos, com aula limitada a nome, descrição, duração e indicação de vínculo de vídeo; não reutiliza os formulários avulsos.
- `apps/academia/supabase/functions/academy-programs/index.ts`: sanitizador `clean()` conserva nas aulas somente `id,name,description,videoId,minutes`; quaisquer materiais, URLs e questões adicionais são descartados no salvamento. O serviço expõe aos alunos uma projeção reduzida.
- `apps/academia/src/assets/academy-program-core.js`: verificações de pertencimento exclusivo de módulos, controle de disponibilidade e progressão.

**Consequência:** trocar apenas o HTML da tela não corrige o problema. Requer adaptador compartilhado para o formulário, persistência/validação na API e projeção segura do conteúdo ao aluno, com armazenamento de anexos autorizado. Não simplesmente introduzir campos no JSON, pois o backend atual os descartaria.

## Critérios de aceite

- Mesmo formulário e comportamento do editor avulso ao criar/editar aula em módulo.
- Mux persiste após atualização e reabertura; não confundir Playback ID, Asset ID e URL.
- Materiais de apoio individuais e comuns persistem e ficam disponíveis apenas a alunos autorizados.
- Atividades, questões e prova salvam, recarregam e respeitam critérios de aprovação.
- Edição não modifica outra aula, outro módulo nem curso avulso.
- Sem regressão em Auth, RLS, matrículas, perfis, publicação, ativação e acesso à trilha.
- Testes automatizados de API, editor e navegação completos; inspeção manual em preview.
- Alterar somente branch de desenvolvimento; não integrar em main nem publicar em produção sem autorização.

## Estado desta branch

Documento de especificação e auditoria inicial. **Integração funcional ainda não implementada nem validada.** Não tratar esta branch como preview final da funcionalidade.
