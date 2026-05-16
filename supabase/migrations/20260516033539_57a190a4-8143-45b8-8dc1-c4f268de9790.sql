
-- ============== ENUMS ==============
create type public.app_role as enum ('admin', 'manager', 'customer_individual', 'customer_company');
create type public.customer_type as enum ('individual', 'company');
create type public.stock_status as enum ('in_stock', 'expected', 'out');
create type public.order_status as enum ('draft', 'submitted', 'processing', 'confirmed', 'shipped', 'completed', 'cancelled');
create type public.order_line_action as enum ('buy', 'reserve', 'backorder');
create type public.invoice_grouping as enum ('single', 'per_warehouse');

-- ============== USER_ROLES ==============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','manager'))
$$;

create policy "users see own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id or public.is_staff(auth.uid()));
create policy "admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============== MANAGERS ==============
create table public.managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.managers enable row level security;
create policy "managers public read" on public.managers for select to authenticated, anon using (is_active);
create policy "staff manage managers" on public.managers for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============== PROFILES ==============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  customer_type customer_type not null default 'individual',
  full_name text,
  phone text,
  email text,
  -- juridical fields
  company_name text,
  inn text,
  kpp text,
  legal_address text,
  -- assignment
  manager_id uuid references public.managers(id) on delete set null,
  discount_percent numeric(5,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "users view own profile" on public.profiles
  for select to authenticated using (auth.uid() = id or public.is_staff(auth.uid()));
create policy "users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "staff manage profiles" on public.profiles
  for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- handle new user trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _type customer_type;
  _role app_role;
begin
  _type := coalesce((new.raw_user_meta_data->>'customer_type')::customer_type, 'individual');
  _role := case when _type = 'company' then 'customer_company'::app_role else 'customer_individual'::app_role end;

  insert into public.profiles (id, customer_type, full_name, email, phone, company_name, inn, kpp, legal_address)
  values (
    new.id,
    _type,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'company_name',
    new.raw_user_meta_data->>'inn',
    new.raw_user_meta_data->>'kpp',
    new.raw_user_meta_data->>'legal_address'
  );

  insert into public.user_roles (user_id, role) values (new.id, _role);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============== updated_at helper ==============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_managers_updated before update on public.managers
  for each row execute function public.set_updated_at();

-- ============== CATALOG ==============
create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  city text,
  address text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.warehouses enable row level security;
create policy "warehouses public read" on public.warehouses for select to authenticated, anon using (is_active);
create policy "staff manage warehouses" on public.warehouses for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.brands enable row level security;
create policy "brands public read" on public.brands for select to authenticated, anon using (true);
create policy "staff manage brands" on public.brands for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  oem text,
  name text not null,
  brand_id uuid references public.brands(id) on delete set null,
  is_original boolean not null default true,
  category text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  image_url text,
  base_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create policy "products public read" on public.products for select to authenticated, anon using (true);
create policy "staff manage products" on public.products for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();
create index idx_products_brand on public.products(brand_id);
create index idx_products_sku on public.products(sku);

create table public.stock (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  qty int not null default 0,
  status stock_status not null default 'out',
  expected_qty int,
  expected_date date,
  updated_at timestamptz not null default now(),
  unique(product_id, warehouse_id)
);
alter table public.stock enable row level security;
create policy "stock public read" on public.stock for select to authenticated, anon using (true);
create policy "staff manage stock" on public.stock for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create trigger trg_stock_updated before update on public.stock
  for each row execute function public.set_updated_at();
create index idx_stock_product on public.stock(product_id);

-- ============== DISCOUNTS ==============
create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  inn text,
  name text,
  percent numeric(5,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.discounts enable row level security;
create policy "staff manage discounts" on public.discounts for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create policy "users see own discount" on public.discounts for select to authenticated
  using (auth.uid() = user_id or public.is_staff(auth.uid()));

-- ============== ORDERS ==============
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  number text unique not null default 'ORD-' || to_char(now(),'YYMMDD') || '-' || substr(gen_random_uuid()::text,1,6),
  status order_status not null default 'draft',
  invoice_grouping invoice_grouping not null default 'single',
  total_amount numeric(12,2) not null default 0,
  notes text,
  manager_id uuid references public.managers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  completed_at timestamptz
);
alter table public.orders enable row level security;
create policy "users see own orders" on public.orders for select to authenticated
  using (auth.uid() = user_id or public.is_staff(auth.uid()));
create policy "users create own orders" on public.orders for insert to authenticated
  with check (auth.uid() = user_id);
create policy "users update own draft orders" on public.orders for update to authenticated
  using ((auth.uid() = user_id and status = 'draft') or public.is_staff(auth.uid()))
  with check ((auth.uid() = user_id and status = 'draft') or public.is_staff(auth.uid()));
create policy "staff delete orders" on public.orders for delete to authenticated
  using (public.is_staff(auth.uid()));
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  warehouse_id uuid references public.warehouses(id) on delete set null,
  action order_line_action not null default 'buy',
  qty int not null check (qty > 0),
  unit_price numeric(12,2) not null,
  discount_percent numeric(5,2) not null default 0,
  line_total numeric(12,2) not null,
  created_at timestamptz not null default now()
);
alter table public.order_items enable row level security;
create policy "users see own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "users manage own order items" on public.order_items for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and ((o.user_id = auth.uid() and o.status = 'draft') or public.is_staff(auth.uid()))))
  with check (exists (select 1 from public.orders o where o.id = order_id and ((o.user_id = auth.uid() and o.status = 'draft') or public.is_staff(auth.uid()))));

create table public.order_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  file_name text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.order_documents enable row level security;
create policy "users see own documents" on public.order_documents for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_staff(auth.uid()))));
create policy "staff upload documents" on public.order_documents for insert to authenticated
  with check (public.is_staff(auth.uid()));
create policy "staff delete documents" on public.order_documents for delete to authenticated
  using (public.is_staff(auth.uid()));

create table public.order_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.order_templates enable row level security;
create policy "users own templates" on public.order_templates for all to authenticated
  using (auth.uid() = user_id or public.is_staff(auth.uid()))
  with check (auth.uid() = user_id);
create trigger trg_templates_updated before update on public.order_templates
  for each row execute function public.set_updated_at();

-- ============== CONTENT ==============
create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  cover_url text,
  author text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
create policy "blog public read" on public.blog_posts for select to authenticated, anon using (is_published);
create policy "staff manage blog" on public.blog_posts for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create trigger trg_blog_updated before update on public.blog_posts
  for each row execute function public.set_updated_at();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  company text,
  rating int not null check (rating between 1 and 5),
  text text not null,
  is_published boolean not null default false,
  source text default 'site',
  created_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create policy "reviews public read" on public.reviews for select to authenticated, anon using (is_published);
create policy "users create reviews" on public.reviews for insert to authenticated
  with check (auth.uid() = user_id);
create policy "staff manage reviews" on public.reviews for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  author_name text not null,
  text text not null,
  created_at timestamptz not null default now()
);
alter table public.review_replies enable row level security;
create policy "replies public read" on public.review_replies for select to authenticated, anon using (true);
create policy "staff manage replies" on public.review_replies for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.site_contacts (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  label text,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.site_contacts enable row level security;
create policy "contacts public read" on public.site_contacts for select to authenticated, anon using (true);
create policy "staff manage contacts" on public.site_contacts for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create trigger trg_contacts_updated before update on public.site_contacts
  for each row execute function public.set_updated_at();

create table public.feedback_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  phone text,
  email text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table public.feedback_messages enable row level security;
create policy "anyone can send feedback" on public.feedback_messages for insert to authenticated, anon with check (true);
create policy "staff read feedback" on public.feedback_messages for select to authenticated
  using (public.is_staff(auth.uid()));
create policy "staff manage feedback" on public.feedback_messages for update to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null,
  rows_processed int not null default 0,
  rows_failed int not null default 0,
  message text,
  details jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
alter table public.sync_logs enable row level security;
create policy "staff read logs" on public.sync_logs for select to authenticated
  using (public.is_staff(auth.uid()));
create policy "staff write logs" on public.sync_logs for all to authenticated
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============== SEED минимум ==============
insert into public.warehouses (code, name, city, sort_order) values
  ('MSK','Москва','Москва',1),
  ('SPB','Санкт-Петербург','Санкт-Петербург',2),
  ('EKB','Екатеринбург','Екатеринбург',3),
  ('NSK','Новосибирск','Новосибирск',4),
  ('KRD','Краснодар','Краснодар',5),
  ('KZN','Казань','Казань',6),
  ('VLD','Владивосток','Владивосток',7),
  ('NN','Нижний Новгород','Нижний Новгород',8);

insert into public.brands (slug, name, sort_order) values
  ('sitrak','SITRAK',1),
  ('sdlg','SDLG',2),
  ('xcmg','XCMG',3),
  ('howo','HOWO',4),
  ('shacman','Shacman',5),
  ('foton','Foton',6);

insert into public.site_contacts (key, value, label, sort_order) values
  ('phone_main','+7 (495) 000-00-00','Основной телефон',1),
  ('email_main','info@rde-parts.ru','Email',2),
  ('telegram','https://t.me/rde_parts','Telegram',3),
  ('whatsapp','https://wa.me/74950000000','WhatsApp',4),
  ('address','г. Москва, ул. Складская, д. 1','Адрес офиса',5),
  ('work_hours','Пн–Пт 9:00–19:00 МСК','Время работы',6);
