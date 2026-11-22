-- BEGIN; <learning-save.sql>; <this file>; ROLLBACK;
-- Pure synthetic payload tests and function privilege metadata only: no PII,
-- existing student rows, catalog rows or Auth accounts are read or changed.
do $test$
declare
 existing jsonb := '{"profile":{"fullName":"Before","company":"Keep"},"progress":{"course-a":["l1"],"revoked":["hidden"],"assessment:course-a":[{"score":75,"passed":true}]},"activity":{"course-a":{"assessments":{"final":{"score":75}},"otherField":"keep","lastLessonId":"l1"},"revoked":{"keep":true}},"certificates":[{"code":"synthetic-certificate"}]}'::jsonb;
 allowed jsonb := '[{"id":"course-a","lessons":[{"id":"l1"},{"id":"l2"}]}]'::jsonb;
 patched jsonb;
 rejected boolean := false;
begin
 patched := academy_private.merge_learning_payload(existing,allowed,
  '{"fullName":"After","admin":true}',
  '{"course-a":["l2","unknown","l2"],"revoked":[],"assessment:course-a":[]}',
  '{"course-a":{"lastOpenedAt":"2026-11-22T10:00:00.000Z","lastLessonId":"l2","assessments":{}},"revoked":{}}');
 if patched->'profile'->>'fullName'<>'After' or patched->'profile'->>'company'<>'Keep' or patched->'profile' ? 'admin' then
  raise exception 'Display profile allowlist / merge failed';
 end if;
 if patched->'progress'->'course-a'<>'["l2"]'::jsonb
    or patched->'progress'->'revoked' is distinct from existing->'progress'->'revoked'
    or patched->'progress'->'assessment:course-a' is distinct from existing->'progress'->'assessment:course-a' then
  raise exception 'Progress merge erased history or accepted unauthorized completion';
 end if;
 if patched->'activity'->'course-a'->'assessments' is distinct from existing->'activity'->'course-a'->'assessments'
    or patched->'activity'->'course-a'->>'otherField'<>'keep'
    or patched->'activity'->'course-a'->>'lastLessonId'<>'l2'
    or patched->'activity'->'revoked' is distinct from existing->'activity'->'revoked'
    or patched ? 'certificates' then
  raise exception 'Activity merge erased history or attempted certificate write';
 end if;
 patched := academy_private.merge_learning_payload(existing,allowed,'{}','{"course-a":[]}','{}');
 if patched->'progress'->'course-a'<>'[]'::jsonb
    or patched->'progress'->'assessment:course-a' is distinct from existing->'progress'->'assessment:course-a' then
  raise exception 'Unmarking lessons erased assessment history';
 end if;
 begin
  perform academy_private.merge_learning_payload(existing,allowed,'{}','{}','{"course-a":{"lastLessonId":"not-granted"}}');
 exception when invalid_parameter_value then rejected := true;
 end;
 if not rejected then raise exception 'Unknown activity lesson accepted'; end if;
 if has_function_privilege('anon','public.academy_save_learning(jsonb,jsonb,jsonb,bigint)','EXECUTE')
    or not has_function_privilege('authenticated','public.academy_save_learning(jsonb,jsonb,jsonb,bigint)','EXECUTE')
    or has_function_privilege('authenticated','academy_private.merge_learning_payload(jsonb,jsonb,jsonb,jsonb,jsonb)','EXECUTE') then
  raise exception 'Save RPC / internal helper privileges incorrect';
 end if;
 raise notice 'PASS: profile allowlist, granted lessons only, hidden courses / exam history retained, certificate column untouched';
end;
$test$;
