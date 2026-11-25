-- =====================================================================
-- Biz Pilot Digital — Phase 1 : règles métier, droits et sécurité (RLS)
-- Toute règle importante est appliquée ici, côté serveur : l'interface
-- ne fait que refléter ce que la base autorise.
-- Codes d'erreur renvoyés : BP001..BP0xx (traduits dans l'interface).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Fonctions d'aide (security definer, search_path verrouillé)
-- ---------------------------------------------------------------------
create or replace function public.is_member(p_business uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.business_members m
                 where m.business_id = p_business and m.user_id = auth.uid());
$$;

create or replace function public.member_role(p_business uuid)
returns text language sql stable security definer set search_path = '' as $$
  select m.role from public.business_members m
  where m.business_id = p_business and m.user_id = auth.uid();
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins a where a.user_id = auth.uid());
$$;

create or replace function public.plan_for_user(p_user uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select s.plan_code from public.subscriptions s
      where s.user_id = p_user and s.status in ('active','trialing')
        and (s.current_period_end is null or s.current_period_end > now())),
    'free');
$$;

create or replace function public.business_plan(p_business uuid)
returns text language sql stable security definer set search_path = '' as $$
  select public.plan_for_user(b.owner_id) from public.businesses b where b.id = p_business;
$$;

create or replace function public.has_feature(p_business uuid, p_feature text)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(p_feature = any (p.features), false)
  from public.plans p where p.code = public.business_plan(p_business);
$$;

-- Limite numérique d'une formule (null = illimité)
create or replace function public.plan_limit(p_plan text, p_key text)
returns integer language sql stable security definer set search_path = '' as $$
  select (p.limits ->> p_key)::integer from public.plans p where p.code = p_plan;
$$;

create or replace function public.round_money(p_amount numeric, p_currency text)
returns numeric language sql stable set search_path = '' as $$
  select round(p_amount, (select c.decimals from public.currencies c where c.code = p_currency));
$$;

-- Début du mois en cours dans le fuseau de l'entreprise (pour les quotas mensuels)
create or replace function public.business_month_start(p_business uuid)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select (date_trunc('month', now() at time zone b.timezone)) at time zone b.timezone
  from public.businesses b where b.id = p_business;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end; $$;

-- ---------------------------------------------------------------------
-- Nouveaux comptes : profil + formule Free
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_lang text := coalesce(new.raw_user_meta_data ->> 'language', 'fr');
begin
  if v_lang not in ('fr','en') then v_lang := 'fr'; end if;
  insert into public.profiles (id, full_name, language)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), v_lang);
  insert into public.subscriptions (user_id, plan_code) values (new.id, 'free');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Entreprises
-- ---------------------------------------------------------------------
create or replace function public.businesses_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_count integer; v_max integer;
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'BP010 invalid timezone' using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' then
    if auth.uid() is not null then new.owner_id := auth.uid(); end if;
    select count(*) into v_count from public.businesses where owner_id = new.owner_id;
    v_max := public.plan_limit(public.plan_for_user(new.owner_id), 'max_businesses');
    if v_max is not null and v_count >= v_max then
      raise exception 'BP001 business limit reached' using errcode = 'P0001';
    end if;
  else
    new.owner_id := old.owner_id;  -- le propriétaire ne change jamais via l'appli
    new.created_at := old.created_at;
    if new.currency <> old.currency and (
         exists (select 1 from public.sales s where s.business_id = old.id)
      or exists (select 1 from public.expenses e where e.business_id = old.id)
      or exists (select 1 from public.products p where p.business_id = old.id)) then
      raise exception 'BP011 currency locked' using errcode = 'P0001';
    end if;
    new.updated_at := now();
  end if;
  return new;
end; $$;
create trigger businesses_bw before insert or update on public.businesses
  for each row execute function public.businesses_before_write();

create or replace function public.businesses_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.business_members (business_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end; $$;
create trigger businesses_ai after insert on public.businesses
  for each row execute function public.businesses_after_insert();

-- ---------------------------------------------------------------------
-- Produits
-- ---------------------------------------------------------------------
create or replace function public.products_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_cur text; v_count integer; v_max integer;
begin
  select currency into v_cur from public.businesses where id = new.business_id;
  if tg_op = 'UPDATE' then
    new.business_id := old.business_id;
    new.created_at := old.created_at;
    if new.stock_quantity is distinct from old.stock_quantity
       and coalesce(current_setting('bizpilot.stock_sync', true), '') <> 'on' then
      raise exception 'BP020 stock changes must go through stock movements' using errcode = 'P0001';
    end if;
    new.updated_at := now();
  else
    select count(*) into v_count from public.products where business_id = new.business_id and not archived;
    v_max := public.plan_limit(public.business_plan(new.business_id), 'max_products');
    if v_max is not null and v_count >= v_max then
      raise exception 'BP002 product limit reached' using errcode = 'P0001';
    end if;
    if new.stock_quantity < 0 then
      raise exception 'BP021 negative stock' using errcode = 'P0001';
    end if;
  end if;
  new.currency := v_cur;
  new.purchase_price  := public.round_money(new.purchase_price, v_cur);
  new.transport_cost  := public.round_money(new.transport_cost, v_cur);
  new.packaging_cost  := public.round_money(new.packaging_cost, v_cur);
  new.delivery_cost   := public.round_money(new.delivery_cost, v_cur);
  new.transaction_fee := public.round_money(new.transaction_fee, v_cur);
  new.other_cost      := public.round_money(new.other_cost, v_cur);
  new.sale_price      := public.round_money(new.sale_price, v_cur);
  return new;
end; $$;
create trigger products_bw before insert or update on public.products
  for each row execute function public.products_before_write();

-- La quantité saisie à la création devient un mouvement « stock initial ».
create or replace function public.products_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stock_quantity > 0 then
    insert into public.stock_movements (business_id, product_id, kind, quantity, note)
    values (new.business_id, new.id, 'initial', new.stock_quantity, '');
  end if;
  return new;
end; $$;
create trigger products_ai after insert on public.products
  for each row execute function public.products_after_insert();

-- ---------------------------------------------------------------------
-- Mouvements de stock : la quantité d'un produit = somme de ses mouvements
-- ---------------------------------------------------------------------
create or replace function public.stock_movements_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_business uuid; v_current numeric;
begin
  select business_id into v_business from public.products where id = new.product_id for update;
  if v_business is null or v_business <> new.business_id then
    raise exception 'BP022 product not in business' using errcode = 'P0001';
  end if;
  if new.kind <> 'initial' then
    select coalesce(sum(quantity), 0) into v_current from public.stock_movements where product_id = new.product_id;
    if v_current + new.quantity < 0 then
      raise exception 'BP023 insufficient stock' using errcode = 'P0001';
    end if;
  end if;
  return new;
end; $$;
create trigger stock_movements_bi before insert on public.stock_movements
  for each row execute function public.stock_movements_before_insert();

create or replace function public.stock_movements_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('bizpilot.stock_sync', 'on', true);
  update public.products p
     set stock_quantity = (select coalesce(sum(m.quantity), 0) from public.stock_movements m where m.product_id = new.product_id)
   where p.id = new.product_id;
  perform set_config('bizpilot.stock_sync', '', true);
  return new;
end; $$;
create trigger stock_movements_ai after insert on public.stock_movements
  for each row execute function public.stock_movements_after_insert();

-- ---------------------------------------------------------------------
-- Ventes
-- ---------------------------------------------------------------------
create or replace function public.sales_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_cur text; v_pbiz uuid; v_pname text; v_count integer; v_max integer;
begin
  if tg_op = 'UPDATE' then
    new.business_id := old.business_id;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    if coalesce(current_setting('bizpilot.payment_sync', true), '') <> 'on' then
      new.amount_paid := old.amount_paid;   -- seuls les paiements modifient ces champs
      new.status := old.status;
    end if;
    new.updated_at := now();
  else
    new.amount_paid := 0;
    new.status := 'pending';
    select count(*) into v_count from public.sales
     where business_id = new.business_id and created_at >= public.business_month_start(new.business_id);
    v_max := public.plan_limit(public.business_plan(new.business_id), 'max_sales_month');
    if v_max is not null and v_count >= v_max then
      raise exception 'BP003 monthly sales limit reached' using errcode = 'P0001';
    end if;
  end if;

  select currency into v_cur from public.businesses where id = new.business_id;
  new.currency := v_cur;
  new.unit_price := public.round_money(new.unit_price, v_cur);

  if new.product_id is not null then
    select business_id, name into v_pbiz, v_pname from public.products where id = new.product_id;
    if v_pbiz is null or v_pbiz <> new.business_id then
      raise exception 'BP022 product not in business' using errcode = 'P0001';
    end if;
    if coalesce(trim(new.item_name), '') = '' then new.item_name := v_pname; end if;
  end if;

  if tg_op = 'UPDATE' and round(new.quantity * new.unit_price, 2) < new.amount_paid then
    raise exception 'BP030 total below amount already paid' using errcode = 'P0001';
  end if;
  return new;
end; $$;
create trigger sales_bw before insert or update on public.sales
  for each row execute function public.sales_before_write();

-- Chaque vente liée à un produit sort du stock ; une modification ou une
-- suppression crée un mouvement correctif (le journal n'est jamais réécrit).
create or replace function public.sales_after_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.product_id is not null then
      insert into public.stock_movements (business_id, product_id, kind, quantity, sale_id)
      values (new.business_id, new.product_id, 'sale', -new.quantity, new.id);
    end if;
  elsif tg_op = 'UPDATE' then
    if new.product_id is distinct from old.product_id or new.quantity <> old.quantity then
      if old.product_id is not null and exists (select 1 from public.products where id = old.product_id) then
        insert into public.stock_movements (business_id, product_id, kind, quantity, sale_id)
        values (old.business_id, old.product_id, 'sale_correction', old.quantity, old.id);
      end if;
      if new.product_id is not null then
        insert into public.stock_movements (business_id, product_id, kind, quantity, sale_id)
        values (new.business_id, new.product_id, 'sale', -new.quantity, new.id);
      end if;
    end if;
  elsif tg_op = 'DELETE' then
    if old.product_id is not null and exists (select 1 from public.products where id = old.product_id) then
      insert into public.stock_movements (business_id, product_id, kind, quantity, sale_id)
      values (old.business_id, old.product_id, 'sale_correction', old.quantity, old.id);
    end if;
  end if;
  return null;
end; $$;
create trigger sales_aw after insert or update or delete on public.sales
  for each row execute function public.sales_after_write();

-- ---------------------------------------------------------------------
-- Paiements de vente (paiements partiels)
-- ---------------------------------------------------------------------
create or replace function public.recompute_sale_payment(p_sale uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_paid numeric; v_total numeric;
begin
  select coalesce(sum(amount), 0) into v_paid from public.sale_payments where sale_id = p_sale;
  select total into v_total from public.sales where id = p_sale;
  if v_total is null then return; end if;
  perform set_config('bizpilot.payment_sync', 'on', true);
  update public.sales set amount_paid = v_paid,
         status = case when v_paid >= v_total then 'paid' when v_paid > 0 then 'partial' else 'pending' end
   where id = p_sale;
  perform set_config('bizpilot.payment_sync', '', true);
end; $$;

create or replace function public.sale_payments_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_sale record; v_remaining numeric;
begin
  select id, business_id, currency, total, amount_paid into v_sale from public.sales where id = new.sale_id for update;
  if v_sale.id is null then raise exception 'BP031 sale not found' using errcode = 'P0001'; end if;
  if tg_op = 'UPDATE' then
    new.sale_id := old.sale_id;
    v_remaining := v_sale.total - v_sale.amount_paid + old.amount;
  else
    v_remaining := v_sale.total - v_sale.amount_paid;
  end if;
  new.business_id := v_sale.business_id;
  new.currency := v_sale.currency;
  new.amount := public.round_money(new.amount, v_sale.currency);
  if new.amount > v_remaining then
    raise exception 'BP032 payment exceeds remaining amount' using errcode = 'P0001';
  end if;
  if new.amount < v_remaining and not public.has_feature(v_sale.business_id, 'partial_payments') then
    raise exception 'BP040 feature partial_payments not in plan' using errcode = 'P0001';
  end if;
  return new;
end; $$;
create trigger sale_payments_bw before insert or update on public.sale_payments
  for each row execute function public.sale_payments_before_write();

create or replace function public.sale_payments_after_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.recompute_sale_payment(coalesce(new.sale_id, old.sale_id));
  return null;
end; $$;
create trigger sale_payments_aw after insert or update or delete on public.sale_payments
  for each row execute function public.sale_payments_after_write();

-- ---------------------------------------------------------------------
-- Dépenses
-- ---------------------------------------------------------------------
create or replace function public.expenses_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_cur text; v_cat_biz uuid; v_cat_found boolean; v_count integer; v_max integer;
begin
  if tg_op = 'UPDATE' then
    new.business_id := old.business_id;
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
  else
    select count(*) into v_count from public.expenses
     where business_id = new.business_id and created_at >= public.business_month_start(new.business_id);
    v_max := public.plan_limit(public.business_plan(new.business_id), 'max_expenses_month');
    if v_max is not null and v_count >= v_max then
      raise exception 'BP004 monthly expenses limit reached' using errcode = 'P0001';
    end if;
  end if;

  select true, business_id into v_cat_found, v_cat_biz from public.expense_categories where id = new.category_id;
  if v_cat_found is null or (v_cat_biz is not null and v_cat_biz <> new.business_id) then
    raise exception 'BP050 invalid category' using errcode = 'P0001';
  end if;

  if new.receipt_path is not null and (tg_op = 'INSERT' or new.receipt_path is distinct from old.receipt_path) then
    if not public.has_feature(new.business_id, 'receipts') then
      raise exception 'BP041 feature receipts not in plan' using errcode = 'P0001';
    end if;
    if split_part(new.receipt_path, '/', 1) <> new.business_id::text then
      raise exception 'BP051 invalid receipt path' using errcode = 'P0001';
    end if;
  end if;

  select currency into v_cur from public.businesses where id = new.business_id;
  new.currency := v_cur;
  new.amount := public.round_money(new.amount, v_cur);
  if new.amount <= 0 then raise exception 'BP052 amount must be positive' using errcode = 'P0001'; end if;
  return new;
end; $$;
create trigger expenses_bw before insert or update on public.expenses
  for each row execute function public.expenses_before_write();

-- ---------------------------------------------------------------------
-- RPC : créer une vente + son premier paiement en une seule transaction
-- (security invoker : les règles RLS de l'utilisateur s'appliquent)
-- ---------------------------------------------------------------------
create or replace function public.create_sale(
  p_business uuid, p_product uuid, p_item_name text, p_quantity numeric, p_unit_price numeric,
  p_sale_date date, p_customer text, p_payment_method text, p_amount_paid numeric, p_note text default '')
returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.sales (business_id, product_id, item_name, quantity, unit_price, sale_date,
                            customer_name, payment_method, note)
  values (p_business, p_product, coalesce(p_item_name, ''), p_quantity, p_unit_price, p_sale_date,
          coalesce(p_customer, ''), p_payment_method, coalesce(p_note, ''))
  returning id into v_id;
  if coalesce(p_amount_paid, 0) > 0 then
    insert into public.sale_payments (sale_id, business_id, amount, currency, paid_on, method)
    values (v_id, p_business, p_amount_paid, 'USD', p_sale_date, p_payment_method); -- devise/entreprise forcées par trigger
  end if;
  return v_id;
end; $$;

-- RPC : entrée / ajustement de stock
create or replace function public.add_stock_movement(p_product uuid, p_kind text, p_quantity numeric, p_note text default '')
returns void language plpgsql security invoker set search_path = '' as $$
declare v_business uuid;
begin
  if p_kind not in ('restock','adjustment') then raise exception 'BP024 invalid movement kind' using errcode = 'P0001'; end if;
  if p_kind = 'restock' and p_quantity <= 0 then raise exception 'BP025 restock must be positive' using errcode = 'P0001'; end if;
  select business_id into v_business from public.products where id = p_product;  -- RLS : null si pas membre
  if v_business is null then raise exception 'BP022 product not in business' using errcode = 'P0001'; end if;
  insert into public.stock_movements (business_id, product_id, kind, quantity, note)
  values (v_business, p_product, p_kind, p_quantity, coalesce(p_note, ''));
end; $$;

-- RPC : droits et consommation de la formule pour une entreprise
create or replace function public.my_entitlements(p_business uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_plan text; v_start timestamptz; r jsonb;
begin
  if not public.is_member(p_business) then raise exception 'BP090 forbidden' using errcode = 'P0001'; end if;
  v_plan := public.business_plan(p_business);
  v_start := public.business_month_start(p_business);
  select jsonb_build_object(
    'plan', v_plan,
    'features', to_jsonb(p.features),
    'limits', p.limits,
    'usage', jsonb_build_object(
       'sales_month',    (select count(*) from public.sales where business_id = p_business and created_at >= v_start),
       'expenses_month', (select count(*) from public.expenses where business_id = p_business and created_at >= v_start),
       'products',       (select count(*) from public.products where business_id = p_business and not archived)))
  into r from public.plans p where p.code = v_plan;
  return r;
end; $$;

-- ---------------------------------------------------------------------
-- Tableau de bord : calculs 100 % déterministes en SQL
-- ---------------------------------------------------------------------
create or replace function public.check_period_allowed(p_business uuid, p_from date, p_to date)
returns void language plpgsql stable security definer set search_path = '' as $$
declare v_today date; v_month_start date;
begin
  if not public.is_member(p_business) then raise exception 'BP090 forbidden' using errcode = 'P0001'; end if;
  if p_from > p_to then raise exception 'BP060 invalid period' using errcode = 'P0001'; end if;
  if p_to - p_from > 3700 then raise exception 'BP061 period too long' using errcode = 'P0001'; end if;
  if not public.has_feature(p_business, 'all_periods') then
    select (now() at time zone timezone)::date into v_today from public.businesses where id = p_business;
    v_month_start := date_trunc('month', v_today)::date;
    if p_from < v_month_start then
      raise exception 'BP042 feature all_periods not in plan' using errcode = 'P0001';
    end if;
  end if;
end; $$;

create or replace function public.dashboard_summary(p_business uuid, p_from date, p_to date)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  v_cur text; v_bucket text; r jsonb;
begin
  perform public.check_period_allowed(p_business, p_from, p_to);
  select currency into v_cur from public.businesses where id = p_business;
  v_bucket := case when p_to - p_from <= 62 then 'day' else 'month' end;

  with s as (
    select * from public.sales where business_id = p_business and currency = v_cur
      and sale_date between p_from and p_to),
  pay as (
    select * from public.sale_payments where business_id = p_business and currency = v_cur
      and paid_on between p_from and p_to),
  e as (
    select * from public.expenses where business_id = p_business and currency = v_cur
      and expense_date between p_from and p_to),
  prod as (
    select * from public.products where business_id = p_business and not archived and currency = v_cur),
  buckets as (
    select generate_series(date_trunc(v_bucket, p_from::timestamp), date_trunc(v_bucket, p_to::timestamp),
                           ('1 ' || v_bucket)::interval)::date as b)
  select jsonb_build_object(
    'currency', v_cur,
    'from', p_from, 'to', p_to, 'bucket', v_bucket,
    'revenue',          (select coalesce(sum(total), 0) from s),
    'collected',        (select coalesce(sum(amount), 0) from pay),
    'expenses',         (select coalesce(sum(amount), 0) from e),
    'estimated_result', (select coalesce(sum(total), 0) from s) - (select coalesce(sum(amount), 0) from e),
    'sales_count',      (select count(*) from s),
    'pending_period',   (select coalesce(sum(total - amount_paid), 0) from s where status <> 'paid'),
    'pending_total',    (select coalesce(sum(total - amount_paid), 0) from public.sales
                           where business_id = p_business and currency = v_cur and status <> 'paid'),
    'pending_count',    (select count(*) from public.sales
                           where business_id = p_business and currency = v_cur and status <> 'paid'),
    'stock_value',      (select coalesce(sum(greatest(stock_quantity, 0) * unit_cost), 0) from prod),
    'low_stock',        (select count(*) from prod where stock_quantity > 0 and stock_quantity <= low_stock_threshold),
    'out_of_stock',     (select count(*) from prod where stock_quantity <= 0),
    'series', (select coalesce(jsonb_agg(jsonb_build_object(
                 'bucket', b,
                 'revenue',  (select coalesce(sum(total), 0) from s where date_trunc(v_bucket, s.sale_date::timestamp)::date = b),
                 'expenses', (select coalesce(sum(amount), 0) from e where date_trunc(v_bucket, e.expense_date::timestamp)::date = b),
                 'collected',(select coalesce(sum(amount), 0) from pay where date_trunc(v_bucket, pay.paid_on::timestamp)::date = b)
               ) order by b), '[]'::jsonb) from buckets),
    'top_products', (select coalesce(jsonb_agg(t order by t.revenue desc), '[]'::jsonb) from (
                 select item_name as name, sum(quantity) as quantity, sum(total) as revenue
                 from s group by item_name order by sum(total) desc limit 5) t),
    'expenses_by_category', (select coalesce(jsonb_agg(t order by t.amount desc), '[]'::jsonb) from (
                 select c.code, c.name, sum(e.amount) as amount
                 from e join public.expense_categories c on c.id = e.category_id
                 group by c.code, c.name) t),
    'stock_alerts', (select coalesce(jsonb_agg(t order by t.stock_quantity), '[]'::jsonb) from (
                 select id, name, stock_quantity, low_stock_threshold from prod
                 where stock_quantity <= low_stock_threshold order by stock_quantity limit 10) t)
  ) into r;
  return r;
end; $$;

-- Données de rapport (mêmes règles de période ; export réservé aux formules payantes côté route serveur)
create or replace function public.report_data(p_business uuid, p_from date, p_to date)
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare v_cur text; r jsonb;
begin
  perform public.check_period_allowed(p_business, p_from, p_to);
  select currency into v_cur from public.businesses where id = p_business;
  select jsonb_build_object(
    'summary', public.dashboard_summary(p_business, p_from, p_to),
    'sales', (select coalesce(jsonb_agg(t order by t.sale_date, t.created_at), '[]'::jsonb) from (
        select sale_date, item_name, quantity, unit_price, total, amount_paid, (total - amount_paid) as remaining,
               status, customer_name, payment_method, currency, created_at
        from public.sales where business_id = p_business and currency = v_cur and sale_date between p_from and p_to) t),
    'expenses', (select coalesce(jsonb_agg(t order by t.expense_date, t.created_at), '[]'::jsonb) from (
        select e.expense_date, e.name, c.code as category_code, c.name as category_name, e.amount,
               e.payment_method, e.currency, e.created_at
        from public.expenses e join public.expense_categories c on c.id = e.category_id
        where e.business_id = p_business and e.currency = v_cur and e.expense_date between p_from and p_to) t),
    'stock', (select coalesce(jsonb_agg(t order by t.name), '[]'::jsonb) from (
        select name, sku, category, stock_quantity, low_stock_threshold, unit_cost, sale_price,
               greatest(stock_quantity, 0) * unit_cost as stock_value, currency
        from public.products where business_id = p_business and not archived) t),
    'pending', (select coalesce(jsonb_agg(t order by t.sale_date), '[]'::jsonb) from (
        select sale_date, item_name, customer_name, total, amount_paid, (total - amount_paid) as remaining, currency
        from public.sales where business_id = p_business and currency = v_cur and status <> 'paid') t)
  ) into r;
  return r;
end; $$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.currencies          enable row level security;
alter table public.plans               enable row level security;
alter table public.profiles            enable row level security;
alter table public.subscriptions       enable row level security;
alter table public.platform_admins     enable row level security;
alter table public.businesses          enable row level security;
alter table public.business_members    enable row level security;
alter table public.products            enable row level security;
alter table public.stock_movements     enable row level security;
alter table public.sales               enable row level security;
alter table public.sale_payments       enable row level security;
alter table public.expense_categories  enable row level security;
alter table public.expenses            enable row level security;
alter table public.error_logs          enable row level security;

create policy "read currencies" on public.currencies for select to anon, authenticated using (true);
create policy "read active plans" on public.plans for select to anon, authenticated using (is_active);

create policy "own profile read"   on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own subscription read" on public.subscriptions for select to authenticated using (user_id = auth.uid());
-- aucune écriture : les abonnements sont écrits par le serveur (webhook du prestataire)
-- platform_admins : aucune policy => inaccessible depuis l'application

create policy "members read business" on public.businesses for select to authenticated using (owner_id = auth.uid() or public.is_member(id));
create policy "create own business"   on public.businesses for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates business" on public.businesses for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner deletes business" on public.businesses for delete to authenticated using (owner_id = auth.uid());

create policy "members read members" on public.business_members for select to authenticated using (public.is_member(business_id));

create policy "members all products" on public.products for all to authenticated
  using (public.is_member(business_id)) with check (public.is_member(business_id));

create policy "members read movements"   on public.stock_movements for select to authenticated using (public.is_member(business_id));
create policy "members insert movements" on public.stock_movements for insert to authenticated
  with check (public.is_member(business_id) and kind in ('restock','adjustment'));
-- pas d'update / delete : journal non modifiable

create policy "members all sales" on public.sales for all to authenticated
  using (public.is_member(business_id)) with check (public.is_member(business_id));
create policy "members all payments" on public.sale_payments for all to authenticated
  using (public.is_member(business_id)) with check (public.is_member(business_id));

create policy "read categories" on public.expense_categories for select to authenticated
  using (business_id is null or public.is_member(business_id));
create policy "members write categories" on public.expense_categories for insert to authenticated
  with check (business_id is not null and public.is_member(business_id));
create policy "members update categories" on public.expense_categories for update to authenticated
  using (business_id is not null and public.is_member(business_id)) with check (business_id is not null and public.is_member(business_id));
create policy "members delete categories" on public.expense_categories for delete to authenticated
  using (business_id is not null and public.is_member(business_id));

create policy "members all expenses" on public.expenses for all to authenticated
  using (public.is_member(business_id)) with check (public.is_member(business_id));

create policy "log own errors" on public.error_logs for insert to authenticated with check (user_id = auth.uid());

-- Les fonctions internes ne sont pas appelables directement par les clients.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.recompute_sale_payment(uuid) from public, anon, authenticated;
revoke execute on function public.plan_limit(text, text) from anon;
revoke execute on function public.plan_for_user(uuid) from anon, authenticated;
-- Un utilisateur ne peut pas interroger la formule d'un autre compte
grant execute on function public.plan_for_user(uuid) to service_role;

-- ---------------------------------------------------------------------
-- Stockage des justificatifs : bucket privé, dossier = id de l'entreprise
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy "receipts read" on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "receipts upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts'
              and public.is_member(((storage.foldername(name))[1])::uuid)
              and public.has_feature(((storage.foldername(name))[1])::uuid, 'receipts'));
create policy "receipts delete" on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and public.is_member(((storage.foldername(name))[1])::uuid));
