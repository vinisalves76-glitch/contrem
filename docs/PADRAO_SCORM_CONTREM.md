# Padrão de treinamentos interativos e SCORM — CONTREM Academia

**Status:** padrão obrigatório para novos treinamentos da CONTREM Academia.  
**Escopo:** projetos editáveis no Studio, publicação no player interativo da Academia e exportação SCORM 1.2 de teste.  
**Fonte canônica:** este arquivo na `main` do repositório `vinisalves76-glitch/contrem`. Históricos, exemplos e ZIPs antigos não o substituem.

> Antes de roteirizar, gerar JSON, criar HTML ou alterar o player de um treinamento, leia este documento e confira a implementação atual. Se o usuário pedir uma exceção, siga o pedido e registre a decisão no projeto. Mudanças permanentes no padrão devem atualizar este arquivo no mesmo PR.

## 1. Experiência e identidade

- Use a identidade CONTREM Academia: azul petróleo/escuro, laranja de destaque, alto contraste, tipografia legível e layout responsivo para celular, tablet e computador. Não use marca de outra empresa como identidade do curso.
- Apresente primeiro **o que a pessoa aprenderá**, a quem se destina, o nível e a carga horária. A abertura orienta a navegação e o funcionamento das atividades; não repita instruções gerais em todos os módulos.
- Organize uma sequência progressiva: contexto e conceitos do zero → componentes e funcionamento → exemplos de campo → aplicação e diagnóstico → revisão/avaliação. Adapte a sequência ao assunto e ao público, sem inserir módulos genéricos que não sirvam ao objetivo.
- Cada módulo precisa de objetivo claro, leitura principal suficiente para aprender o tema sem vídeo, exemplos concretos, cartões de exploração e uma situação de aplicação com feedback. O vídeo é apoio visual; não deixe informação indispensável só nele.
- Frente e verso de cartões devem cumprir papéis diferentes: frente com pergunta, pista ou situação; verso com explicação, consequência ou exemplo. Indique visualmente que o cartão pode ser aberto. Evite repetir a mesma frase nos dois lados.
- Fotos de equipamentos, peças e pessoas devem ser pertinentes ao conteúdo. Não apresente imagem ilustrativa como identificação técnica de componente ou procedimento de um modelo específico.
- Separe a **capa do curso** (imagem horizontal da abertura, com espaço para título) da **foto do card** (reconhecível em tamanho pequeno nas listas Treinamentos e Minha aprendizagem). Descreva ambas no projeto e confira recortes e legibilidade.
- Em temas de manutenção e segurança, diferencie conceito didático de procedimento operacional: confirme dados técnicos, limites, passos e riscos com manual do fabricante e responsável técnico. Não invente valores ou recomendar intervenção insegura.

## 2. Configurações antes dos módulos

No Studio, defina título, público, classificação **Básico / Intermediário / Avançado**, carga horária planejada em horas, capa, foto do card, atividades, avaliação final, nota mínima e tentativas. O valor numérico `hours` aceita de **0,25 a 200 horas** (até duas casas decimais); `duration` é o rótulo legível de compatibilidade. O padrão pedagógico da Academia é **80%** e **duas tentativas** para a avaliação final, salvo decisão expressa do proprietário para um curso. Só o ADM Master publica; instrutores e ADM de Conteúdo criam, editam e revisam.

A foto anexada pelo Studio é convertida para JPEG e guardada no armazenamento de imagens do curso; URL HTTPS também é aceita. O vídeo publicado usa **Playback ID público do Mux**, não Asset ID nem link do painel Mux. Posições aceitas: `before-content`, `after-content` e `after-cards`. A versão publicada da Academia não usa incorporação do YouTube como campo de vídeo do Studio.

## 3. Formato editável aceito pelo Studio

O arquivo de importação é JSON UTF-8 com `format: "contrem-course-v1"` e `modules` com **1 a 100** itens. Use os campos reconhecidos abaixo. O importador valida e normaliza os dados; propriedades extras podem ser descartadas. **Não descreva um jogo ou interação extra em um campo próprio como se já fosse reproduzido no aluno.**

```json
{
  "format": "contrem-course-v1",
  "mode": "editable",
  "presentation": "cards-v1",
  "title": "Título do treinamento",
  "audience": "Público-alvo",
  "level": "Básico",
  "hours": 1.5,
  "duration": "1,5 horas",
  "brief": "Orientações para revisão editorial",
  "materials": "Notas do instrutor",
  "coverImage": "",
  "cardImage": "",
  "interactive": true,
  "quiz": true,
  "score": 80,
  "attempts": 2,
  "refs": [],
  "modules": [
    {
      "title": "Título do módulo",
      "goal": "O que o aluno será capaz de compreender ou fazer",
      "body": "Leitura principal, dividida em parágrafos. Explique conceito, funcionamento, exemplo e aplicação.",
      "cards": [["Pergunta ou pista", "Explicação complementar com exemplo"]],
      "question": "Situação prática com uma decisão clara?",
      "options": ["Alternativa A", "Alternativa B", "Alternativa C"],
      "correct": 1,
      "image": "",
      "videoPlaybackId": "",
      "videoPosition": "after-content",
      "type": "decision"
    }
  ]
}
```

Regras atuais do importador: título e `body` não vazios; `question` não vazia; **2 a 6** alternativas preenchidas; `correct` é o índice da correta, começando em **0**; até **20 cartões** por módulo, cada um como par de textos; conteúdo do módulo até 25.000 caracteres. As imagens do curso são URLs HTTPS após upload. O importador aceita durações legadas como `90 minutos` e converte para `hours`.

## 4. Atividades, avaliação e progresso

- Atividade do módulo: o aluno responde à situação; erro apresenta feedback e permite rever/escolher de novo. O avanço só libera após resposta correta registrada pelo servidor. Essa atividade não consome as duas tentativas da avaliação final.
- Avaliação final: uma questão de cada módulo, nota calculada no servidor e limite padrão de duas tentativas. Ao esgotá-las, a interface orienta solicitar análise do ADM; **não prometa liberação automática de tentativa extra**.
- O aluno precisa estar autenticado e matriculado. A publicação é uma versão revisada; editar rascunho não altera a aula já publicada. Alterações apenas de vídeo/posição, capa, card, nível ou duração preservam o progresso conforme a compatibilidade vigente; mudanças de conteúdo podem arquivar o estado anterior e reiniciar a versão corrente. Revise o efeito antes de republicar.
- Matrícula, progresso, gabarito e permissões pertencem ao backend da Academia. Um HTML ou JSON local não representa aprovação oficial e não deve simular conclusão no banco.

## 5. Recursos que exigem desenvolvimento separado

Jogos de associação (ligar peças e funções), animações com etapas, provas intermediárias adicionais, narração/personagens e HTML interativo próprio podem ser desenhados na **prévia editorial**. O importador `contrem-course-v1` e o player nativo atual **não executam automaticamente** esses recursos por constarem no JSON. Para entregá-los oficialmente, implemente o componente e o armazenamento com testes, ou use um fluxo de aula HTML/SCORM compatível e validado. Informe claramente ao proprietário o que a versão importada conservará.

O botão **Baixar SCORM 1.2 (.zip)** gera um pacote demonstrativo de um SCO. Seu exportador atual transporta texto, perguntas, gabarito e parâmetros básicos; **não inclui automaticamente cartões, vídeos Mux, imagens externas ou jogos** no pacote. Teste-o no LMS de destino antes de declarar compatibilidade ou usá-lo para certificação. A publicação nativa pelo Studio é o fluxo da CONTREM Academia para cartões, vídeo Mux e matrícula oficial.

## 6. Sequência de trabalho obrigatória

1. Defina público, nível, duração, objetivo geral e resultados esperados. Verifique a fonte técnica do assunto.
2. Escreva o mapa de módulos e a **leitura completa** de cada um; prepare cartões, exemplos e perguntas sem duplicação. Indique vídeos e imagens como apoio.
3. Mostre uma prévia baseada no projeto atual para revisão do proprietário. Ajuste textos e atividades antes de montar o JSON final quando ele pedir esse fluxo.
4. Gere e valide o `contrem-course-v1`; importe no Studio como **rascunho**, confira todos os módulos, cartões, capa, card, horas, classificação, vídeos e gabaritos. Salve no banco e teste na visão do aluno.
5. Faça revisão técnica/editorial, confirme 80% e duas tentativas ou a exceção autorizada. O ADM Master publica; libere a matrícula e confira o player com conta de aluno. Não use o estado `READY` da Vercel como prova de funcionamento completo.
6. Registre alterações, limites conhecidos e testes no documento de continuidade do módulo. Trabalhe em branch/PR e preserve a `main` e os cursos existentes.

## 7. Referências no repositório

- Editor/importador: `apps/academia/src/criador-ia/app.js` e `connected.js`.
- Player e publicação: `apps/academia/src/scorm-player/runtime.js` e migrations em `apps/academia/supabase/migrations/`.
- Exportação SCORM 1.2 demonstrativa: `apps/academia/src/criador-ia/zip.js`.
- Exemplo de estrutura JSON: `apps/academia/src/criador-ia/samples/contrem-loto.json` (exemplo de conteúdo, não substitui este padrão).
- Histórico técnico: `docs/continuidade/scorm-ai-preview.md`.
