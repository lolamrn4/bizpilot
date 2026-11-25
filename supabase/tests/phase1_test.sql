-- Tests automatisés de la phase 1 (sécurité RLS + règles métier).
-- Exécution : psql -v ON_ERROR_STOP=1 -f supabase/tests/phase1_test.sql
-- Tout se déroule dans une transaction annulée à la fin.
begin;

create or replace function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
end $$;
create or replace function pg_temp.as_admin() returns void language plpgsql as $$
begin perform set_config('role', 'postgres', true); perform set_config('request.jwt.claims', '', true); end $$;
create or replace function pg_temp.ok(cond boolean, label text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'ÉCHEC : %', label; end if; raise notice 'OK  %', label; end $$;
create or replace function pg_temp.expect_error(stmt text, code text, label text) returns void language plpgsql as $$
begin
  begin execute stmt;
  exception when others then
    if position(code in sqlerrm) > 0 then raise notice 'OK  % (%)', label, code; return; end if;
    raise exception 'ÉCHEC : % — erreur inattendue : %', label, sqlerrm;
  end;
  raise exception 'ÉCHEC : % — aucune erreur levée', label;
end $$;

-- Deux comptes : Alice (Free) et Bob (Free)
insert into auth.users (id, email, raw_user_meta_data, aud, role, instance_id)
values ('00000000-0000-0000-0000-00000000000a', 'alice@test.local', '{"full_name":"Alice","language":"en"}', 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'),
       ('00000000-0000-0000-0000-00000000000b', 'bob@test.local',   '{"full_name":"Bob"}',                    'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000');

select pg_temp.ok((select language from profiles where id = '00000000-0000-0000-0000-00000000000a') = 'en', 'profil créé avec la langue choisie');
select pg_temp.ok((select plan_code from subscriptions where user_id = '00000000-0000-0000-0000-00000000000b') = 'free', 'formule Free attribuée à l''inscription');

-- ===== Alice crée son entreprise en EUR =====
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into businesses (id, name, owner_name, sector, city, currency, timezone)
values ('10000000-0000-0000-0000-00000000000a', 'Alice Shop', 'Alice', 'Mode', 'Paris', 'EUR', 'Europe/Paris') returning id; -- RETURNING = cas réel de l'appli
select pg_temp.ok((select role from business_members where business_id = '10000000-0000-0000-0000-00000000000a') = 'owner', 'propriétaire ajouté comme membre');
select pg_temp.expect_error($$insert into businesses (name, owner_name, currency, timezone) values ('B2','Alice','EUR','Europe/Paris')$$, 'BP001', 'Free : une seule entreprise');
select pg_temp.expect_error($$update businesses set timezone='Mars/Base' where id='10000000-0000-0000-0000-00000000000a'$$, 'BP010', 'fuseau horaire invalide refusé');

-- Produit avec stock initial 10, coût 10 €
insert into products (id, business_id, name, purchase_price, transport_cost, packaging_cost, sale_price, stock_quantity, low_stock_threshold, currency)
values ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Sac', 8, 1.5, 0.5, 14.29, 10, 3, 'GNF');
select pg_temp.ok((select currency from products where id='20000000-0000-0000-0000-00000000000a') = 'EUR', 'devise du produit = devise de l''entreprise (jamais imposée)');
select pg_temp.ok((select unit_cost from products where id='20000000-0000-0000-0000-00000000000a') = 10, 'coût unitaire total = 10');
select pg_temp.ok((select stock_quantity from products where id='20000000-0000-0000-0000-00000000000a') = 10, 'stock initial = 10');
select pg_temp.ok((select count(*) from stock_movements where kind='initial') = 1, 'mouvement « stock initial » journalisé');
select pg_temp.expect_error($$update products set stock_quantity = 999 where id='20000000-0000-0000-0000-00000000000a'$$, 'BP020', 'stock non modifiable directement');

-- Vente payée de 3 sacs
select pg_temp.ok(create_sale('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', null, 3, 14.29, current_date, 'Client A', 'cash', 42.87) is not null, 'vente créée via RPC');
select pg_temp.ok((select stock_quantity from products where id='20000000-0000-0000-0000-00000000000a') = 7, 'stock diminué à 7 après la vente');
select pg_temp.ok((select status from sales limit 1) = 'paid', 'vente payée => statut payé');
select pg_temp.ok((select item_name from sales limit 1) = 'Sac', 'nom de l''article repris du produit');

-- Free : paiement partiel interdit
select pg_temp.expect_error($$select create_sale('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', null, 1, 14.29, current_date, '', 'cash', 5)$$, 'BP040', 'Free : paiement partiel refusé côté serveur');
-- Vente en attente (0 payé) autorisée
select create_sale('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', null, 2, 15, current_date, 'Client B', 'cash', 0);
select pg_temp.ok((select status from sales where customer_name='Client B') = 'pending', 'vente en attente');
select pg_temp.ok((select stock_quantity from products where id='20000000-0000-0000-0000-00000000000a') = 5, 'stock = 5');
select pg_temp.expect_error($$select create_sale('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', null, 50, 15, current_date, '', 'cash', 0)$$, 'BP023', 'vente au-delà du stock refusée');
update sales set amount_paid = 999, status='paid' where customer_name='Client B';
select pg_temp.ok((select amount_paid from sales where customer_name='Client B') = 0, 'amount_paid non falsifiable');

-- Modifier la quantité d'une vente => mouvement correctif
update sales set quantity = 1 where customer_name='Client B';
select pg_temp.ok((select stock_quantity from products where id='20000000-0000-0000-0000-00000000000a') = 6, 'modification de quantité : stock corrigé à 6');
-- Supprimer la vente => stock restitué
delete from sales where customer_name='Client B';
select pg_temp.ok((select stock_quantity from products where id='20000000-0000-0000-0000-00000000000a') = 7, 'suppression : stock restitué à 7');

-- Réassort + ajustement
select add_stock_movement('20000000-0000-0000-0000-00000000000a', 'restock', 5, 'Arrivage');
select pg_temp.ok((select stock_quantity from products where id='20000000-0000-0000-0000-00000000000a') = 12, 'réapprovisionnement +5 => 12');
select pg_temp.expect_error($$select add_stock_movement('20000000-0000-0000-0000-00000000000a', 'adjustment', -100, '')$$, 'BP023', 'ajustement négatif impossible sous zéro');
select pg_temp.expect_error($$insert into stock_movements (business_id, product_id, kind, quantity) values ('10000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-00000000000a','sale',-1)$$, 'row-level security', 'client ne peut pas forger un mouvement « vente »');

-- Dépenses
insert into expenses (business_id, name, category_id, amount, expense_date, currency)
select '10000000-0000-0000-0000-00000000000a', 'Loyer', id, 300, current_date, 'USD' from expense_categories where code='rent';
select pg_temp.ok((select currency from expenses limit 1) = 'EUR', 'dépense enregistrée dans la devise de l''entreprise');
insert into expense_categories (business_id, name) values ('10000000-0000-0000-0000-00000000000a', 'Formation');
select pg_temp.ok((select count(*) from expense_categories) = 12, '11 catégories système + 1 personnalisée visibles');
select pg_temp.expect_error($$update expenses set receipt_path = '10000000-0000-0000-0000-00000000000a/x.pdf'$$, 'BP041', 'Free : justificatif refusé côté serveur');
select pg_temp.expect_error($$update businesses set currency='USD' where id='10000000-0000-0000-0000-00000000000a'$$, 'BP011', 'devise verrouillée une fois des données saisies');

-- Tableau de bord (mois en cours)
select pg_temp.ok((dashboard_summary('10000000-0000-0000-0000-00000000000a', date_trunc('month', current_date)::date, current_date) ->> 'revenue')::numeric = 42.87, 'CA = 42,87');
select pg_temp.ok((dashboard_summary('10000000-0000-0000-0000-00000000000a', date_trunc('month', current_date)::date, current_date) ->> 'expenses')::numeric = 300, 'dépenses = 300');
select pg_temp.ok((dashboard_summary('10000000-0000-0000-0000-00000000000a', date_trunc('month', current_date)::date, current_date) ->> 'estimated_result')::numeric = -257.13, 'résultat estimé = -257,13');
select pg_temp.ok((dashboard_summary('10000000-0000-0000-0000-00000000000a', date_trunc('month', current_date)::date, current_date) ->> 'stock_value')::numeric = 120, 'valeur du stock = 12 × 10 = 120');
select pg_temp.expect_error($$select dashboard_summary('10000000-0000-0000-0000-00000000000a', (current_date - 400), current_date)$$, 'BP042', 'Free : historique hors mois en cours refusé');

-- ===== Bob ne voit RIEN d'Alice =====
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.ok((select count(*) from businesses) = 0, 'Bob ne voit pas l''entreprise d''Alice');
select pg_temp.ok((select count(*) from products) = 0, 'Bob ne voit pas les produits d''Alice');
select pg_temp.ok((select count(*) from sales) = 0, 'Bob ne voit pas les ventes d''Alice');
select pg_temp.ok((select count(*) from expenses) = 0, 'Bob ne voit pas les dépenses d''Alice');
select pg_temp.ok((select count(*) from expense_categories) = 11, 'Bob ne voit pas la catégorie perso d''Alice');
select pg_temp.ok((select count(*) from subscriptions) = 1, 'Bob ne voit que son abonnement');
select pg_temp.expect_error($$select dashboard_summary('10000000-0000-0000-0000-00000000000a', current_date, current_date)$$, 'BP090', 'Bob ne peut pas lire le tableau de bord d''Alice');
select pg_temp.expect_error($$insert into products (business_id, name, currency) values ('10000000-0000-0000-0000-00000000000a','Pirate','EUR')$$, 'row-level security', 'Bob ne peut pas écrire chez Alice');
update sales set unit_price = 0;            -- n'affecte aucune ligne (RLS)
update subscriptions set plan_code='business'; -- aucune policy d'écriture
select pg_temp.ok((select count(*) from platform_admins) = 0, 'table admin invisible');
select pg_temp.as_admin();
select pg_temp.ok((select plan_code from subscriptions where user_id='00000000-0000-0000-0000-00000000000b') = 'free', 'Bob ne peut pas s''auto-attribuer une formule');
select pg_temp.ok((select min(unit_price) from sales) > 0, 'ventes d''Alice intactes après tentative de Bob');

-- ===== Alice passe en Standard (écrit par le serveur, comme le ferait le webhook) =====
update subscriptions set plan_code='standard' where user_id='00000000-0000-0000-0000-00000000000a';
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select create_sale('10000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a', null, 2, 14.29, current_date, 'Client C', 'mobile_money', 10);
select pg_temp.ok((select status from sales where customer_name='Client C') = 'partial', 'Standard : paiement partiel => statut partiel');
insert into sale_payments (sale_id, business_id, amount, currency, paid_on) select id, business_id, 18.58, 'EUR', current_date from sales where customer_name='Client C';
select pg_temp.ok((select status from sales where customer_name='Client C') = 'paid', 'solde payé => statut payé');
select pg_temp.expect_error($$insert into sale_payments (sale_id, business_id, amount, currency, paid_on) select id, business_id, 1, 'EUR', current_date from sales where customer_name='Client C'$$, 'BP032', 'trop-perçu refusé');
select pg_temp.expect_error($$update sales set quantity = 1 where customer_name='Client C'$$, 'BP030', 'total inférieur au déjà payé refusé');
delete from sale_payments where amount = 18.58;
select pg_temp.ok((select status from sales where customer_name='Client C') = 'partial', 'suppression d''un paiement => retour en partiel');
select pg_temp.ok((dashboard_summary('10000000-0000-0000-0000-00000000000a', current_date - 400, current_date) ->> 'pending_total')::numeric = 18.58, 'Standard : historique long autorisé, reste à encaisser = 18,58');
update expenses set receipt_path = '10000000-0000-0000-0000-00000000000a/recu.pdf';
select pg_temp.expect_error($$update expenses set receipt_path = '99999999-0000-0000-0000-000000000000/recu.pdf'$$, 'BP051', 'justificatif hors dossier de l''entreprise refusé');
insert into storage.objects (bucket_id, name) values ('receipts', '10000000-0000-0000-0000-00000000000a/recu.pdf');
select pg_temp.ok((select count(*) from storage.objects) = 1, 'Standard : upload de justificatif autorisé dans son dossier');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.ok((select count(*) from storage.objects) = 0, 'Bob ne voit pas les justificatifs d''Alice');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name) values ('receipts', '10000000-0000-0000-0000-00000000000a/pirate.pdf')$$, 'row-level security', 'Bob ne peut pas déposer chez Alice');

-- Devise GNF : arrondi à 0 décimale
insert into businesses (id, name, owner_name, currency, timezone) values ('10000000-0000-0000-0000-00000000000b', 'Bob Boutique', 'Bob', 'GNF', 'Africa/Conakry');
insert into products (business_id, name, purchase_price, sale_price, currency) values ('10000000-0000-0000-0000-00000000000b', 'Savon', 1234.56, 2000.4, 'EUR');
select pg_temp.ok((select purchase_price from products where name='Savon') = 1235 and (select currency from products where name='Savon')='GNF', 'GNF : montants arrondis sans décimales');
select pg_temp.ok((select count(*) from products) = 1, 'Bob ne voit que son produit');
select pg_temp.ok((my_entitlements('10000000-0000-0000-0000-00000000000b') ->> 'plan') = 'free', 'droits : Bob en Free');

\echo '=== TOUS LES TESTS SONT PASSÉS ==='

rollback;
