-- Droits d'accès des rôles de l'appli sur les tables ajoutées depuis la phase 2.
-- Le projet Supabase de production n'accorde plus ces droits automatiquement aux nouvelles tables.
-- La protection ligne par ligne (RLS) reste active sur toutes ces tables.
grant select, insert, update, delete on
  public.admin_audit, public.ai_usage, public.billing_events, public.business_invitations,
  public.customers, public.feature_flags, public.forecasts, public.plan_display_prices,
  public.plan_provider_prices, public.plan_provider_prices_history, public.recommendations
  to authenticated, service_role;
grant select on public.plan_display_prices, public.plan_provider_prices, public.feature_flags to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
