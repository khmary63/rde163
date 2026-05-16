CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_sku_key;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_brand_sku_key;
ALTER TABLE public.products ADD CONSTRAINT products_brand_sku_key UNIQUE (brand_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products (sku);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);