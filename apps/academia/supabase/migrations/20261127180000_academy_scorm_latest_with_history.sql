-- Matrículas sempre carregam a publicação corrente. Mudanças incompatíveis arquivam
-- o histórico anterior antes de reiniciar o progresso da versão nova.
create table public.academy_scorm_learning_history (
 id bigint generated always as identity primary key,
 member_id uuid not null references public.academy_members(id),
 course_id text not null,
 version integer not null,
 completed_modules integer not null,
 activities jsonb not null,
 attempts integer not null,
 score integer,
 passed boolean not null,
 last_exam_request uuid,
 last_updated_at timestamptz not null,
 archived_at timestamptz not null default now(),
 foreign key(course_id,version) references public.academy_scorm_publications(course_id,version),
 unique(member_id,course_id,version)
);
alter table public.academy_scorm_learning_history enable row level security;
revoke all on public.academy_scorm_learning_history from public,anon,authenticated;

create or replace function academy_private.scorm_runtime(p_course_id text,p_action text,p_index integer,p_answers jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare member public.academy_members%rowtype; live jsonb; pub public.academy_scorm_publications%rowtype; st public.academy_scorm_learning%rowtype; n integer; correct integer; i integer; choice integer; good boolean; was_passed boolean; preview boolean; result jsonb; lid text; old_content jsonb; new_content jsonb;
begin
 select * into member from public.academy_members where user_id=auth.uid() and active;
 if not found then raise exception 'Entre com uma conta ativa da Academia.' using errcode='42501';end if;
 preview=member.role in ('admin','content_admin');
 select a into live from public.academy_catalog c,jsonb_array_elements(c.courses) a where c.id='main' and a->>'id'=p_course_id and a->>'status'='published';
 if live is null then raise exception 'Treinamento não publicado ou indisponível.' using errcode='42501';end if;
 if not preview and not exists(select 1 from public.academy_course_access where member_id=member.id and course_id=p_course_id) then raise exception 'Sua matrícula neste curso não está liberada.' using errcode='42501';end if;
 if preview then
  if p_action<>'load' then raise exception 'A prévia administrativa não registra avaliações de alunos.' using errcode='42501';end if;
  select * into pub from public.academy_scorm_publications where course_id=p_course_id and version=(live->>'scormVersion')::int;
  if not found then raise exception 'Conteúdo interativo indisponível.';end if;
  result=jsonb_build_object('completed',0,'activities','{}'::jsonb,'attempts',0,'score',null,'passed',false,'preview',true);
 else
  insert into public.academy_scorm_learning(member_id,course_id,version) values(member.id,p_course_id,(live->>'scormVersion')::int) on conflict(member_id,course_id) do nothing;
  select * into st from public.academy_scorm_learning where member_id=member.id and course_id=p_course_id for update;
  if st.version<>(live->>'scormVersion')::int then
   select content into old_content from public.academy_scorm_publications where course_id=p_course_id and version=st.version;
   select content into new_content from public.academy_scorm_publications where course_id=p_course_id and version=(live->>'scormVersion')::int;
   if new_content is null then raise exception 'Versão publicada indisponível.';end if;
   if old_content - 'modules' = new_content - 'modules' and
      (select jsonb_agg(m-'videoPlaybackId'-'videoPosition' order by ord) from jsonb_array_elements(old_content->'modules') with ordinality t(m,ord))
      is not distinct from
      (select jsonb_agg(m-'videoPlaybackId'-'videoPosition' order by ord) from jsonb_array_elements(new_content->'modules') with ordinality t(m,ord)) then
    -- Only video/position changed; keep the learning state.
    update public.academy_scorm_learning set version=(live->>'scormVersion')::int,updated_at=now()
    where member_id=member.id and course_id=p_course_id;
    st.version=(live->>'scormVersion')::int;
   else
    -- Do not apply an action submitted from an older lesson to different content.
    if p_action<>'load' then raise exception 'O treinamento foi atualizado. Reabra a aula para carregar a nova versão.';end if;
    if st.completed_modules>0 or st.attempts>0 or st.activities<>'{}'::jsonb or st.passed or st.score is not null then
     insert into public.academy_scorm_learning_history
      (member_id,course_id,version,completed_modules,activities,attempts,score,passed,last_exam_request,last_updated_at)
     values (st.member_id,st.course_id,st.version,st.completed_modules,st.activities,st.attempts,st.score,st.passed,st.last_exam_request,st.updated_at)
     on conflict(member_id,course_id,version) do nothing;
    end if;
    update public.academy_scorm_learning set version=(live->>'scormVersion')::int,
     completed_modules=0,activities='{}'::jsonb,attempts=0,score=null,passed=false,last_exam_request=null,updated_at=now()
     where member_id=member.id and course_id=p_course_id;
    update public.academy_learning_state set progress=jsonb_set(coalesce(progress,'{}'::jsonb),array[p_course_id],'[]'::jsonb,true)
     where member_id=member.id and coalesce(progress,'{}'::jsonb) ? p_course_id;
    select * into st from public.academy_scorm_learning where member_id=member.id and course_id=p_course_id;
   end if;
  end if;
  select * into pub from public.academy_scorm_publications where course_id=p_course_id and version=st.version;
  if not found then raise exception 'Versão do treinamento indisponível.';end if;
  n=jsonb_array_length(pub.content->'modules');was_passed=st.passed;
  if p_action='decision' then
   if p_index is distinct from st.completed_modules or p_index>=n or jsonb_typeof(p_answers)<>'number' then raise exception 'Atividade fora da sequência.';end if;
   if p_answers::text!~'^[0-9]+$' then raise exception 'Alternativa inválida.';end if;
   choice=p_answers::text::int;
   if choice not between 0 and jsonb_array_length(pub.content->'modules'->p_index->'options')-1 then raise exception 'Alternativa inválida.';end if;
   good=choice=(pub.content->'modules'->p_index->>'correct')::int;
   if good then st.activities=jsonb_set(st.activities,array[p_index::text],'true'::jsonb,true);end if;
  elsif p_action='complete' then
   if p_index is null or p_index<0 or p_index>st.completed_modules or p_index>=n then raise exception 'Conclua os módulos na ordem.';end if;
   if p_index=st.completed_modules then
    if pub.content->'interactive'='true'::jsonb and coalesce(st.activities->p_index::text,'false'::jsonb)<>'true'::jsonb then raise exception 'Conclua a atividade antes de avançar.';end if;
    st.completed_modules=st.completed_modules+1;
   end if;
   if st.completed_modules=n and pub.content->'quiz'='false'::jsonb then st.passed=true;end if;
  elsif p_action='exam' then
   if p_request_id is null then raise exception 'Identificador da tentativa obrigatório.';end if;
   if not st.passed and st.last_exam_request is distinct from p_request_id then
    if st.completed_modules<>n then raise exception 'Conclua os módulos antes da avaliação.';end if;
    if st.attempts>=(pub.content->>'attempts')::int then raise exception 'Tentativas esgotadas. Solicite análise ao ADM.';end if;
    if jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>n then raise exception 'Responda todas as questões.';end if;
    correct=0;
    for i in 0..n-1 loop
     if jsonb_typeof(p_answers->i)<>'number' or (p_answers->>i)!~'^[0-9]+$' then raise exception 'Alternativa inválida.';end if;
     choice=(p_answers->>i)::int;
     if choice not between 0 and jsonb_array_length(pub.content->'modules'->i->'options')-1 then raise exception 'Alternativa inválida.';end if;
     if choice=(pub.content->'modules'->i->>'correct')::int then correct=correct+1;end if;
    end loop;
    st.attempts=st.attempts+1;st.score=round(correct*100.0/n)::int;st.passed=st.score>=(pub.content->>'score')::int;st.last_exam_request=p_request_id;
   end if;
  elsif p_action<>'load' then raise exception 'Ação não disponível.';end if;
  if p_action<>'load' then
   update public.academy_scorm_learning set completed_modules=st.completed_modules,activities=st.activities,attempts=st.attempts,score=st.score,passed=st.passed,last_exam_request=st.last_exam_request,updated_at=now() where member_id=member.id and course_id=p_course_id;
  end if;
  if st.passed and not was_passed then
   lid='scorm-lesson-'||pub.draft_id::text;
   update public.academy_learning_state set progress=jsonb_set(coalesce(progress,'{}'::jsonb),array[p_course_id],coalesce(progress->p_course_id,'[]'::jsonb)||case when coalesce(progress->p_course_id,'[]'::jsonb)?lid then '[]'::jsonb else jsonb_build_array(lid) end,true) where member_id=member.id;
  end if;
  result=jsonb_build_object('completed',st.completed_modules,'activities',st.activities,'attempts',st.attempts,'score',st.score,'passed',st.passed,'preview',false);
 end if;
 return result||jsonb_build_object('courseId',p_course_id,'version',pub.version,'correctDecision',good,'content',jsonb_set(pub.content,'{modules}',(select jsonb_agg(a-'correct' order by ord) from jsonb_array_elements(pub.content->'modules') with ordinality t(a,ord))));
end $$;
