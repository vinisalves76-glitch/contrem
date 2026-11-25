# Atualização de arquitetura: camada de conta

cloud-store.js fornece armazenamento com namespace por usuário e preserva chaves legadas na demonstração. cloud-service.js controla login, associação, catálogo/estado com revisão otimista e logout local. cloud-ui.js integra a interface existente, papéis, fila pendente e migração explícita de catálogo. cloud-config.js contém apenas URL/chave pública; vendor/supabase-2.119.0.js e licença são locais. Não publicar fixtures de tests/ no diretório src/. O banco usa academy_members/academy_catalog/academy_learning_state e funções internas academy_private. Avaliação/certificado continuam demonstrativos. Histórico anterior abaixo.

# MAPA_CODIGO — arquitetura localStorage e UI
SPA HTML+CSS+JS inline, sem dependências de banco neste ciclo.
Chaves reais:
KEY='va-academia-catalog-v1'
PK='va-academia-progress-v1'
CK='va-academia-certificates-v1'
PROFILE_KEY='va-academia-profile-v1'
ACTIVITY_KEY='va-academia-activity-v1'
Cursos contêm aulas, avaliação e passScore. Progresso por courseId; tentativas em 'assessment:'+courseId.
Backup JSON {app:'VA Academia',schemaVersion:4,exportedAt,courses,progress,certificates,profile,activity}.
ID video demo nBE8JrByOf0. Funções principais: read,save,esc,videoId,refresh,show,openCourse,isDone,renderClass,chooseLesson,resetForm,editCourse,selectLessons,deleteCourse,deleteLesson,courseDoneCount,latestPassed,renderCertificateList,renderCourseCertificates,issueCertificate,printCertificate,getAssessment,getAttempts,renderAssessment,renderQuestionAdmin,exportBackup,validateBackup,saveProfile,loadProfile,touchCourse,renderHistoryAndPerformance.
Não fazer mudanças de schema sem testar backup/import v1-v4.
# Revisão de 12/11/2026
O app permanece em `src/index.html` com CSS e JS inline. `videoId` agora aceita apenas ID de 11 caracteres ou URL de hosts YouTube explícitos. `validateBackup` verifica IDs seguros e referências cruzadas; `restoreBackup` grava as cinco chaves com tentativa de restauração em falha. `deleteCourse` limpa também `assessment:<id>` e atividade. Certificados impressos mostram DEMONSTRAÇÃO. Testes do modelo em `tests/qa-model.cjs` no pacote de continuidade.

## Ciclo 2
`classView` apresenta `videoLayout` antes de `assessmentPanel` e `certificatePanel`. `editLesson`/`resetLessonForm` atualizam aula preservando ID; `importBackupData` concentra validação, confirmação e restauração para os dois caminhos (`importBackupFile` e `importBackupText`). `tests/qa-import.cjs` verifica schemas v1–v4 e rollback após falha simulada. Nenhuma chave local ou versão de backup mudou.
