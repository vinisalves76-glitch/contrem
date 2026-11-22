-- CONTREM Academia: patch aditivo, estritamente limitado ao catálogo e materiais.
-- Não altera auth.users, perfis gerais, manutenção ou dados da ContremTec.
-- RLS academy_catalog_admin_update já restringe update a academy_private.is_admin().
grant update (courses) on table public.academy_catalog to authenticated;

insert into storage.buckets (id,name,public,file_size_limit)
values ('academy-materials','academy-materials',false,52428800)
on conflict (id) do nothing;

-- Acessos restritos: requer associação ativa + curso publicado e matriculado.
create or replace function academy_private.can_read_material(p_course_id text)
returns boolean
language sql stable security definer set search_path = ''
as $$
 select auth.uid() is not null and (
   academy_private.is_admin() or
   exists(
     select 1
     from public.academy_course_access a
     join public.academy_catalog c on c.id='main'
     cross join lateral jsonb_array_elements(c.courses) as courses(course)
     where a.member_id=academy_private.current_member_id()
       and a.course_id=p_course_id
       and courses.course->>'id'=p_course_id
       and courses.course->>'status'='published'
   )
 );
$$;
revoke all on function academy_private.can_read_material(text) from public, anon;
grant execute on function academy_private.can_read_material(text) to authenticated;

create policy "academy_materials_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id='academy-materials' and (select academy_private.is_admin()));

create policy "academy_materials_admin_update"
on storage.objects for update to authenticated
using (bucket_id='academy-materials' and (select academy_private.is_admin()))
with check (bucket_id='academy-materials' and (select academy_private.is_admin()));

create policy "academy_materials_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id='academy-materials' and (select academy_private.is_admin()));

create policy "academy_materials_private_select"
on storage.objects for select to authenticated
using (
  bucket_id='academy-materials'
  and (select academy_private.can_read_material(split_part(name,'/',1)))
);
