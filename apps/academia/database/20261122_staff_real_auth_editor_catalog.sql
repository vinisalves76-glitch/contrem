-- CONTREM Academia: additive role + protected editorial workspace.
-- Does not replace existing catalog, learners, accounts, grants or policies.
BEGIN;

ALTER TABLE public.academy_members DROP CONSTRAINT IF EXISTS academy_members_role_check;
ALTER TABLE public.academy_members
 ADD CONSTRAINT academy_members_role_check CHECK (role IN ('admin','student','content_admin'));

CREATE TABLE IF NOT EXISTS public.academy_editor_catalog (
 id text PRIMARY KEY DEFAULT 'main' CHECK (id='main'),
 courses jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(courses)='array'),
 revision bigint NOT NULL DEFAULT 0 CHECK (revision>=0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES public.academy_members(id) ON DELETE SET NULL
);

ALTER TABLE public.academy_editor_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academy_editor_catalog FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.academy_editor_catalog TO service_role;

INSERT INTO public.academy_editor_catalog (id,courses,revision,updated_at,updated_by)
SELECT id,courses,revision,now(),updated_by
FROM public.academy_catalog WHERE id='main'
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION academy_private.is_content_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(
  SELECT 1 FROM public.academy_members m
  WHERE m.user_id=auth.uid() AND m.active AND m.role='content_admin'
 );
$$;
REVOKE ALL ON FUNCTION academy_private.is_content_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION academy_private.is_content_admin() TO authenticated;

DROP POLICY IF EXISTS academy_materials_content_admin_select ON storage.objects;
CREATE POLICY academy_materials_content_admin_select
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='academy-materials' AND (SELECT academy_private.is_content_admin()));

DROP POLICY IF EXISTS academy_materials_content_admin_insert ON storage.objects;
CREATE POLICY academy_materials_content_admin_insert
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='academy-materials' AND (SELECT academy_private.is_content_admin()));

DROP POLICY IF EXISTS academy_materials_content_admin_update ON storage.objects;
CREATE POLICY academy_materials_content_admin_update
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='academy-materials' AND (SELECT academy_private.is_content_admin()))
WITH CHECK (bucket_id='academy-materials' AND (SELECT academy_private.is_content_admin()));

DROP POLICY IF EXISTS academy_materials_content_admin_delete ON storage.objects;
CREATE POLICY academy_materials_content_admin_delete
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='academy-materials' AND (SELECT academy_private.is_content_admin()));

COMMIT;
