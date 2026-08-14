-- Adana Color Albüm B2B platformu — başlangıç şeması

create extension if not exists "pgcrypto";

-- ==================== ENUM TİPLERİ ====================
create type user_role as enum ('admin', 'photographer');
create type profile_status as enum ('pending', 'active', 'suspended');
create type application_status as enum ('pending', 'approved', 'rejected');
create type order_status as enum (
  'draft', 'pending_payment', 'payment_review', 'paid',
  'in_production', 'shipped', 'delivered', 'cancelled'
);
create type payment_method as enum ('credit_card', 'bank_transfer');
create type payment_status as enum ('pending', 'confirmed', 'failed');
create type order_item_type as enum ('album', 'extra');

-- ==================== TABLOLAR ====================

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_no text,
  address text,
  phone text,
  email text,
  discount_rate numeric(5,2) not null default 0 check (discount_rate >= 0 and discount_rate <= 100),
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'photographer',
  full_name text,
  phone text,
  company_id uuid references companies(id) on delete set null,
  status profile_status not null default 'active',
  created_at timestamptz not null default now()
);

create table membership_applications (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text not null,
  tax_no text,
  address text,
  message text,
  status application_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  reviewed_at timestamptz,
  created_company_id uuid references companies(id),
  created_at timestamptz not null default now()
);

create table album_sizes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  width_cm numeric(5,1),
  height_cm numeric(5,1),
  sort_order int not null default 0
);

create table package_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  base_page_count int not null default 0,
  extra_page_price numeric(10,2) not null default 0,
  sort_order int not null default 0
);

create table album_size_prices (
  id uuid primary key default gen_random_uuid(),
  size_id uuid not null references album_sizes(id) on delete cascade,
  package_type_id uuid not null references package_types(id) on delete cascade,
  price numeric(10,2) not null,
  unique (size_id, package_type_id)
);

create table album_models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  company_id uuid references companies(id) on delete cascade,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table extra_products (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('canvas','print','box')),
  name text not null,
  price numeric(10,2) not null,
  company_id uuid references companies(id) on delete cascade,
  active boolean not null default true,
  sort_order int not null default 0
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique,
  company_id uuid not null references companies(id),
  created_by uuid not null references profiles(id),
  status order_status not null default 'draft',
  payment_method payment_method,
  subtotal numeric(10,2) not null default 0,
  discount_rate numeric(5,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  shipping_carrier text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  item_type order_item_type not null,
  album_size_id uuid references album_sizes(id),
  package_type_id uuid references package_types(id),
  album_model_id uuid references album_models(id),
  extra_product_id uuid references extra_products(id),
  quantity int not null default 1 check (quantity > 0),
  page_count int,
  cover_names_text text,
  cover_date_text text,
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null,
  notes text
);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  changed_by uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  method payment_method not null,
  amount numeric(10,2) not null,
  status payment_status not null default 'pending',
  mock_reference text,
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ==================== YARDIMCI FONKSİYONLAR ====================

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- Sipariş numarası üretimi
create sequence if not exists order_no_seq;

create or replace function public.set_order_no() returns trigger
language plpgsql as $$
begin
  if new.order_no is null then
    new.order_no := 'AC' || to_char(now(), 'YYYY') || lpad(nextval('order_no_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger trg_order_no before insert on orders
  for each row execute function public.set_order_no();

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_orders_updated_at before update on orders
  for each row execute function public.set_updated_at();

-- Durum değişikliklerini otomatik logla
create or replace function public.log_order_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') or (old.status is distinct from new.status) then
    insert into public.order_status_history(order_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger trg_order_status_log after insert or update on orders
  for each row execute function public.log_order_status();

-- ==================== RLS ====================

alter table companies enable row level security;
alter table profiles enable row level security;
alter table membership_applications enable row level security;
alter table album_sizes enable row level security;
alter table package_types enable row level security;
alter table album_size_prices enable row level security;
alter table album_models enable row level security;
alter table extra_products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table payments enable row level security;

-- companies
create policy "companies_select" on companies for select
  using (is_admin() or id = my_company_id());
create policy "companies_admin_write" on companies for all
  using (is_admin()) with check (is_admin());

-- profiles
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_update_own" on profiles for update
  using (id = auth.uid() or is_admin()) with check (id = auth.uid() or is_admin());
create policy "profiles_admin_insert" on profiles for insert
  with check (is_admin() or id = auth.uid());

-- membership_applications
create policy "applications_public_insert" on membership_applications for insert
  with check (true);
create policy "applications_admin_select" on membership_applications for select
  using (is_admin());
create policy "applications_admin_update" on membership_applications for update
  using (is_admin()) with check (is_admin());

-- katalog tabloları: giriş yapmış herkes okuyabilir, sadece admin yazar
create policy "album_sizes_select" on album_sizes for select using (auth.uid() is not null);
create policy "album_sizes_admin_write" on album_sizes for all using (is_admin()) with check (is_admin());

create policy "package_types_select" on package_types for select using (auth.uid() is not null);
create policy "package_types_admin_write" on package_types for all using (is_admin()) with check (is_admin());

create policy "album_size_prices_select" on album_size_prices for select using (auth.uid() is not null);
create policy "album_size_prices_admin_write" on album_size_prices for all using (is_admin()) with check (is_admin());

-- album_models: global (company_id null) + kendi cariye özel
create policy "album_models_select" on album_models for select
  using (auth.uid() is not null and (company_id is null or company_id = my_company_id() or is_admin()));
create policy "album_models_admin_write" on album_models for all
  using (is_admin()) with check (is_admin());

create policy "extra_products_select" on extra_products for select
  using (auth.uid() is not null and (company_id is null or company_id = my_company_id() or is_admin()));
create policy "extra_products_admin_write" on extra_products for all
  using (is_admin()) with check (is_admin());

-- orders
create policy "orders_select" on orders for select
  using (is_admin() or company_id = my_company_id());
create policy "orders_insert" on orders for insert
  with check (is_admin() or company_id = my_company_id());
create policy "orders_update_photographer" on orders for update
  using (company_id = my_company_id() and status in ('draft','pending_payment','payment_review'))
  with check (company_id = my_company_id());
create policy "orders_update_admin" on orders for update
  using (is_admin()) with check (is_admin());
create policy "orders_delete_admin" on orders for delete using (is_admin());

-- order_items
create policy "order_items_select" on order_items for select
  using (is_admin() or exists (select 1 from orders o where o.id = order_id and o.company_id = my_company_id()));
create policy "order_items_insert" on order_items for insert
  with check (
    is_admin() or exists (
      select 1 from orders o where o.id = order_id and o.company_id = my_company_id()
      and o.status in ('draft','pending_payment')
    )
  );
create policy "order_items_delete" on order_items for delete
  using (
    is_admin() or exists (
      select 1 from orders o where o.id = order_id and o.company_id = my_company_id()
      and o.status in ('draft','pending_payment')
    )
  );

-- order_status_history (trigger security definer ile yazar; sadece okuma politikası yeterli)
create policy "order_status_history_select" on order_status_history for select
  using (is_admin() or exists (select 1 from orders o where o.id = order_id and o.company_id = my_company_id()));

-- payments
create policy "payments_select" on payments for select
  using (is_admin() or exists (select 1 from orders o where o.id = order_id and o.company_id = my_company_id()));
create policy "payments_insert" on payments for insert
  with check (is_admin() or exists (select 1 from orders o where o.id = order_id and o.company_id = my_company_id()));
create policy "payments_admin_update" on payments for update
  using (is_admin()) with check (is_admin());
