
-- Profiles: prevent self-escalation of discount_percent and manager_id
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;

CREATE POLICY "users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND discount_percent = (SELECT p.discount_percent FROM public.profiles p WHERE p.id = auth.uid())
  AND manager_id IS NOT DISTINCT FROM (SELECT p.manager_id FROM public.profiles p WHERE p.id = auth.uid())
  AND customer_type = (SELECT p.customer_type FROM public.profiles p WHERE p.id = auth.uid())
);

-- Warehouses: hide non-public warehouses from anon/authenticated; staff policy still grants full access
DROP POLICY IF EXISTS "warehouses public read" ON public.warehouses;

CREATE POLICY "warehouses public read"
ON public.warehouses
FOR SELECT
TO anon, authenticated
USING (is_active AND is_public);
