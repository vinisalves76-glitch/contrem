-- Run after loading catalog-readiness.sql in the SAME transaction, then ROLLBACK.
-- Uses only synthetic JSON and catalog/function privilege metadata: no accounts,
-- learner records, catalog contents, secrets or persistent fixtures are read.
-- Example: BEGIN; <catalog-readiness.sql>; <this file>; ROLLBACK;
do $test$
declare
 source jsonb := '{"id":"synthetic-course","name":"Synthetic","status":"published","questions":[{"correct":1}],"passScore":75,"previewMaterials":[{"id":"local"}],"supportLinks":[{"url":"https://example.invalid/private"}],"lessons":[{"id":"l1","name":"One","url":"https://player.mux.com/never-expose","questions":[{"correct":0}],"previewMaterial":{"id":"local"},"materialUrl":"https://example.invalid/private","futureSecret":"must-not-leak","videoId":"untrusted-id"},{"id":"l2","name":"Two","url":"https://player.mux.com/public"}]}'::jsonb;
 projected jsonb;
begin
 projected := academy_private.project_student_course(source,
  '{"l1":"11111111-1111-4111-8111-111111111111"}'::jsonb);
 if projected is null or jsonb_array_length(projected->'lessons')<>2
    or projected->>'status'<>'published' then
  raise exception 'Published course projection failed';
 end if;
 if projected ?| array['questions','passScore','previewMaterials','supportLinks']
    or projected->'lessons'->0 ?| array['questions','previewMaterial','materialUrl','futureSecret'] then
  raise exception 'Authoring secrets or local materials leaked';
 end if;
 if projected->'lessons'->0->>'url'<>'' or projected->'lessons'->1->>'url'<>''
    or projected->'lessons'->0->>'videoId'<>'11111111-1111-4111-8111-111111111111'
    or projected->'lessons'->1->'videoId'<>'null'::jsonb then
  raise exception 'Private video projection failed';
 end if;
 if academy_private.project_student_course(jsonb_set(source,'{status}','"draft"'),'{}') is not null
    or academy_private.project_student_course(source-'status','{}') is not null then
  raise exception 'Draft / unspecified publication status exposed';
 end if;
 if has_function_privilege('anon','public.academy_my_catalog()','EXECUTE')
    or not has_function_privilege('authenticated','public.academy_my_catalog()','EXECUTE')
    or has_function_privilege('anon','academy_private.project_student_course(jsonb,jsonb)','EXECUTE')
    or has_function_privilege('authenticated','academy_private.project_student_course(jsonb,jsonb)','EXECUTE') then
  raise exception 'RPC or helper privilege regression';
 end if;
 raise notice 'PASS: whitelist, draft exclusion, trusted UUID, no public playback, restricted helper / RPC grants';
end;
$test$;
