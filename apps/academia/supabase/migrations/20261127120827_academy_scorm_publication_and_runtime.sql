
create table public.academy_scorm_publications (
 course_id text not null, version integer not null check(version>0),
 draft_id uuid not null references public.academy_authoring_drafts(id),
 content jsonb not null, published_by uuid not null, published_at timestamptz not null default now(),
 primary key(course_id,version)
);
alter table public.academy_scorm_publications enable row level security;
revoke all on public.academy_scorm_publications from public,anon,authenticated;
create table public.academy_scorm_learning (
 member_id uuid not null references public.academy_members(id),course_id text not null, version integer not null,
 completed_modules integer not null default 0,activities jsonb not null default '{}'::jsonb,
 attempts integer not null default 0, score integer,passed boolean not null default false,
 last_exam_request uuid,updated_at timestamptz not null default now(),
 primary key(member_id,course_id),
 foreign key(course_id,version) references public.academy_scorm_publications(course_id,version)
);
alter table public.academy_scorm_learning enable row level security;
revoke all on public.academy_scorm_learning from public,anon,authenticated;
alter table public.academy_authoring_drafts add column published_course_id text,add column published_revision integer,add column published_at timestamptz;

create function academy_private.publish_authoring_draft(p_id uuid,p_revision integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d public.academy_authoring_drafts%rowtype; member uuid; c jsonb; snapshot jsonb; mods jsonb; m jsonb; v integer; previous jsonb; cid text; minutes integer; r integer; old_count integer; editor_row public.academy_editor_catalog%rowtype;live_row public.academy_catalog%rowtype;
begin
 select a.id into member from public.academy_members a join auth.users u on u.id=a.user_id
 where a.user_id=auth.uid() and a.active and a.role='admin' and lower(u.email)='vinicius.alves@irmen.com.br';
 if member is null then raise exception 'Somente o ADM Master pode publicar treinamentos.' using errcode='42501';end if;
 select * into d from public.academy_authoring_drafts where id=p_id for update;
 if not found then raise exception 'Treinamento não encontrado.';end if;
 if d.revision<>p_revision then raise exception 'O treinamento mudou. Reabra e revise antes de publicar.' using errcode='40001';end if;
 if d.status<>'reviewed' or d.project->'reviewed'<>'true'::jsonb then raise exception 'Revise e confirme o conteúdo antes de publicar.';end if;
 mods=d.project->'modules';
 if jsonb_typeof(mods)<>'array' or jsonb_array_length(mods) not between 1 and 100 then raise exception 'Cadastre de 1 a 100 módulos.';end if;
 for m in select value from jsonb_array_elements(mods) loop
  if jsonb_typeof(m)<>'object' or nullif(btrim(m->>'title'),'') is null or nullif(btrim(m->>'body'),'') is null or jsonb_typeof(m->'options')<>'array' or jsonb_array_length(m->'options') not between 2 and 6 or jsonb_typeof(m->'correct')<>'number' or (m->>'correct')!~'^[0-9]+$' or (m->>'correct')::int >=jsonb_array_length(m->'options') or nullif(btrim(m->>'question'),'') is null then raise exception 'Revise o conteúdo e a avaliação de cada módulo.';end if;
  if exists(select 1 from jsonb_array_elements(m->'options') o where jsonb_typeof(o)<>'string' or nullif(btrim(o#>>'{}'),'') is null) then raise exception 'Preencha todas as alternativas.';end if;
  if length(m->>'title')>180 or length(m->>'body')>25000 then raise exception 'Conteúdo excede o limite do módulo.';end if;
 end loop;
 if (d.project->>'score')!~'^[0-9]+$' or (d.project->>'score')::int not between 1 and 100 or (d.project->>'attempts')!~'^[0-9]+$' or (d.project->>'attempts')::int not between 1 and 10 then raise exception 'Nota ou tentativas inválidas.';end if;
 if jsonb_typeof(d.project->'interactive')<>'boolean' or jsonb_typeof(d.project->'quiz')<>'boolean' then raise exception 'Defina as atividades e a avaliação.';end if;
 snapshot=jsonb_build_object('title',d.title,'theme',coalesce(d.project->>'theme','contrem'),'score',(d.project->>'score')::int,'attempts',(d.project->>'attempts')::int,'interactive',d.project->'interactive','quiz',d.project->'quiz','modules',(select jsonb_agg(jsonb_build_object('title',a->>'title','goal',a->>'goal','body',a->>'body','question',a->>'question','options',a->'options','correct',a->'correct','image',case when a->>'image' like 'https://%' then a->>'image' else '' end) order by ord) from jsonb_array_elements(mods) with ordinality t(a,ord)));
 cid='scorm-'||p_id::text;
 select version,content into v,previous from public.academy_scorm_publications where course_id=cid order by version desc limit 1;
 if previous is distinct from snapshot then
  v=coalesce(v,0)+1;insert into public.academy_scorm_publications(course_id,version,draft_id,content,published_by) values(cid,v,p_id,snapshot,auth.uid());
 end if;
 minutes=case when d.project->>'duration'='2 horas' then 120 when d.project->>'duration'='1 hora' then 60 when d.project->>'duration'='20 minutos' then 20 else 45 end;
 c=jsonb_build_object('id',cid,'name',d.title,'category','Treinamentos interativos','description','Treinamento interativo com atividades, conteúdo técnico e avaliação.','hours',greatest(1,ceil(minutes/60.0)::int),'icon','✦','photo',case when mods->0->>'image' like 'https://%' then mods->0->>'image' else '' end,'format','single','status','published','scormVersion',v,'authoringId',p_id,'lessons',jsonb_build_array(jsonb_build_object('id','scorm-lesson-'||p_id::text,'name',d.title,'description','Abra o treinamento e conclua as atividades para registrar seu progresso.','url','','minutes',minutes)));
 select * into editor_row from public.academy_editor_catalog where id='main' for update;
 if not found then raise exception 'Catálogo administrativo indisponível.';end if;
 select * into live_row from public.academy_catalog where id='main' for update;
 if not found then raise exception 'Catálogo de cursos indisponível.';end if;
 update public.academy_editor_catalog set courses=coalesce((select jsonb_agg(case when a->>'id'=cid then c else a end order by ord) from jsonb_array_elements(editor_row.courses) with ordinality t(a,ord)),'[]'::jsonb)||case when exists(select 1 from jsonb_array_elements(editor_row.courses) a where a->>'id'=cid) then '[]'::jsonb else jsonb_build_array(c) end,revision=revision+1,updated_by=member,updated_at=now() where id='main';
 update public.academy_catalog set courses=coalesce((select jsonb_agg(case when a->>'id'=cid then c else a end order by ord) from jsonb_array_elements(live_row.courses) with ordinality t(a,ord)),'[]'::jsonb)||case when exists(select 1 from jsonb_array_elements(live_row.courses) a where a->>'id'=cid) then '[]'::jsonb else jsonb_build_array(c) end,revision=revision+1,updated_by=member,updated_at=now() where id='main';
 update public.academy_authoring_drafts set published_course_id=cid,published_revision=p_revision,published_at=now() where id=p_id returning revision into r;
 return jsonb_build_object('courseId',cid,'version',v,'draftRevision',r,'status','published');
end $$;

create function academy_private.scorm_runtime(p_course_id text,p_action text,p_index integer,p_answers jsonb,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare member public.academy_members%rowtype; live jsonb; pub public.academy_scorm_publications%rowtype; st public.academy_scorm_learning%rowtype; n integer; correct integer; i integer; choice integer; good boolean; was_passed boolean; preview boolean; result jsonb; lid text;
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
revoke all on function academy_private.publish_authoring_draft(uuid,integer) from public,anon;
revoke all on function academy_private.scorm_runtime(text,text,integer,jsonb,uuid) from public,anon;
grant usage on schema academy_private to authenticated;
grant execute on function academy_private.publish_authoring_draft(uuid,integer),academy_private.scorm_runtime(text,text,integer,jsonb,uuid) to authenticated;
create function public.academy_publish_authoring_draft(p_id uuid,p_revision integer) returns jsonb language sql security invoker set search_path='' as $$select academy_private.publish_authoring_draft(p_id,p_revision)$$;
create function public.academy_scorm_runtime(p_course_id text,p_action text default 'load',p_index integer default null,p_answers jsonb default null,p_request_id uuid default null) returns jsonb language sql security invoker set search_path='' as $$select academy_private.scorm_runtime(p_course_id,p_action,p_index,p_answers,p_request_id)$$;
revoke all on function public.academy_publish_authoring_draft(uuid,integer),public.academy_scorm_runtime(text,text,integer,jsonb,uuid) from public,anon;
grant execute on function public.academy_publish_authoring_draft(uuid,integer),public.academy_scorm_runtime(text,text,integer,jsonb,uuid) to authenticated;
notify pgrst,'reload schema';
