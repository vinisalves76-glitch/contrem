## Entrega ADM finalizada

Prévia READY em https://contrem-academia-preview.vercel.app/ — dpl_DDoapnGQ8enodhJP11m8jqARUmmJ. Ler CONTINUIDADE_ADM.md na raiz do pacote e docs/QA_ADM_PREVIEW_2026-11-14.md para escopo, testes e limitações. A documentação foi finalizada após o deploy; o código executável é idêntico ao publicado na prévia. Produção preservada.

---

## Ciclo ADM — prévia isolada de 14/11/2026

Escopo atual solicitado: desenvolver somente a administração, fora da main e sem produção. Branch local `feature/adm-cursos-preview`; base preservada em `snapshot-producao`. Não há remoto GitHub da Academia confirmado. Não confundir com relatoriopro. O projeto Vercel existente e o alias de preview serão reutilizados.

Esta versão é um sandbox de fluxo: `cloud-config.js` contém apenas `{preview:true}`. A inicialização do cliente Supabase é interrompida antes de qualquer sessão ou chamada remota. Catálogo, alunos fictícios, liberações e progresso ficam no navegador, em namespace `contrem-adm-preview-*`. Os logins criados aqui funcionam somente na mesma origem/navegador. Não são contas Auth reais; o botão ADM é entrada demonstrativa, sem autenticação de produção. Não promover esta build diretamente para produção.

Implementado: construtor em informações/aulas/revisão; formato aula única ou série; salvar rascunho com vídeo pendente; validação para publicar; ordenar/editar/remover aulas; duplicar curso; busca e filtro por situação; visualização da sala; cadastro de aluno fictício, acesso por curso, ativação/desativação e login de teste. A publicação na prévia libera apenas cursos com status published e matrícula atribuída. Senhas de teste são derivadas com PBKDF2, nunca gravadas como texto puro. O sandbox é demonstrativo e editável pelo próprio navegador, não um limite de segurança.

Sequência para validar: Abrir painel ADM de teste → criar curso → escolher formato → salvar informações → adicionar aula(s) → revisão → publicar na prévia → Alunos → criar login fictício → marcar curso → sair → entrar com o aluno nesta mesma prévia. Use apenas dados fictícios.

Integração final pendente: conectar o construtor ao Auth/RLS real em ambiente de homologação isolado; validar novas regras de status e formato no servidor, filtragem segura do catálogo e revisão do contrato JSON; concluir mídias signed/Mux privadas e upload; executar QA autenticado com o proprietário; somente publicar quando solicitado. Não substituir as políticas e a função de alunos de produção pelo serviço local da prévia.

---

## Estado final — produção Mux, 14/11/2026

Produção publicada e validada: https://contrem-academia.vercel.app/ · dpl_EwJzQCYv4MyFr7dnZvktUFFE7pqS · READY · production. Apresentação no Mux, YouTube removido da reprodução e do botão externo. Aulas antigas ficam pendentes de migração, preservando dados/progresso. QA e próximos passos: docs/QA_MUX_PRODUCAO_2026-11-14.md. Este registro prevalece sobre o histórico abaixo. Documentação finalizada após a publicação; código executável idêntico ao deploy.

---

## Publicação autorizada — Mux e remoção do YouTube, 14/11/2026

O usuário autorizou colocar em produção removendo YouTube. A apresentação permanece no Mux. Reprodução e botão externo do YouTube foram retirados das aulas; URLs antigas só são reconhecidas para compatibilidade de importação e ficam pendentes de migração, preservando dados e progresso. O curso demonstrativo não recebe vídeos falsos de conteúdo técnico. Novas referências de mídia usam Playback ID do Mux; vídeos privados continuam dependentes da configuração do backend e das chaves de assinatura. Não declarar cursos privados já integrados.

Cache v9 e atualização silenciosa preservados. Prévia revisada deve ser validada e a mesma fonte publicada em produção neste ciclo. Registrar IDs finais e QA no pacote.

---

## Registro final da prévia Mux — 14/11/2026

Preview publicada e testada: https://contrem-academia-preview.vercel.app/ · dpl_86QXUxHLgSSDqdCEduogETa3WfiJ · READY · target null. Reprodução real, pular, reabrir e reentrar na demonstração passaram no Chrome cloud. Produção dpl_4GvQkqd5quN3yVRa4Miv4Cpaz4PL preservada.

QA detalhado em docs/QA_MUX_INSTITUCIONAL_2026-11-14.md. Documentação do pacote foi finalizada após o deploy; o código executável de HTML/JS/CSS/SW é o publicado. Não afirmar QA mobile nem reprodução completa.

---

## Apresentação Mux — prévia de 14/11/2026

A apresentação institucional usa o Playback ID público hXZZcG4J01eIXscxjSGGKtkfkQjbttFu1P01raXQinZ500, fornecido pelo usuário. Player e miniatura Mux substituem o YouTube somente no institucional. A apresentação abre em cada entrada na demonstração e continua disponível no painel. Pular/fechar/interromper continuam iguais. Autoplay com som está sujeito às regras do navegador.

Fonte base integral: produção dpl_4GvQkqd5quN3yVRa4Miv4Cpaz4PL; 37/37 arquivos verificados por SHA-1. README recuperado do prefixo do pacote publicado, confirmado por SHA-1 exato e7e9829b6f2312041a7a1a977c1ca8e6f0b42d02; outros 36 vieram do domínio de produção. Snapshot preservado.

O institucional é público por decisão do usuário e dispensa chaves de API no navegador. A integração de aulas privadas assinadas está preparada separadamente, ainda depende de credenciais Mux e integração do backend. Não declarar que as aulas foram migradas. Não incluir segredos no frontend.

Cache do PWA versionado sem reintroduzir aviso de atualização. Nenhum vídeo externo é armazenado no service worker. Publicação desta mudança somente em preview para validação; produção segue no deployment base.

Resultados reais do ciclo e URL da preview serão registrados em QA_MUX_INSTITUCIONAL_2026-11-14.md.

---

## Entrega da integração — 12/11/2026

Banco real: migration 20261112223552_contrem_academy_initial aplicada. Preview conectada: https://contrem-academia-preview.vercel.app/ · dpl_HwDFRTBFZgnArGXQEBWeZLLoRyHy · READY · target null. HTML, scripts de integração, SDK e SW retornaram HTTP 200 em fetch autenticado; SW release b00c7a770516. A preview pode pedir login Vercel antes do login da Academia.

Produção mantida: https://contrem-academia.vercel.app/ · dpl_GejvmXNYnW3D5dJh11oxgP2ZrYRs (PWA local anterior). Nenhuma promoção da nova entrada por conta foi feita antes da validação do usuário. Próximo passo: administrador entrar na preview usando sua conta Supabase existente e conferir carregamento/salvamento reais, então promover a integração quando solicitado. Não solicitar senha em mensagens.

O registro final do pacote foi fechado depois do deployment; documentação pode ser mais recente que a servida. Código executável corresponde à preview publicada.

## Estado atual: integração Supabase

O usuário autorizou usar o mesmo projeto Supabase do Relatório Pro. O aplicativo agora oferece entrada por conta e demonstração local separada. O login/admin do modo de conta têm Auth/RLS reais; avaliações/certificados continuam demonstrativos. Nenhum dado local é enviado automaticamente. Leia `docs/INTEGRACAO_SUPABASE_2026-11-12.md` para estrutura, limitações, testes e migração do catálogo. As descrições abaixo sobre ausência de backend são histórico anterior e não descrevem o modo de conta.

## Instalação por plataforma — revisão de 12/11/2026

Pedido atual autoriza ajustar o botão na aplicação publicada. Android mostra uma oferta dispensável de instalação. O toque abre o prompt nativo quando `beforeinstallprompt` estiver disponível; a confirmação final é do navegador. Se indisponível, apresenta instruções Android e habilita o botão nativo quando o evento chegar. iPhone/iPad mostram somente o tutorial Safari / Adicionar à Tela de Início, sem instruções Android. App em standalone ou evento appinstalled ocultam os controles; a dispensa da oferta Android é respeitada na sessão. Teste de estados em `tests/qa-install.cjs` (simulação de plataforma, não aparelho real). Cache SW precisa ser versionado a cada edição do shell. Domínio de produção mantido.

# VA Academia — Plano de desenvolvimento

## Diretrizes
- Produto comercial independente do IRMEN ONE.
- Somente preview; não publicar em produção sem autorização explícita.
- YouTube para vídeos; armazenar URL/ID e metadados.
- localStorage até nova decisão; nenhum banco remoto nesta fase.
- Não prometer bloqueio de gravação de tela ou compartilhamento de links não listados.

## Cinco frentes desta entrega
1. Perfil local persistente: nome, e-mail opcional, empresa e função.
2. Histórico: cursos iniciados/concluídos, percentual, última atividade e retomada.
3. Desempenho: tentativas, média, taxa de aprovação e carga horária de cursos concluídos.
4. Experiência de aula: navegação anterior/próxima e retomada da primeira aula pendente.
5. Preparação futura: separar perfil demonstrativo local da futura autenticação real; banco e autenticação permanecem adiados.

## Funcionalidades anteriores mantidas
Catálogo e busca, player YouTube, progresso por aula, CRUD local de cursos/aulas/avaliações, avaliações e tentativas, certificados demonstrativos, backup/restauração JSON.

## Backup
Schema v4 inclui cursos, progresso, avaliações, tentativas, certificados, perfil e histórico de atividade. Importação compatível com schemas v1, v2, v3 e v4.

## Testes manuais pendentes
- Salvar perfil e verificar persistência após recarregar.
- Iniciar cursos, concluir aulas, navegar e retomar.
- Conferir histórico, média, taxa de aprovação e horas.
- Exportar/importar backup v4 em outro navegador e validar os dados.
- Validar fluxo de emissão e impressão de certificados.

## Limitações
Sem autenticação/autorização real, sincronização, recuperação de senha ou backup automático. localStorage pode ser apagado. Certificados são demonstrativos e não têm validação pública/antifraude. Vídeos não listados podem ser compartilhados; player não impede captura de tela.


## Transferência para ChatGPT Work
A sequência de continuação e regras atualizadas estão em `docs/HANDOFF_WORK.md`, `AGENTS.md` e `docs/ROADMAP_WORK.md`.

## Rodada de continuidade — 12/11/2026
**E1 concluída:** recuperados `src/index.html`, `README.md`, `AGENTS.md` e oito documentos em `docs/` da última preview READY `dpl_36zUcqmcFZK7FmAjZHoBkL1nchVG`; os 11 SHA-1 coincidiram com os IDs da árvore Vercel. Snapshot íntegro separado no pacote de continuidade.

**E2 em validação:** QA desktop da base registrado em `docs/QA_RESULTADOS_2026-11-12.md`. Corrigidos nota mínima de 0%, validação de URL YouTube, identificação de certificados demonstrativos, resíduos de exclusão de curso e proteção da importação de backup. `node tests/qa-model.cjs` passou para schemas v1–v4 e entradas inválidas. Reprodução contínua, upload em navegador isolado e mobile ainda exigem teste.

**Próxima entrega:** uma preview com o código e documentos desta rodada; conferir READY/target preview e smoke na URL. Depois validar importações na UI, layout mobile e substituir vídeo infantil demonstrativo por conteúdo técnico próprio/autorizado. Banco remoto e GitHub exclusivo permanecem decisões futuras.

## Ciclo 2 — experiência da aula e continuidade dos dados
- Base confirmada: `dpl_CuK9vKMo6W5RhP7VkWZ2kBJdsYq6` (READY, preview) e `index.html` SHA-1 `bf175065d109985cc90513fc1cdf31b73f65e470`. Snapshot antes das alterações.
- Sala reorganizada: vídeo/aulas no início; avaliação e certificados depois. Lista de aulas usa botões acessíveis por teclado; link YouTube é um link próprio. Layout estreito recebeu navegação com quebra de linha e controles adaptáveis.
- Administração de aulas: editar título, URL e descrição mantendo ID e progresso. Excluir uma aula limpa a referência de última aula na atividade.
- Backup: importar por arquivo ou colar JSON, com a mesma validação, limite de 10 MB, confirmação e restauração em falha. O formato v4 e as cinco chaves locais seguem iguais.
- Testes de modelo: `node tests/qa-model.cjs` e `node tests/qa-import.cjs` passaram. QA funcional da nova preview e mobile ainda devem ser registrados na entrega do ciclo.
- Próximo bloco: verificar mobile e reprodução contínua, depois trocar o vídeo de teste infantil por conteúdo técnico público autorizado ou vídeo próprio do criador. Sem banco remoto neste ciclo.
# Ciclo de identidade CONTREM — 12/11/2026

Pedido atual: aplicar a identidade CONTREM Academia ao aplicativo existente. Executado: leitura da última preview e comparação de hash com o pacote; snapshot; entrada em duas colunas; identidade de navegação e dashboard; catálogo com imagem; sala de aula; administração; identidade dos certificados; labels de formulários; preservação de chaves/backup v1–v4. Ver QA específico para limites e próxima preview.

Próximos passos: validar visual com o usuário, receber vídeos técnicos próprios e organizar o primeiro treinamento. Definir depois o banco e a autenticação para uso real por alunos; não conectar serviços automaticamente. Cadastro atual é demonstrativo e local. Produção continua sem autorização neste ciclo.

# Ciclo PWA / produção autorizada — 12/11/2026

Pedido atual: produção em endereço CONTREM Academia e instalação em telefone/computador. Implementado: manifesto, ícones, instalação ou instruções por plataforma, shell offline, indicador de conexão, atualização versionada com recarregamento explícito. Modelo de cursos e backups preservado. Manter a preview anterior como referência de rollback; não criar múltiplas previews para este conjunto.

Próximas etapas: usuário instalar no telefone e validar seu navegador; importar seu backup da preview se necessário; cadastrar conteúdos próprios; decidir autenticação e persistência remota antes de uso por alunos reais. Não apresentar produção como conclusão da autenticação, loja ou certificação verificável.



Atualização de menu 12/11/2026: ADM conectado vê Treinamentos e Alunos em áreas próprias; aluno vê aprendizagem, cursos, desempenho, perfil e certificados. Prévia: https://contrem-academia-preview.vercel.app/ (`dpl_FXAaPEnawfWBbtKoFZuJL6suJtjH`). Produção não alterada. Sintaxe, QA local e HTML remoto 200 passaram; sessão autenticada real não testada.


Acessos por curso (prévia 13/11/2026): consulte `docs/ACESSOS_ACADEMIA_2026-11-13.md`. ADM libera cada curso a aluno ativo; alunos veem somente cursos liberados pelo banco. Produção permanece na versão anterior.


Atualização 13/11/2026: painel visível de backup JSON removido da prévia a pedido do usuário. A persistência normal é Supabase; funções legadas de recuperação permanecem no código por compatibilidade, sem exibição no ADM. O botão de cópia pendente só aparece se houver edição não sincronizada/conflito. Produção não alterada. Prévia `dpl_BDfiJAWAcaQ87PZ4MdGjSZ5V7Bbh`.
