create or replace function academy_private.publish_authoring_draft(p_id uuid,p_revision integer) returns jsonb
language plpgsql security definer set search_path='' as $$
declare d public.academy_authoring_drafts%rowtype; member uuid; c jsonb; snapshot jsonb; mods jsonb; m jsonb; v integer; previous jsonb; cid text; minutes integer; r integer; old_count integer; editor_row public.academy_editor_catalog%rowtype;live_row public.academy_catalog%rowtype;
begin
 select a.id into member from public.academy_members a join auth.users u on u.id=a.user_id
 where a.user_id=auth.uid() and a.active and a.role='admin' and lower(u.email)='vinicius.alves@irmen.com.br';
 if member is null then raise exception 'Somente o ADM Master pode publicar treinamentos.' using errcode='42501';end if;
 select * into d from public.academy_authoring_drafts where id=p_id for update;
 if not found then raise exception 'Treinamento não encontrado.';end if;
 if d.revision<>p_revision then raise exception 'O treinamento mudou. Reabra e revise antes de publicar.' using errcode='40001';end if;
 if d.status<>'reviewed' or d.project->'reviewed' is distinct from 'true'::jsonb then raise exception 'Revise e confirme o conteúdo antes de publicar.';end if;
 mods=d.project->'modules';
 if jsonb_typeof(mods) is distinct from 'array' or jsonb_array_length(mods) not between 1 and 100 then raise exception 'Cadastre de 1 a 100 módulos.';end if;
 for m in select value from jsonb_array_elements(mods) loop
  if jsonb_typeof(m) is distinct from 'object' or nullif(btrim(m->>'title'),'') is null or nullif(btrim(m->>'body'),'') is null or jsonb_typeof(m->'options') is distinct from 'array' or jsonb_array_length(m->'options') not between 2 and 6 or jsonb_typeof(m->'correct') is distinct from 'number' or (m->>'correct')!~'^[0-9]+$' or (m->>'correct')::int >=jsonb_array_length(m->'options') or nullif(btrim(m->>'question'),'') is null then raise exception 'Revise o conteúdo e a avaliação de cada módulo.';end if;
  if exists(select 1 from jsonb_array_elements(m->'options') o where jsonb_typeof(o) is distinct from 'string' or nullif(btrim(o#>>'{}'),'') is null) then raise exception 'Preencha todas as alternativas.';end if;
  if length(m->>'title')>180 or length(m->>'body')>25000 then raise exception 'Conteúdo excede o limite do módulo.';end if;
 end loop;
 if d.project->>'score' is null or d.project->>'attempts' is null or (d.project->>'score')!~'^[0-9]+$' or (d.project->>'score')::int not between 1 and 100 or (d.project->>'attempts')!~'^[0-9]+$' or (d.project->>'attempts')::int not between 1 and 10 then raise exception 'Nota ou tentativas inválidas.';end if;
 if jsonb_typeof(d.project->'interactive') is distinct from 'boolean' or jsonb_typeof(d.project->'quiz') is distinct from 'boolean' then raise exception 'Defina as atividades e a avaliação.';end if;
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

