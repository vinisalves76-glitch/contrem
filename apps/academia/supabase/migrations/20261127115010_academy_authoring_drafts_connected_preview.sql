create table public.academy_authoring_drafts (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 1 and 180),
 project jsonb not null check (jsonb_typeof(project)='object' and jsonb_typeof(project->'modules')='array' and jsonb_array_length(project->'modules') between 0 and 100 and octet_length(project::text)<=700000),
 status text not null default 'draft' check (status in ('draft','reviewed')),
 revision integer not null default 0 check(revision>=0),
 created_by uuid not null default auth.uid(),
 updated_by uuid not null default auth.uid(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
comment on table public.academy_authoring_drafts is 'SCORM authoring drafts. Separate from published catalogs and student learning records. No secrets. All active Academy editors can collaborate; publication is a separate workflow.';
alter table public.academy_authoring_drafts enable row level security;
revoke all on public.academy_authoring_drafts from public, anon, authenticated;
grant select on public.academy_authoring_drafts to authenticated;
grant insert(id,title,project,status,created_by) on public.academy_authoring_drafts to authenticated;
grant update(title,project,status) on public.academy_authoring_drafts to authenticated;
create policy authoring_select on public.academy_authoring_drafts for select to authenticated using (
 exists(select 1 from public.academy_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('admin','content_admin'))
);
create policy authoring_insert on public.academy_authoring_drafts for insert to authenticated with check (
 created_by=(select auth.uid()) and exists(select 1 from public.academy_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('admin','content_admin'))
);
create policy authoring_update on public.academy_authoring_drafts for update to authenticated using (
 exists(select 1 from public.academy_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('admin','content_admin'))
) with check (
 exists(select 1 from public.academy_members m where m.user_id=(select auth.uid()) and m.active and m.role in ('admin','content_admin'))
);
create function public.academy_authoring_revision_guard() returns trigger
 language plpgsql security invoker set search_path=pg_catalog,public as $$
 begin
  if tg_op='INSERT' then
   new.revision:=0; new.created_at:=now();
  else
   if new.id is distinct from old.id or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at then
    raise exception 'Identidade do rascunho não pode ser alterada';
   end if;
   new.revision:=old.revision+1;
  end if;
  new.updated_at:=now(); new.updated_by:=auth.uid();
  return new;
 end $$;
revoke all on function public.academy_authoring_revision_guard() from public,anon,authenticated;
create trigger academy_authoring_revision before insert or update on public.academy_authoring_drafts for each row execute function public.academy_authoring_revision_guard();
create index academy_authoring_drafts_updated_idx on public.academy_authoring_drafts(updated_at desc);
notify pgrst,'reload schema';