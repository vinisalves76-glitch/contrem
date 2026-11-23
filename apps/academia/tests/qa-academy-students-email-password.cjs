'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const ui=fs.readFileSync(path.join(root,'src/assets/cloud-ui.js'),'utf8');
const service=fs.readFileSync(path.join(root,'src/assets/cloud-service.js'),'utf8');
const students=fs.readFileSync(path.join(root,'supabase/functions/academy-students/index.ts'),'utf8');
const programs=fs.readFileSync(path.join(root,'supabase/functions/academy-programs/index.ts'),'utf8');
const source=(start,end)=>{
 const i=ui.indexOf(start),j=ui.indexOf(end,i);
 assert.ok(i>=0&&j>i,'Not found '+start);
 return ui.slice(i,j);
};
test('Consulta de alunos mostra email obtido via Supabase Auth, nunca senhas existentes',()=>{
 assert.match(students,/admin\.auth\.admin\.getUserById\(item\.user_id\)/);
 assert.match(students,/select\('id,user_id,display_name,active,created_at'\)/);
 assert.match(students,/email:authError\?'':String\(auth\?\.user\?\.email\|\|''\)/);
 assert.match(ui,/class="roster-email"/);
 assert.doesNotMatch(students,/select\('.*password/);
});
test('Senha atual não é exposta: somente redefinição pelo ADM Master',()=>{
 assert.match(students,/admin\.auth\.getUser\(token\)/);
 assert.match(students,/\.eq\('role','admin'\)/);
 assert.match(students,/if\(payload\.action==='password_reset'\)/);
 assert.match(students,/\.eq\('role','student'\)\.maybeSingle\(\)/);
 assert.match(students,/admin\.auth\.admin\.updateUserById\(student\.user_id,\{password\}\)/);
 assert.match(students,/return reply\(200,\{memberId,passwordUpdated:true\}\)/);
 assert.doesNotMatch(students,/return reply\(200,\{[^}]*password:/);
});
test('Formulário de nova senha exige confirmação e mostra somente novo segredo',()=>{
 const click=source(" document.getElementById('studentRoster').addEventListener('click',"," document.getElementById('studentForm').onsubmit=");
 assert.match(ui,/data-password-member/);
 assert.match(ui,/data-new-password/);
 assert.match(ui,/data-confirm-password/);
 assert.match(ui,/A senha atual não pode ser consultada/);
 assert.match(click,/value!==confirmPassword\.value/);
 assert.match(click,/service\.resetStudentPassword\(memberId,value\)/);
 assert.match(click,/password\.readOnly=true/);
 assert.match(click,/if\(!isMaster\(\)\|\|mode!=='cloud'\)return/);
 assert.match(service,/return manage\('password_reset',\{memberId,password\}\)/);
});
test('Pré-matrícula em formação de rascunho pode ser marcada, mas não acessada pelo aluno',()=>{
 const roster=source(' async function loadStudentRoster(){'," document.getElementById('studentRoster').addEventListener('change'");
 assert.match(roster,/program\.status==='archived'\?'disabled '/);
 assert.match(roster,/pré-matrícula; acesso somente após publicar/);
 assert.match(programs,/!\['draft','published'\]\.includes\(program\.status\)/);
 const my=programs.slice(programs.indexOf("if(action==='my')"));
 assert.match(my,/p\.status==='published'/);
 assert.match(my,/unpublishedEnrollmentProjection\(p,enrollment,m\.display_name\)/);
 assert.doesNotMatch(my,/\.eq\('status','published'\)/);
 assert.match(programs,/if\(!master\)return reply\(403/);
});
test('Acesso antigo a Cursos Avulsos continua independente das Academias',()=>{
 const serviceRoster=source(' async function loadStudentRoster(){'," document.getElementById('studentRoster').addEventListener('click'");
 assert.match(serviceRoster,/service\.listStudents\(\)/);
 assert.match(serviceRoster,/service\.listAcademyAccess\(\)/);
 assert.match(serviceRoster,/service\.setCourseAccess\(memberId,el\.dataset\.course,enabled\)/);
 assert.match(serviceRoster,/service\.setAcademyAccess\(memberId,el\.dataset\.academy,enabled/);
 assert.match(students,/admin\.from\('academy_course_access'\)/);
 assert.match(programs,/admin.*|db\.from\('academy_program_enrollments'\)/);
});
