'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ui=fs.readFileSync(path.resolve(__dirname,'../src/assets/cloud-ui.js'),'utf8');
const cloud=fs.readFileSync(path.resolve(__dirname,'../src/assets/cloud-service.js'),'utf8');
const api=fs.readFileSync(path.resolve(__dirname,'../supabase/functions/academy-programs/index.ts'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../src/assets/academy-connected-ui.css'),'utf8');
const get=(source,start,end)=>{
 const i=source.indexOf(start),j=source.indexOf(end,i);
 assert.ok(i>=0&&j>i,'No handler: '+start);return source.slice(i,j);
};
test('Preserva cursos avulsos e exibe Academias com consulta independente',()=>{
 const functionCode=get(ui,' async function loadStudentRoster(){'," document.getElementById('studentRoster').addEventListener('change'");
 assert.match(functionCode,/service\.listStudents\(\)/);
 assert.match(functionCode,/service\.listAcademyAccess\(\)/);
 assert.match(functionCode,/data-course=/);
 assert.match(functionCode,/data-academy=/);
 assert.match(functionCode,/Cursos Avulsos/);
 assert.match(functionCode,/Academias/);
 assert.match(functionCode,/academyError/);
});
test('Permite pré-matrícula em rascunho mas bloqueia Academias arquivadas e alunos inativos',()=>{
 const roster=get(ui,' async function loadStudentRoster(){'," document.getElementById('studentRoster').addEventListener('change'");
 assert.match(roster,/!member\.active\|\|program\.status==='archived'\?'disabled '/);
 assert.match(roster,/program\.status==='published'/);
 assert.match(roster,/enrollment\?\.active===true/);
 assert.match(roster,/matrícula vencida/);
});
test('Alternar acesso preserva operações de Curso Avulso e usa matrícula própria para Academia',()=>{
 const handler=get(ui," document.getElementById('studentRoster').addEventListener('change',"," document.getElementById('studentRoster').addEventListener('click',");
 assert.match(handler,/service\.setCourseAccess\(memberId,el\.dataset\.course,enabled\)/);
 assert.match(handler,/service\.setAcademyAccess\(memberId,el\.dataset\.academy,enabled,el\.dataset\.expires\|\|''\)/);
 assert.match(handler,/if\(!isMaster\(\)\)throw Error/);
 assert.match(handler,/el\.checked=!enabled/);
 assert.match(handler,/finally\{el\.disabled=false;\}/);
});
test('Service continua usando academy-students para Cursos Avulsos e API separada de Academias',()=>{
 assert.match(cloud,/return admin\(\)\?manage\('list'\):workspace\('list_students'\)/);
 assert.match(cloud,/manage\('access',\{memberId,courseId,enabled\}\)/);
 assert.match(cloud,/client\.functions\.invoke\('academy-programs'/);
 assert.match(cloud,/async listAcademyAccess\(\)\{return academyAccess\('students'\);\}/);
 assert.match(cloud,/async setAcademyAccess\(/);
 assert.match(cloud,/if\(!admin\(\)\)throw Error\('Somente o ADM Master/);
});
test('Backend só retorna título, estado e IDs das Academias para ADM Master',()=>{
 const block=get(api,"  if(action==='students'){","  if(action==='enroll'){");
 assert.match(block,/if\(!master\)return reply\(403/);
 assert.match(block,/select\('id,title,status'\)/);
 assert.match(block,/select\('program_id,member_id,active,expires_on'\)/);
 assert.match(block,/enrollments:enrollments\|\|\[\],programs:available\|\|\[\]/);
 assert.doesNotMatch(block,/select\('[^']*definition/);
});
test('Estilo responsivo mantém seções separadas por aluno',()=>{
 assert.match(css,/#studentRoster \.access-roster-groups/);
 assert.match(css,/#studentRoster \.access-roster-option/);
 assert.match(css,/@media\(max-width:860px\)/);
});
