begin;
do $$
declare uid uuid;mid uuid;did uuid:=gen_random_uuid();cid text;r jsonb;v jsonb;before_catalog jsonb;old_editor jsonb;p jsonb;rev integer;request_id uuid:=gen_random_uuid();
begin
 select user_id,id into uid,mid from public.academy_members where role='admin' and active limit 1;
 if uid is null then raise exception 'No admin available for transactional QA';end if;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 select courses into before_catalog from public.academy_catalog where id='main';
 select courses into old_editor from public.academy_editor_catalog where id='main';
 p=jsonb_build_object('reviewed',true,'modules',jsonb_build_array(
 jsonb_build_object('title','M1','goal','G','body','Texto 1','question','Q1','options',jsonb_build_array('A','B'),'correct',0),
 jsonb_build_object('title','M2','goal','G','body','Texto 2','question','Q2','options',jsonb_build_array('A','B'),'correct',1)
 ),'score',80,'attempts',2,'interactive',true,'quiz',true);
 insert into public.academy_authoring_drafts(id,title,project,status,created_by) values(did,'QA publicação SCORM',p,'reviewed',uid);
 r=public.academy_publish_authoring_draft(did,0);cid=r->>'courseId';
 if r->>'status'<>'published' then raise exception 'Publication failed';end if;
 if not exists(select 1 from public.academy_editor_catalog c,jsonb_array_elements(c.courses)a where c.id='main' and a->>'id'=cid and a->>'status'='published') then raise exception 'Missing ADM course';end if;
 if before_catalog is distinct from (select coalesce(jsonb_agg(a order by ord),'[]'::jsonb) from public.academy_catalog c,jsonb_array_elements(c.courses) with ordinality t(a,ord) where c.id='main' and a->>'id'<>cid) then raise exception 'Existing live courses changed';end if;
 if old_editor is distinct from (select coalesce(jsonb_agg(a order by ord),'[]'::jsonb) from public.academy_editor_catalog c,jsonb_array_elements(c.courses) with ordinality t(a,ord) where c.id='main' and a->>'id'<>cid) then raise exception 'Existing ADM courses changed';end if;
 r=public.academy_publish_authoring_draft(did,(r->>'draftRevision')::int);
 if (select count(*) from public.academy_scorm_publications where course_id=cid)<>1 then raise exception 'Duplicate version';end if;
 update public.academy_members set role='student' where id=mid;
 begin perform public.academy_scorm_runtime(cid,'load');raise exception 'Unenrolled student gained access';exception when insufficient_privilege then null;end;
 insert into public.academy_course_access(member_id,course_id,granted_by) values(mid,cid,mid);
 r=public.academy_scorm_runtime(cid,'load');
 if r->'content'->'modules'->0 ? 'correct' then raise exception 'Answer key leaked';end if;
 v=public.academy_my_catalog();
 if not exists(select 1 from jsonb_array_elements(v->'courses')a where a->>'id'=cid) then raise exception 'Course absent from student catalog';end if;
 begin perform public.academy_scorm_runtime(cid,'complete',0);raise exception 'Unanswered module accepted';exception when raise_exception then if sqlerrm='Unanswered module accepted' then raise;end if;end;
 r=public.academy_scorm_runtime(cid,'decision',0,'0'::jsonb);r=public.academy_scorm_runtime(cid,'complete',0);
 r=public.academy_scorm_runtime(cid,'decision',1,'1'::jsonb);r=public.academy_scorm_runtime(cid,'complete',1);
 r=public.academy_scorm_runtime(cid,'exam',null,'[0,0]'::jsonb,request_id);
 if r->>'attempts'<>'1' or r->>'score'<>'50' or r->>'passed'<>'false' then raise exception 'Incorrect exam grade';end if;
 r=public.academy_scorm_runtime(cid,'exam',null,'[0,0]'::jsonb,request_id);
 if r->>'attempts'<>'1' then raise exception 'Retry consumed another attempt';end if;
 begin
 r=public.academy_scorm_runtime(cid,'exam',null,'[0,0]'::jsonb,gen_random_uuid());
 begin
  perform public.academy_scorm_runtime(cid,'exam',null,'[0,1]'::jsonb,gen_random_uuid());
  raise exception 'Third attempt accepted';
 exception when raise_exception then
  if sqlerrm='Third attempt accepted' or sqlerrm not like 'Tentativas esgotadas%' then raise;end if;
 end;
 raise no_data_found;
exception when no_data_found then null;end;
update public.academy_learning_state set progress=jsonb_set(progress,array[cid],jsonb_build_array('scorm-lesson-'||did::text),true) where member_id=mid;
if exists(select 1 from public.academy_learning_state where member_id=mid and progress->cid ? ('scorm-lesson-'||did::text)) then raise exception 'Self-reported completion bypassed server grade';end if;
r=public.academy_scorm_runtime(cid,'exam',null,'[0,1]'::jsonb,gen_random_uuid());
 if r->>'attempts'<>'2' or r->>'score'<>'100' or r->>'passed'<>'true' then raise exception 'Passing result invalid';end if;
 if not exists(select 1 from public.academy_learning_state where member_id=mid and progress->cid ? ('scorm-lesson-'||did::text)) then raise exception 'Academia progress not recorded';end if;
 update public.academy_members set role='admin' where id=mid;
 update public.academy_authoring_drafts set project=jsonb_set(project,'{modules,0,body}','"Nova versão"'::jsonb) where id=did returning revision into rev;
 v=public.academy_publish_authoring_draft(did,rev);
 if v->>'version'<>'2' then raise exception 'New snapshot version missing';end if;
 update public.academy_members set role='student' where id=mid;
 r=public.academy_scorm_runtime(cid,'load');
 if r->>'version'<>'1' or r->>'passed'<>'true' then raise exception 'Republish reset learner history';end if;
 delete from public.academy_course_access where member_id=mid and course_id=cid;
 begin perform public.academy_scorm_runtime(cid,'load');raise exception 'Revoked enrollment still accessible';exception when insufficient_privilege then null;end;
 update public.academy_members set role='content_admin' where id=mid;
 begin perform public.academy_publish_authoring_draft(did,(v->>'draftRevision')::int);raise exception 'Staff published';exception when insufficient_privilege then null;end;
 r=public.academy_scorm_runtime(cid,'load');
 if r->>'preview'<>'true' then raise exception 'Missing staff preview';end if;
end $$;
select 'PASS: publication in ADM and live catalog, existing courses preserved, enrollment gate, redacted answers, module sequence, exam grading/idempotency, account progress, immutable versions and staff restrictions' as result;
rollback;