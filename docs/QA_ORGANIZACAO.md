## Atualização: sincronização concluída

As pendências de GitHub registradas abaixo pertencem à entrega anterior. O repositório foi criado pelo proprietário, as branches foram enviadas e a Vercel gerou builds a partir do GitHub. O estado atual, os commits e os testes da publicação central estão em CONTINUIDADE_CENTRAL.md.

---

# Verificação da organização — 15/11/2026

## PASSOU

- Academia estável: 38/38 arquivos do pacote publicado conferidos com a árvore da produção Vercel antes da edição das instruções de agentes; nenhum código executável foi alterado.
- ADM: 39 arquivos conferidos com a preview e quatro documentos com atualização posterior; nenhum arquivo executável divergente.
- Sintaxe/configuração: 41 scripts verificados na integração; 11 scripts verificados na base estável.
- ADM: testes de serviço local, conflito de revisão, hash de senha, duplicação de login, permissões de aluno, matrícula por curso, rascunhos e persistência.
- DOM emulado: cursos de aula única/série, rascunho sem vídeo, validação Mux, publicação, ordenação, duplicação, alunos, matrícula, entrada e conclusão.
- Migração de vídeo: fontes Mux, recusa de URLs externas/com tokens, preservação dos backups v1–v4, ausência de reprodução YouTube e bloqueio da conclusão sem mídia.
- Backend de mídia preparado: **42 testes Node**, todos aprovados; autorização, rejeições, assinaturas RS256 e ausência de vazamento de credenciais. Testes usam mocks; chaves RSA são efêmeras.
- ContremTec: verificação existente de identidade, isolamento de configuração, sintaxe e imports locais.
- Build estático dos quatro módulos concluído.
- Projeto Vercel renomeado e aliases conferidos: produção e ADM continuam nos deployments anteriores.
- Regras de branches preparadas com `git.deploymentEnabled`: `**: false`, `develop: true`, conforme a configuração oficial da Vercel. Isso é fonte preparada; vínculo Git remoto ainda pendente.

## NÃO TESTADO / NÃO EXECUTADO

- Novo QA visual completo em navegador, dispositivos físicos ou troca de origem dos dados locais. Esta organização não altera telas nem transporta dados do navegador.
- Login corporativo, Auth/RLS, upload e reprodução de mídia privada em ambiente real.
- SQL e migrations: nenhuma execução neste ciclo.
- Criação/push GitHub, CI remoto e build Vercel a partir de Git: bloqueados pela autenticação de criação do repositório, não concluída.
- Migração de ContremTec e guia da hospedagem privada para a Vercel.
- Publicação de produção: nenhuma nova versão publicada.

## Pontos preservados

`main` contém a Academia estável e o institucional. `develop` reúne os protótipos e o ADM local. APIs e SQL preparados estão fora da saída estática. O repositório do sistema anterior e seus dados não foram alterados.
