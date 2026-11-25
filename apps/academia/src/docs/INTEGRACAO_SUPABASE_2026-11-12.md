## Entrega da integração — 12/11/2026

Banco real: migration 20261112223552_contrem_academy_initial aplicada. Preview conectada: https://contrem-academia-preview.vercel.app/ · dpl_HwDFRTBFZgnArGXQEBWeZLLoRyHy · READY · target null. HTML, scripts de integração, SDK e SW retornaram HTTP 200 em fetch autenticado; SW release b00c7a770516. A preview pode pedir login Vercel antes do login da Academia.

Produção mantida: https://contrem-academia.vercel.app/ · dpl_GejvmXNYnW3D5dJh11oxgP2ZrYRs (PWA local anterior). Nenhuma promoção da nova entrada por conta foi feita antes da validação do usuário. Próximo passo: administrador entrar na preview usando sua conta Supabase existente e conferir carregamento/salvamento reais, então promover a integração quando solicitado. Não solicitar senha em mensagens.

O registro final do pacote foi fechado depois do deployment; documentação pode ser mais recente que a servida. Código executável corresponde à preview publicada.

# Integração inicial Supabase — CONTREM Academia

## Decisão do usuário e infraestrutura

O usuário pediu o mesmo projeto Supabase do Relatório Pro e decidiu que o sistema de manutenção passará a se chamar CONTREMTEC em uma próxima etapa. Projeto confirmado pelo conector: relatoriopro / vwvesygsudhbaqmayhsz, ativo. URL https://vwvesygsudhbaqmayhsz.supabase.co. A marca e o aplicativo de manutenção não foram alterados nesta entrega.

Foram inspecionados o schema real, políticas, triggers de auth.users e as migrations/documentação do repositório vinisalves76-glitch/relatoriopro. Nenhum trigger não interno estava ligado a auth.users. A migração é aditiva e não altera perfis operacionais, relatórios, equipamentos, OS, ciclos de inspeção, Storage ou configurações de Auth. Nenhum dado real de manutenção foi editado ou removido.

## Estrutura aplicada

Migration remota: `20261112223552_contrem_academy_initial`. Arquivo SQL criado via CLI 3.1.0 e alinhado ao timestamp retornado pelo histórico remoto. SDK JavaScript fixado em 2.119.0; package-lock e cópia UMD/licença incluídos para não depender de CDN ao carregar a interface.

- `academy_members`: associação da conta Auth, nome de exibição, papel admin/student e ativo. O administrador master ativo existente foi associado por SELECT, sem IDs gerados hardcoded e sem modificar public.profiles. Outros usuários existentes podem se associar como alunos ao entrar; não podem escolher papel de administrador.
- `academy_catalog`: documento JSON do catálogo, compatível com o formato de cursos/aulas atual. Um registro main, inicialmente vazio. Somente administrador da Academia pode atualizar. Revisão otimista evita sobrescrever alterações concorrentes sem aviso.
- `academy_learning_state`: perfil, progresso, certificados demonstrativos e atividade individuais, com revisão otimista. O aluno acessa somente o próprio estado.
- `academy_private`: funções internas de autorização com auth.uid(), search_path vazio e privilégios restritos; funções SECURITY DEFINER não são criadas como RPC público.

As três tabelas têm RLS. Grants de coluna impedem alterar role, active ou user_id pelo cliente. Anônimo não lê os dados. A exclusão de uma conta Auth apenas desvincula user_id do membro; o histórico acadêmico permanece e isso não bloqueia o fluxo de exclusão já existente no sistema de manutenção.

## Funcionamento do aplicativo

O formulário Entrar na minha conta usa e-mail/senha das contas já existentes no Supabase. Não cria contas nem envia e-mails. Cadastro/convite de novos alunos e recuperação por e-mail ficam para um próximo ciclo, com revisão de URL de redirecionamento/SMTP do projeto compartilhado.

Sessão usa a chave `contrem-academia-auth-v1`; logout é scope local, preservando outras sessões do mesmo usuário em outros sistemas. O cliente contém somente chave publishable, nunca service_role.

A demonstração anterior continua acessível e preserva `va-academia-*`. Caches de conta usam `contrem-academia:<user_id>:<chave>` e pendências próprias. A entrada conectada carrega dados do servidor, sem enviar o catálogo da demonstração automaticamente. Para publicar cursos locais: importar o backup na demonstração desta origem, sair da demonstração, entrar na conta de administrador e escolher Publicar catálogo local. A confirmação indica que substitui o catálogo compartilhado; não importa progresso da demonstração.

Alterações conectadas têm cache por conta e fila de envio. Falha de rede mantém cópia pendente. Revisões diferentes guardam essa cópia e apresentam conflito, com opção de download e recarga explícita dos dados do servidor. Primeira entrada/retomada da conta requer internet. O cache PWA continua sendo da interface, sem vídeos YouTube nem respostas Auth/REST.

## Limites desta etapa

O catálogo JSON preserva a arquitetura atual para uma integração inicial; não é um LMS completo com matrículas/pagamentos e banco normalizado por aula. Questões/correção/certificados continuam demonstrativos no cliente; não alegar certificação verificável ou resistência a manipulação de notas. Não há loja, pagamento, convite de novos alunos ou redefinição de senha neste ciclo.

## Testes executados

| Verificação | Resultado |
|---|---|
| Migração remota e RLS nas 3 tabelas | PASSOU |
| Administrador atualiza catálogo; aluno lê e não atualiza | PASSOU, SQL no banco real |
| Aluno não eleva papel nem grava no estado de outro membro | PASSOU, SQL no banco real |
| Revisão incrementa; teste revertido sem dados fictícios persistidos | PASSOU, transação com rollback |
| REST sem login | PASSOU: 401 / 42501, acesso anônimo negado |
| URLs, backups v1–v4 e rollback | PASSOU: qa-model.cjs e qa-import.cjs |
| PWA/cache e instalação por plataforma | PASSOU: qa-pwa.cjs e qa-install.cjs |
| Serviço e armazenamento isolado por conta | PASSOU: qa-cloud.cjs |
| Login renderizado e demonstração antiga preservada | PASSOU, Chrome local; progresso anterior continuou 1/3 |
| Interface conectada admin/aluno | PASSOU com cliente simulado local: curso salvo, perfil salvo, administração oculta para aluno |
| Login real e sincronização no navegador com a conta do usuário | NÃO TESTADO: nenhuma senha do usuário foi obtida ou criada |
| Celular físico | NÃO TESTADO |

O cliente simulado fica somente em tests/ e no diretório local de QA; não publicar os arquivos qa-cloud.html/ui-fixture-sdk.js na aplicação. A verificação SQL usa contas existentes dentro de transação revertida e não cria contas Auth nem envia e-mails.

## Auditoria do projeto compartilhado

Advisors antes/depois não apontaram avisos para os novos objetos academy. Permanecem avisos preexistentes sobre funções SECURITY DEFINER operacionais, auditoria sem policy (tabela privada) e proteção contra senha vazada desativada. Não alterar funções operacionais no escopo da Academia sem mapear consumidores. Referências para a próxima revisão do CONTREMTEC:

- [Funções públicas SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Funções autenticadas SECURITY DEFINER](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)
- [Proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
