# Organização CONTREM

Pedido de 15/11/2026: reunir todos os trabalhos em um código-fonte, organizar por setores e sincronizar GitHub/Vercel. As fontes foram recuperadas sem alterar o sistema anterior.

O código estável da Academia fica em `main`. A homologação inclui o ADM novo e os protótipos de tecnologia/guia. Instruções históricas de repositórios separados foram substituídas pela decisão atual; as aplicações continuam isoladas.

Próximo passo externo: criar o repositório privado `contrem` na conta confirmada, enviar branches e conectar os projetos Vercel existentes. A criação exige login do proprietário no navegador disponível. Não imprimir nem pedir tokens em chat.

A autenticação segura foi apresentada e não foi concluída. Nenhum repositório remoto foi criado. Depois que o proprietário fornecer o repositório privado vazio, usar a conexão GitHub para enviar os objetos/branches e verificar os commits. Para conectar projetos Vercel existentes, o recurso disponível de criação Git não serve: ele não reconecta projetos já existentes sem vínculo. Usar a configuração Git dos projetos existentes, com a raiz por aplicação, mantendo os deployments e a proteção atuais. Não criar projetos duplicados para simular a conexão.

Verificação local concluída: checks de sintaxe/configuração, testes existentes de ADM/DOM/migração, 42 testes do backend preparado, check ContremTec e quatro builds. Não houve novo QA visual completo nem execução de banco. Consulte `../QA_ORGANIZACAO.md`.
