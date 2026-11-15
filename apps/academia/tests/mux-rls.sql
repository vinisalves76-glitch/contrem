begin;
create temp table mux_qa_context as select role,user_id from public.academy_members where active;
grant select on mux_qa_context to authenticated;
create temp table mux_qa_results(test text,passed boolean);
grant select,insert on mux_qa_results to authenticated;
insert into public.academy_videos(id,course_id,lesson_id,title) values
('d8e7309a-85cf-4189-b031-5f097739448c','qa_mux','qa_aula1','Temporary Mux QA'),
('d8e7309a-85cf-4189-b031-5f097739448d','qa_mux','qa_aula2','Temporary Mux QA 2');
insert into public.academy_stream_assets(kind,video_id,provider_video_id,provider_playback_id) values
('course','d8e7309a-85cf-4189-b031-5f097739448c','MuxAssetIdTestOne','MuxPlaybackIdTestOne');
insert into public.academy_stream_assets(kind,provider_video_id,provider_playback_id,playback_policy) values
('presentation','MuxAssetIdTestTwo','MuxPlaybackIdTestTwo','public');
insert into mux_qa_results values('Mux is default provider',(select bool_and(provider='mux') from public.academy_stream_assets));
do $$ begin
 begin
 insert into public.academy_stream_assets(kind,video_id,provider_video_id,provider_playback_id,playback_policy)
 values('course','d8e7309a-85cf-4189-b031-5f097739448d','MuxAssetIdTestBad','MuxPlaybackIdTestBad','public');
 raise exception 'public course mapping accepted';
 exception when check_violation then insert into mux_qa_results values('public playback forbidden for course',true);
 end;
 begin
 insert into public.academy_stream_assets(kind,video_id,provider_video_id)
 values('course','d8e7309a-85cf-4189-b031-5f097739448d','MuxAssetIdNoPlayback');
 raise exception 'Mux mapping without playback accepted';
 exception when check_violation then insert into mux_qa_results values('Mux requires playback identifier',true);
 end;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from mux_qa_context where role='student' limit 1),'role','authenticated')::text,true);
set local role authenticated;
insert into mux_qa_results values('student cannot read mapping',(select count(*)=0 from public.academy_stream_assets));
do $$ begin
 begin
 insert into public.academy_stream_assets(kind,video_id,provider_video_id,provider_playback_id)
 values('course','d8e7309a-85cf-4189-b031-5f097739448d','MuxAssetIdStudent','MuxPlaybackStudent');
 raise exception 'student unexpectedly created mapping';
 exception when insufficient_privilege then insert into mux_qa_results values('student cannot create mapping',true);
 end;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',(select user_id from mux_qa_context where role='admin' limit 1),'role','authenticated')::text,true);
set local role authenticated;
insert into mux_qa_results values('admin sees signed lesson and public presentation',(select count(*)=2 from public.academy_stream_assets));
reset role;
insert into mux_qa_results values('anonymous cannot read mapping',not has_table_privilege('anon','public.academy_stream_assets','select'));
do $$ begin if exists(select 1 from mux_qa_results where not passed) then raise exception 'Mux RLS checks failed';end if;end $$;
select jsonb_agg(to_jsonb(mux_qa_results)) from mux_qa_results;
rollback;
