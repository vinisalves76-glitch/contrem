# CONTREMTEC — Guia Interativo de Equipamentos

Protótipo independente para avaliação do módulo visual. Não integrado ao sistema operacional, autenticação ou banco de dados.

## Modelos
- SANY SY750H (foto de referência SY750H Pro da SANY do Brasil).
- SANY SKT110H (foto de referência da IRMEN).

## Funcionalidades
Seleção de equipamento, 6 pontos temáticos por modelo, painel por componente, busca sem distinção de acentos entre os dois modelos, favoritos por equipamento no navegador, fontes oficiais, documentação demonstrativa e exportação de HTML independente para consulta offline.

As imagens estão incorporadas no HTML. Nenhuma dependência de rede para a navegação do guia exportado; links às fontes externas exigem internet. Favoritos pertencem à origem do navegador e não são sincronizados ou transportados automaticamente na exportação.

## Conteúdo
Os pontos são ilustrativos e representam assuntos. Nenhum valor técnico, procedimento de intervenção, revisão de manual ou aplicabilidade por série foi validado. Documentação técnica deve ser fornecida e revisada antes da integração.

## Fontes das imagens
- https://www.sanydobrasil.com/produtos/sy750h/
- https://www.sanydobrasil.com/wp-content/uploads/2026/10/SANY-escavadeira-SY750H-1024x653.webp
- https://irmen.com.br/maquina/caminhao-skt110h/
- https://irmen.com.br/wp-content/uploads/2025/11/skt110h_site-e1763492181609-1536x1176.jpg

## Validação
Sintaxe JavaScript e testes no navegador: seleção dos dois modelos, abertura de componentes, busca entre modelos, favoritos, modal de documentação, exportação HTML e layout a 390px.

## Próximas etapas
1. Validar o fluxo e a identidade visual com o usuário.
2. Receber os manuais aplicáveis, revisões e faixas de série.
3. Cadastrar fotos de detalhes e pontos precisos em editor visual.
4. Integrar permissões da CONTREMTEC e conteúdo aprovado.
5. Integrar com o cadastro de equipamentos e ordens de serviço.

Preservar o protótipo e manter a evolução em ambiente de teste antes de qualquer alteração no sistema operacional.

## Revisão visual 2
Interface centrada na foto com pontos azuis, faixa de miniaturas, setas e painel flutuante por componente. As miniaturas de detalhes são ampliações identificadas da foto original; não representam fotos internas ou vistas adicionais. Galeria e troca de modelos verificadas no navegador.
