
create table if not exists public.product_crosses (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  cross_number text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_crosses_product on public.product_crosses(product_id);
create index if not exists idx_product_crosses_number_trgm on public.product_crosses using gin (cross_number gin_trgm_ops);
create unique index if not exists uq_product_crosses on public.product_crosses(product_id, cross_number);

alter table public.product_crosses enable row level security;

create policy "crosses public read" on public.product_crosses
  for select to anon, authenticated using (true);

create policy "staff manage crosses" on public.product_crosses
  for all to authenticated
  using (is_staff(auth.uid())) with check (is_staff(auth.uid()));

create index if not exists idx_products_sku_trgm on public.products using gin (sku gin_trgm_ops);
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create index if not exists idx_products_oem_trgm on public.products using gin (oem gin_trgm_ops);
