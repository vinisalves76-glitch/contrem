-- CONTREM Academia: additive model for independently enrolled formation programs.
-- All reads/writes go through the server-authorized academy-programs Edge Function.
-- Existing courses, logins, student learning and Mux tables are untouched.
create table if not exists public.academy_programs (
  id text primary key check (id ~ '^academy-[a-z0-9-]{3,150}$'),
  title text not null check (char_length(title) between 3 and 180),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  definition jsonb not null default '{}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  created_by uuid references public.academy_members(id) on delete set null,
  updated_by uuid references public.academy_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.academy_program_enrollments (
  program_id text not null references public.academy_programs(id) on delete restrict,
  member_id uuid not null references public.academy_members(id) on delete cascade,
  active boolean not null default true,
  expires_on date,
  granted_by uuid references public.academy_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (program_id, member_id)
);
create index if not exists academy_program_enrollments_member_idx
  on public.academy_program_enrollments(member_id,active);
alter table public.academy_programs enable row level security;
alter table public.academy_program_enrollments enable row level security;
revoke all on table public.academy_programs from public,anon,authenticated;
revoke all on table public.academy_program_enrollments from public,anon,authenticated;
-- There are intentionally NO client RLS policies. The Edge Function checks
-- authenticated JWT, membership, master/staff roles and program enrollment,
-- then uses service-role credentials strictly on the server.
comment on table public.academy_programs is
  'CONTREM Academia formation structure; separate from the standalone courses catalog.';
comment on table public.academy_program_enrollments is
  'Master-managed access to multi-module formation programs.';
