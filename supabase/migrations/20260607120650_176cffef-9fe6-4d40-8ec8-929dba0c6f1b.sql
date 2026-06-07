REVOKE SELECT (base_price, price_tiers) ON public.products FROM anon;
-- Ensure authenticated retains full access (no-op if already granted)
GRANT SELECT ON public.products TO authenticated;