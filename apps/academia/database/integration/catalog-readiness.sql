-- Reviewable Academia-only change. Not applied by this file's author.
-- Apply in one reviewed transaction/migration; do not execute historical SQL.
-- Other applications, Auth users and existing catalog data are unchanged.

-- Whitelist projection: adding a field to the authoring JSON does not expose it
-- automatically to learners. The video map is supplied from academy_videos,
-- never from a playback ID / URL supplied by the catalog JSON.
create or replace function academy_private.project_student_course(course jsonb, video_ids jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $function$
 select case when course->>'status' = 'published' then
  jsonb_build_object(
   'id',course->>'id', 'name',course->>'name',
   'category',coalesce(course->>'category',''),
   'description',coalesce(course->>'description',''),
   'hours',case when jsonb_typeof(course->'hours')='number' then course->'hours' else '8'::jsonb end,
   'photo',coalesce(course->>'photo',''), 'icon',coalesce(course->>'icon',''),
   'format',case when course->>'format'='single' then 'single' else 'series' end,
   'status','published',
   'lessons',coalesce((
    select jsonb_agg(jsonb_build_object(
     'id',lesson->>'id', 'name',lesson->>'name',
     'description',coalesce(lesson->>'description',''),
     'minutes',case when jsonb_typeof(lesson->'minutes')='number' then lesson->'minutes' else 'null'::jsonb end,
     'url','', 'videoId',video_ids->(lesson->>'id')
    ) order by pos)
    from jsonb_array_elements(case when jsonb_typeof(course->'lessons')='array' then course->'lessons' else '[]'::jsonb end)
      with ordinality as source(lesson,pos)
   ),'[]'::jsonb)
  ) else null end;
$function$;

-- Internal helper only: do not create an additional callable public RPC.
revoke all on function academy_private.project_student_course(jsonb,jsonb) from public,anon,authenticated;

-- CREATE OR REPLACE preserves the existing RPC owner and EXECUTE grants.
-- The existing function is callable by authenticated, not anon.
create or replace function public.academy_my_catalog()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
 with identity as materialized (
  select academy_private.current_member_id() as member_id,
         academy_private.is_admin() as is_admin
 )
 select jsonb_build_object('id','main','revision',c.revision,'courses',coalesce((
  select jsonb_agg(academy_private.project_student_course(course,coalesce((
   select jsonb_object_agg(v.lesson_id,to_jsonb(v.id))
   from public.academy_videos v
   where v.course_id=course->>'id' and v.status='published'
  ),'{}'::jsonb)) order by pos)
  from jsonb_array_elements(c.courses) with ordinality as items(course,pos)
  where course->>'status'='published'
    and exists(select 1 from public.academy_course_access a
     where a.member_id=identity.member_id and a.course_id=course->>'id')
 ),'[]'::jsonb))
 from public.academy_catalog c cross join identity
 where c.id='main' and identity.member_id is not null and not identity.is_admin;
$function$;
