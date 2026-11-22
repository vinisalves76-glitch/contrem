-- Proposed Academia-only RPC. Review and test in a rolled-back transaction first.
-- Existing rows, certificates, assessments and unrelated modules are preserved.
create or replace function academy_private.merge_learning_payload(
 existing_state jsonb, allowed_courses jsonb,
 next_profile jsonb, next_progress jsonb, next_activity jsonb
) returns jsonb
language plpgsql
stable
set search_path = ''
as $function$
declare
 result_profile jsonb := coalesce(existing_state->'profile','{}'::jsonb);
 result_progress jsonb := coalesce(existing_state->'progress','{}'::jsonb);
 result_activity jsonb := coalesce(existing_state->'activity','{}'::jsonb);
 field text; course jsonb; course_id text; value jsonb; item jsonb;
 merged_item jsonb; completed jsonb; lesson_id text;
begin
 if jsonb_typeof(next_profile) is distinct from 'object'
    or jsonb_typeof(next_progress) is distinct from 'object'
    or jsonb_typeof(next_activity) is distinct from 'object'
    or jsonb_typeof(allowed_courses) is distinct from 'array' then
  raise exception using errcode='22023',message='Invalid learning payload';
 end if;
 if octet_length(next_profile::text)+octet_length(next_progress::text)+octet_length(next_activity::text)>262144 then
  raise exception using errcode='22023',message='Learning payload too large';
 end if;
 foreach field in array array['fullName','email','company','role'] loop
  if next_profile ? field then
   value := next_profile->field;
   if jsonb_typeof(value) is distinct from 'string'
      or length(value#>>'{}')>(case when field='email' then 320 else 200 end) then
    raise exception using errcode='22023',message='Invalid display profile';
   end if;
   result_profile := jsonb_set(result_profile,array[field],value,true);
  end if;
 end loop;
 for course in select * from jsonb_array_elements(allowed_courses) loop
  course_id := course->>'id';
  if course_id is null or course_id like 'assessment:%' then continue; end if;
  if next_progress ? course_id then
   value := next_progress->course_id;
   if jsonb_typeof(value) is distinct from 'array' then
    raise exception using errcode='22023',message='Invalid course progress';
   end if;
   -- Unknown lesson IDs and duplicates are excluded. An explicit empty array
   -- clears this course's self-reported marks only, never its exam history.
   select coalesce(jsonb_agg(to_jsonb(mark.id) order by mark.pos),'[]'::jsonb) into completed
   from (
    select entry#>>'{}' as id,min(pos) as pos
    from jsonb_array_elements(value) with ordinality as marks(entry,pos)
    where jsonb_typeof(entry)='string' and exists(
     select 1 from jsonb_array_elements(case when jsonb_typeof(course->'lessons')='array' then course->'lessons' else '[]'::jsonb end) lesson
     where lesson->>'id'=entry#>>'{}'
    ) group by entry#>>'{}'
   ) mark;
   result_progress := jsonb_set(result_progress,array[course_id],completed,true);
  end if;
  if next_activity ? course_id then
   item := next_activity->course_id;
   if jsonb_typeof(item) is distinct from 'object' then
    raise exception using errcode='22023',message='Invalid course activity';
   end if;
   merged_item := case when jsonb_typeof(result_activity->course_id)='object' then result_activity->course_id else '{}'::jsonb end;
   if item ? 'lastOpenedAt' then
    if jsonb_typeof(item->'lastOpenedAt') is distinct from 'string'
       or length(item->>'lastOpenedAt')>100
       or (item->>'lastOpenedAt') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$' then
     raise exception using errcode='22023',message='Invalid activity timestamp';
    end if;
    perform (item->>'lastOpenedAt')::timestamptz;
    merged_item := jsonb_set(merged_item,'{lastOpenedAt}',item->'lastOpenedAt',true);
   end if;
   if item ? 'lastLessonId' then
    lesson_id := item->>'lastLessonId';
    if item->'lastLessonId'<>'null'::jsonb and (
     jsonb_typeof(item->'lastLessonId') is distinct from 'string' or not exists(
      select 1 from jsonb_array_elements(case when jsonb_typeof(course->'lessons')='array' then course->'lessons' else '[]'::jsonb end) lesson
      where lesson->>'id'=lesson_id
     )) then
     raise exception using errcode='22023',message='Invalid activity lesson';
    end if;
    merged_item := jsonb_set(merged_item,'{lastLessonId}',item->'lastLessonId',true);
   end if;
   result_activity := jsonb_set(result_activity,array[course_id],merged_item,true);
  end if;
 end loop;
 return jsonb_build_object('profile',result_profile,'progress',result_progress,'activity',result_activity);
end;
$function$;
revoke all on function academy_private.merge_learning_payload(jsonb,jsonb,jsonb,jsonb,jsonb) from public,anon,authenticated;

create or replace function public.academy_save_learning(
 p_profile jsonb,p_progress jsonb,p_activity jsonb,p_revision bigint
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
 v_member_id uuid := academy_private.current_member_id();
 state public.academy_learning_state%rowtype;
 allowed_courses jsonb; patched jsonb; next_revision bigint;
begin
 if v_member_id is null then
  raise exception using errcode='42501',message='Academy access required';
 end if;
 if p_revision is null or p_revision<0 then
  raise exception using errcode='22023',message='Invalid revision';
 end if;
 select s.* into state from public.academy_learning_state s
 where s.member_id=v_member_id and s.revision=p_revision for update;
 if not found then return null; end if;
 select coalesce(jsonb_agg(course),'[]'::jsonb) into allowed_courses
 from public.academy_catalog c
 cross join lateral jsonb_array_elements(c.courses) as items(course)
 where c.id='main' and course->>'status'='published'
   and (academy_private.is_admin() or exists(
    select 1 from public.academy_course_access a
    where a.member_id=v_member_id and a.course_id=course->>'id'
   ));
 patched := academy_private.merge_learning_payload(to_jsonb(state),allowed_courses,p_profile,p_progress,p_activity);
 -- Never replace the certificates column or any assessment:* / assessments key.
 update public.academy_learning_state s
 set profile=patched->'profile',progress=patched->'progress',activity=patched->'activity'
 where s.member_id=v_member_id and s.revision=p_revision
 returning s.revision into next_revision;
 if not found then return null; end if;
 return jsonb_build_object('revision',next_revision);
end;
$function$;
revoke all on function public.academy_save_learning(jsonb,jsonb,jsonb,bigint) from public,anon,authenticated;
grant execute on function public.academy_save_learning(jsonb,jsonb,jsonb,bigint) to authenticated;
