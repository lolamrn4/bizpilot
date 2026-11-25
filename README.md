# Biz Pilot Digital — Phase 1 (Gestion)

> Gérez votre entreprise, comprenez vos chiffres, prenez de meilleures décisions. — *Think Smarter, Grow Better.*

## Ce qui est construit
- Comptes : inscription, confirmation e-mail, connexion, mot de passe oublié, profil, changement de mot de passe.
- Entreprise : nom, propriétaire, secteur, ville, devise (USD, EUR, GBP, GNF, XOF, NGN), fuseau horaire.
- Produits & stock : coûts détaillés, prix de vente, marge ≠ majoration, alerte vente à perte / marge faible, seuil d'alerte, journal de stock (réassort, ajustement), archivage.
- Ventes : produit ou article libre, quantité, prix, client, moyen de paiement, payé / partiel / en attente, paiements multiples, recherche, filtres, modification, suppression (stock corrigé automatiquement).
- Dépenses : 11 catégories + catégories personnalisées, justificatif (photo/PDF) en stockage privé.
- Tableau de bord dynamique avec filtres (jour, semaine, mois, trimestre, année, personnalisé) et graphiques.
- Rapports (synthèse, ventes, dépenses, stock, impayés) + export CSV/PDF + sauvegarde JSON.
- FR/EN intégral, PWA installable, logo original.
- Formules Free / Standard / Premium / Business : **limites vérifiées dans la base de données** (pas seulement dans l'interface).

## Architecture
- `src/` : Next.js 15 (App Router) + TypeScript + Tailwind CSS 4.
- `supabase/migrations/` : schéma PostgreSQL, triggers métier, RLS, stockage.
- `supabase/tests/phase1_test.sql` : 57 tests SQL (sécurité + calculs).
- `tests/e2e_phase1.py` : 27 tests navigateur de bout en bout.
- `dev/local-stack/` : stack locale de test (Postgres + PostgREST + GoTrue). Non utilisée en production.

## Mise en ligne (à faire une fois les comptes créés)
1. Créer un projet Supabase (région Europe recommandée).
2. SQL Editor : exécuter dans l'ordre les fichiers de `supabase/migrations/`.
3. Authentication > URL Configuration : Site URL = `NEXT_PUBLIC_SITE_URL`, Redirect URLs = `https://VOTRE-DOMAINE/auth/callback`.
4. Authentication > SMTP : brancher un service d'e-mail (Resend, Brevo…) — l'envoi intégré de Supabase est limité.
5. Déployer sur Vercel avec les 3 variables de `.env.example`.
6. Vérifier : `psql "$DATABASE_URL" -f supabase/tests/phase1_test.sql`.

## Développement local
```bash
npm install
cp .env.example .env.local   # renseigner les valeurs
npm run dev
```
