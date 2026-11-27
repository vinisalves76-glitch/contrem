create function academy_private.protect_scorm_progress() returns trigger language plpgsql security definer set search_path='' as $$
declare k text; did uuid;done boolean;
begin
 for k in select key from jsonb_object_keys(coalesce(new.progress,'{}'::jsonb)) as q(key) where key like 'scorm-%' loop
  select p.draft_id into did from public.academy_scorm_publications p where p.course_id=k limit 1;
  if did is not null then
   select exists(select 1 from public.academy_scorm_learning l where l.member_id=new.member_id and l.course_id=k and l.passed) into done;
   new.progress=jsonb_set(new.progress,array[k],case when done then jsonb_build_array('scorm-lesson-'||did::text) else '[]'::jsonb end,true);
  end if;
 end loop;
 return new;
end $$;
revoke all on function academy_private.protect_scorm_progress() from public,anon,authenticated;
create trigger academy_scorm_verified_progress before update on public.academy_learning_state for each row execute function academy_private.protect_scorm_progress();