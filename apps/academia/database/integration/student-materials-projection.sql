-- Student projection: only safe material metadata of an authorized, published course.
-- Actual files require signed URLs and storage RLS.
create or replace function academy_private.project_materials(p_course_id text,p_items jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'id',item->>'id','name',left(coalesce(item->>'name','Material de apoio'),200),
  'type',left(coalesce(item->>'type','application/octet-stream'),150),
  'size',case when jsonb_typeof(item->'size')='number' then item->'size' else '0'::jsonb end
 )),'[]'::jsonb)
 from (
  select item from jsonb_array_elements(case when jsonb_typeof(p_items)='array' then p_items else '[]'::jsonb end) as src(item)
  where item->>'id' ~ ('^'||p_course_id||'/attachment-[0-9a-f-]{36}$')
  limit 20
 ) limited;
$$;
create or replace function academy_private.project_support_links(p_items jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object(
  'title',left(coalesce(item->>'title','Material de apoio'),150),
  'url',left(coalesce(item->>'url',''),2000)
 )),'[]'::jsonb)
 from (
  select item from jsonb_array_elements(case when jsonb_typeof(p_items)='array' then p_items else '[]'::jsonb end) as src(item)
  where item->>'url' ~ '^https://[^@/[:space:]]+(/|$)'
  limit 20
 ) limited;
$$;
revoke all on function academy_private.project_materials(text,jsonb) from public,anon,authenticated;
revoke all on function academy_private.project_support_links(jsonb) from public,anon,authenticated;

-- Preserve published/matriculated whitelist and do not send answer keys to students.
CREATE OR REPLACE FUNCTION academy_private.project_student_course(course jsonb, video_ids jsonb)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
 select case when course->>'status' = 'published' then
  jsonb_build_object(
   'id',course->>'id', 'name',course->>'name',
   'category',coalesce(course->>'category',''),
   'description',coalesce(course->>'description',''),
   'hours',case when jsonb_typeof(course->'hours')='number' then course->'hours' else '8'::jsonb end,
   'photo',coalesce(course->>'photo',''), 'icon',coalesce(course->>'icon',''),
   'format',case when course->>'format'='single' then 'single' else 'series' end,
   'previewMaterials',academy_private.project_materials(course->>'id',course->'previewMaterials'),
   'supportLinks',academy_private.project_support_links(course->'supportLinks'),
   'status','published',
   'lessons',coalesce((
    select jsonb_agg(jsonb_build_object(
     'id',lesson->>'id', 'name',lesson->>'name',
     'description',coalesce(lesson->>'description',''),
     'minutes',case when jsonb_typeof(lesson->'minutes')='number' then lesson->'minutes' else 'null'::jsonb end,
     'url','', 'videoId',video_ids->(lesson->>'id'),
     'previewMaterials',academy_private.project_materials(course->>'id',lesson->'previewMaterials'),
     'supportLinks',academy_private.project_support_links(lesson->'supportLinks')
    ) order by pos)
    from jsonb_array_elements(case when jsonb_typeof(course->'lessons')='array' then course->'lessons' else '[]'::jsonb end)
      with ordinality as source(lesson,pos)
   ),'[]'::jsonb)
  ) else null end;
$function$
;
