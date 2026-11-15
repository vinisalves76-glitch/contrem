-- Preserve existing provider support and authorization. Mux becomes the default.
alter table public.academy_stream_assets drop constraint academy_stream_assets_provider_check;
alter table public.academy_stream_assets drop constraint academy_stream_assets_provider_video_id_check;
alter table public.academy_stream_assets alter column provider set default 'mux';
alter table public.academy_stream_assets add column provider_playback_id text;
alter table public.academy_stream_assets add column playback_policy text not null default 'signed';
alter table public.academy_stream_assets add constraint academy_stream_provider_check check (provider in ('cloudflare','mux'));
alter table public.academy_stream_assets add constraint academy_stream_identifier_check check (
 (provider='cloudflare' and provider_video_id ~ '^[a-f0-9]{32}$') or
 (provider='mux' and provider_video_id ~ '^[A-Za-z0-9_-]{8,255}$')
);
alter table public.academy_stream_assets add constraint academy_stream_playback_policy_check check (playback_policy in ('public','signed'));
alter table public.academy_stream_assets add constraint academy_stream_mux_playback_check check (
 provider <> 'mux' or (
  provider_playback_id is not null and provider_playback_id ~ '^[A-Za-z0-9_-]{8,255}$'
  and (kind='presentation' or playback_policy='signed')
 )
);
create unique index academy_stream_unique_playback_id on public.academy_stream_assets(provider,provider_playback_id) where provider_playback_id is not null;
comment on column public.academy_stream_assets.provider_video_id is 'Mux asset ID or Cloudflare video UID. Server/admin mapping only.';
comment on column public.academy_stream_assets.provider_playback_id is 'Mux playback ID. Courses require signed policy; presentation may be public by explicit user decision.';
