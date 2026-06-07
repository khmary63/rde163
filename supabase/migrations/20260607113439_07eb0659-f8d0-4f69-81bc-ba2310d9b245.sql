ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_retail numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_tiers  jsonb         NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source       text          NOT NULL DEFAULT 'price_list';

INSERT INTO public.warehouses (code, name, city, is_active, is_public, sort_order)
VALUES ('OFFER', 'Под заказ', NULL, true, false, 99)
ON CONFLICT (code) DO NOTHING;