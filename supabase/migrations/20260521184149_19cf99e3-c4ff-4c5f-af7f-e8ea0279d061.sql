DROP POLICY IF EXISTS "managers authenticated read" ON public.managers;

CREATE POLICY "managers customers see assigned only"
ON public.managers
FOR SELECT
TO authenticated
USING (
  is_active AND (
    is_staff(auth.uid())
    OR id = (SELECT manager_id FROM public.profiles WHERE id = auth.uid())
  )
);