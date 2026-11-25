-- =====================================================================
-- Biz Pilot Digital — Phase 1 : schéma de base
-- Toutes les tables sont protégées par Row Level Security.
-- Les montants sont stockés avec leur devise ; on n'additionne jamais
-- deux devises différentes.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Référentiels
-- ---------------------------------------------------------------------
create table public.currencies (
  code      text primary key,
  decimals  smallint not null
);
insert into public.currencies (code, decimals) values
  ('USD', 2), ('EUR', 2), ('GBP', 2), ('GNF', 0), ('XOF', 0), ('NGN', 2);

create table public.plans (
  code        text primary key,
  sort_order  smallint not null,
  price_gnf   bigint   not null,
  limits      jsonb    not null default '{}'::jsonb,   -- null value = illimité
  features    text[]   not null default '{}',
  is_active   boolean  not null default true
);
insert into public.plans (code, sort_order, price_gnf, limits, features) values
  ('free', 0, 0,
     '{"max_businesses":1,"max_users":1,"max_sales_month":30,"max_expenses_month":30,"max_products":20}',
     '{}'),
  ('standard', 1, 50000,
     '{"max_businesses":1,"max_users":1}',
     '{all_periods,partial_payments,low_stock_alerts,exports,receipts,smart_pricing_full}'),
  ('premium', 2, 100000,
     '{"max_businesses":1,"max_users":3}',
     '{all_periods,partial_payments,low_stock_alerts,exports,receipts,smart_pricing_full,forecast,coach,full_history}'),
  ('business', 3, 190000,
     '{"max_businesses":10,"max_users":10}',
     '{all_periods,partial_payments,low_stock_alerts,exports,receipts,smart_pricing_full,forecast,coach,full_history,multi_business,roles,comparative_reports,priority_support}');

-- ---------------------------------------------------------------------
-- Comptes
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '' check (char_length(full_name) <= 120),
  language    text not null default 'fr' check (language in ('fr','en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Un abonnement par compte. Écrit uniquement côté serveur (service_role / webhook).
create table public.subscriptions (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  plan_code           text not null default 'free' references public.plans(code),
  status              text not null default 'active' check (status in ('active','trialing','past_due','canceled')),
  current_period_end  timestamptz,
  provider            text,
  provider_ref        text,
  updated_at          timestamptz not null default now()
);

-- Administrateurs de la plateforme : jamais modifiable depuis l'application.
create table public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Entreprises
-- ---------------------------------------------------------------------
create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  owner_name  text not null check (char_length(owner_name) between 1 and 120),
  sector      text not null default '' check (char_length(sector) <= 80),
  city        text not null default '' check (char_length(city) <= 80),
  currency    text not null references public.currencies(code),
  timezone    text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.business_members (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'staff' check (role in ('owner','manager','staff')),
  created_at  timestamptz not null default now(),
  primary key (business_id, user_id)
);
create index on public.business_members(user_id);

-- ---------------------------------------------------------------------
-- Produits & stock
-- ---------------------------------------------------------------------
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  name                text not null check (char_length(name) between 1 and 120),
  category            text not null default '' check (char_length(category) <= 80),
  sku                 text not null default '' check (char_length(sku) <= 60),
  currency            text not null references public.currencies(code),
  purchase_price      numeric(18,2) not null default 0 check (purchase_price >= 0),
  transport_cost      numeric(18,2) not null default 0 check (transport_cost >= 0),
  packaging_cost      numeric(18,2) not null default 0 check (packaging_cost >= 0),
  delivery_cost       numeric(18,2) not null default 0 check (delivery_cost >= 0),
  transaction_fee     numeric(18,2) not null default 0 check (transaction_fee >= 0),
  other_cost          numeric(18,2) not null default 0 check (other_cost >= 0),
  unit_cost           numeric(18,2) generated always as
                        (purchase_price + transport_cost + packaging_cost + delivery_cost + transaction_fee + other_cost) stored,
  sale_price          numeric(18,2) not null default 0 check (sale_price >= 0),
  stock_quantity      numeric(14,3) not null default 0,
  low_stock_threshold numeric(14,3) not null default 0 check (low_stock_threshold >= 0),
  archived            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index on public.products(business_id);

-- Journal de stock (non modifiable) : la quantité du produit est la somme des mouvements.
create table public.stock_movements (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  kind        text not null check (kind in ('initial','restock','adjustment','sale','sale_correction')),
  quantity    numeric(14,3) not null check (quantity <> 0),
  sale_id     uuid,
  note        text not null default '' check (char_length(note) <= 300),
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);
create index on public.stock_movements(product_id, created_at);

-- ---------------------------------------------------------------------
-- Ventes & paiements
-- ---------------------------------------------------------------------
create table public.sales (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  product_id     uuid references public.products(id) on delete set null,
  item_name      text not null check (char_length(item_name) between 1 and 120),
  quantity       numeric(14,3) not null check (quantity > 0),
  unit_price     numeric(18,2) not null check (unit_price >= 0),
  total          numeric(18,2) generated always as (round(quantity * unit_price, 2)) stored,
  currency       text not null references public.currencies(code),
  sale_date      date not null,
  customer_name  text not null default '' check (char_length(customer_name) <= 120),
  payment_method text not null default 'cash'
                   check (payment_method in ('cash','mobile_money','card','bank_transfer','check','other')),
  amount_paid    numeric(18,2) not null default 0,
  status         text not null default 'pending' check (status in ('paid','partial','pending')),
  note           text not null default '' check (char_length(note) <= 500),
  created_by     uuid default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public.sales(business_id, sale_date);
create index on public.sales(business_id, status);

create table public.sale_payments (
  id          uuid primary key default gen_random_uuid(),
  sale_id     uuid not null references public.sales(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  amount      numeric(18,2) not null check (amount > 0),
  currency    text not null references public.currencies(code),
  paid_on     date not null,
  method      text not null default 'cash'
                check (method in ('cash','mobile_money','card','bank_transfer','check','other')),
  created_by  uuid default auth.uid(),
  created_at  timestamptz not null default now()
);
create index on public.sale_payments(business_id, paid_on);
create index on public.sale_payments(sale_id);

-- ---------------------------------------------------------------------
-- Dépenses
-- ---------------------------------------------------------------------
-- Catégories système (business_id null, libellé traduit côté interface via `code`)
-- + catégories personnalisées par entreprise.
create table public.expense_categories (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  code        text,
  name        text not null default '' check (char_length(name) <= 60),
  created_at  timestamptz not null default now(),
  check ((business_id is null and code is not null) or (business_id is not null and code is null and char_length(name) > 0))
);
create unique index on public.expense_categories(code) where business_id is null;
create unique index on public.expense_categories(business_id, lower(name)) where business_id is not null;
insert into public.expense_categories (code) values
  ('supply'),('transport'),('delivery'),('rent'),('salary'),('advertising'),
  ('electricity'),('water'),('internet'),('packaging'),('other');

create table public.expenses (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references public.businesses(id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 120),
  category_id    uuid not null references public.expense_categories(id),
  amount         numeric(18,2) not null check (amount > 0),
  currency       text not null references public.currencies(code),
  expense_date   date not null,
  payment_method text not null default 'cash'
                   check (payment_method in ('cash','mobile_money','card','bank_transfer','check','other')),
  receipt_path   text,
  note           text not null default '' check (char_length(note) <= 500),
  created_by     uuid default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on public.expenses(business_id, expense_date);

-- Journal d'erreurs applicatives (lecture réservée à l'admin, phase admin).
create table public.error_logs (
  id         bigserial primary key,
  user_id    uuid default auth.uid(),
  context    text not null default '',
  message    text not null default '',
  created_at timestamptz not null default now()
);
