create table public.academy_stream_assets (
 id uuid primary key default gen_random_uuid(),
 kind text not null check (kind in ('course','presentation')),
 video_id uuid references public.academy_videos(id) on delete cascade,
 provider text not null default 'cloudflare' check (provider='cloudflare'),
 provider_video_id text not null check (provider_video_id ~ '^[a-f0-9]{32}$'),
 state text not null default 'processing' check (state in ('pending','processing','ready','error')),
 created_at timestamptz not null default now(),
 check ((kind='course' and video_id is not null) or (kind='presentation' and video_id is null)),
 unique (video_id),
 unique (provider,provider_video_id)
);
create unique index academy_stream_one_presentation on public.academy_stream_assets(kind) where kind='presentation';
alter table public.academy_stream_assets enable row level security;
revoke all on public.academy_stream_assets from public,anon,authenticated;
grant select,insert,update,delete on public.academy_stream_assets to authenticated;
grant all on public.academy_stream_assets to service_role;
create policy academy_stream_assets_admin on public.academy_stream_assets for all to authenticated
 using ((select academy_private.is_admin())) with check ((select academy_private.is_admin()));
comment on table public.academy_stream_assets is 'Streaming provider mapping. Admin/server only. Course playback must validate user and academy_videos RLS before server reads this mapping. Public presentation is a separate explicitly public flow. No API secrets or playback tokens stored here.';
