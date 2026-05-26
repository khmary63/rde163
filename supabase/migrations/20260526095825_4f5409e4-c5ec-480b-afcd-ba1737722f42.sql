
-- Drop bogus test rows
DELETE FROM public._imp_prod WHERE brand_name='CLEAR';
DELETE FROM public._imp_prod WHERE brand_name='CNHTC' AND sku='TEST' AND name='test';

-- Upsert products
INSERT INTO products (brand_id, sku, name, base_price, is_original)
SELECT b.id, i.sku, i.name, i.price, (upper(b.name)='CNHTC')
FROM public._imp_prod i
JOIN brands b ON b.name = i.brand_name
ON CONFLICT (brand_id, sku) DO UPDATE
  SET name = EXCLUDED.name,
      base_price = EXCLUDED.base_price,
      is_original = EXCLUDED.is_original;

-- Replace stock entirely
DELETE FROM stock;

-- In-stock rows (sum duplicates per product+warehouse)
INSERT INTO stock (product_id, warehouse_id, qty, status)
SELECT p.id, w.id, SUM(s.qty)::int, 'in_stock'::stock_status
FROM public._imp_stock s
JOIN brands b ON b.name = s.brand_name
JOIN products p ON p.brand_id = b.id AND p.sku = s.sku
JOIN warehouses w ON w.code = s.wh_code
GROUP BY p.id, w.id
ON CONFLICT (product_id, warehouse_id) DO UPDATE
  SET qty = EXCLUDED.qty, status = 'in_stock'::stock_status;

-- "Под заказ" rows: products without any qty, only status set in price-list
INSERT INTO stock (product_id, warehouse_id, qty, status)
SELECT DISTINCT p.id, (SELECT id FROM warehouses WHERE code='msk'), 0, 'out'::stock_status
FROM public._imp_prod i
JOIN brands b ON b.name = i.brand_name
JOIN products p ON p.brand_id = b.id AND p.sku = i.sku
WHERE i.out_only = true
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

-- Cleanup staging
DROP TABLE IF EXISTS public._imp_prod;
DROP TABLE IF EXISTS public._imp_stock;
