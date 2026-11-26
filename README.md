# Biz Pilot Digital — Phases 1 à 7

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

## Phase 2 — Intelligence
- **Smart Pricing** : statut par produit (à perte / marge faible / rentable), marge ≠ majoration, prix conseillé selon la marge cible (arrondi au supérieur), perte réelle sur les ventes des 90 derniers jours, simulateur, alerte à la saisie d'une vente.
- **Future Forecast** (7/30/60/90 j) : revenus, encaissements, dépenses avec fourchette, trésorerie (si solde de départ renseigné), risque de manque de liquidité, réassort conseillé. Affiche période, données utilisées, hypothèses, limites, niveau de confiance ; refuse de prévoir avec moins de 14 jours / 10 ventes.
- **Smart Coach** : 8 règles (baisse des ventes, dépenses peu rentables, ventes à perte, marge faible, risque de rupture, paiements en retard, invendus, produit vedette). Chaque conseil : problème, chiffre réel, explication, action, bénéfice potentiel, priorité, période ; historique, « traité », expiration automatique.
- **IA (facultative)** : reformule les faits calculés. Garde-fou : tout nombre absent des faits ⇒ texte rejeté et remplacé par l'explication standard. Quota 30 appels / jour / entreprise, journal `ai_usage`.
- Droits vérifiés en base : Smart Pricing complet = Standard+, prévisions et coach = Premium+.

## Phase 3 — Abonnements (Paddle, Merchant of Record)
- Page « Formules » : Free / Standard / Premium / Business ; prix facturés en USD, EUR (zone euro) ou GBP (Royaume-Uni), équivalent GNF affiché à titre indicatif.
- Paiement : transaction créée côté serveur (liée au compte), paiement dans la fenêtre sécurisée Paddle.js.
- **Activation uniquement par webhook signé** (HMAC-SHA256, fenêtre anti-rejeu 5 min, idempotence, événements hors d'ordre ignorés). La page de succès n'active rien.
- Changement de formule au prorata, portail client Paddle (factures, carte, annulation), paiement en retard toléré 7 jours, annulation programmée, retour automatique en Free.
- Espace admin `/admin` (propriétaire uniquement, vérifié en base) : état de la configuration, création des produits/prix Paddle, journal des paiements et des erreurs.
- Pages légales FR/EN (`/legal/terms`, `/legal/privacy`, `/legal/refund`, `/legal/notice`) : **brouillons à faire relire**.

### Mise en route Paddle (sandbox d'abord)
1. Supabase > SQL Editor : exécuter `supabase/migrations/20261125000004_billing.sql`.
2. Se déclarer admin (une fois) : `insert into platform_admins (user_id) select id from auth.users where email = 'VOTRE_EMAIL';`
3. Créer un compte sur https://sandbox-vendors.paddle.com.
   - Developer tools > Authentication : créer une **clé API** et un **client-side token**.
   - Developer tools > Notifications : nouvelle destination → URL affichée dans `/admin`, événements `subscription.*` et `transaction.completed` → copier le **secret**.
   - Checkout > Checkout settings : lien de paiement par défaut = `https://VOTRE-DOMAINE/app/billing`.
4. Vercel > Environment Variables : `NEXT_PUBLIC_PADDLE_ENV=sandbox`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (+ variables légales). Redéployer.
5. `/admin/billing` → « Créer les produits et prix dans Paddle ».
6. Tester avec une carte de test Paddle (sandbox) depuis `/app/billing`.
7. Passage en réel : refaire 3 à 5 sur https://vendors.paddle.com avec `NEXT_PUBLIC_PADDLE_ENV=production`, après approbation du compte et du domaine par Paddle.

## Phase 4 — Espace admin (`/admin`, propriétaire uniquement)
- Tableau de bord : utilisateurs, inscriptions, entreprises actives, abonnés payants, revenu mensuel estimé, activité, erreurs.
- Utilisateurs : recherche, formule effective, origine (Paddle / offert / test), accès offert de 1 à 365 jours (bloqué si abonnement Paddle payé).
- Entreprises : recherche, propriétaire, volumes, dernière activité.
- Formules : limites, fonctions incluses, formule en vente ou non ; **interrupteurs généraux** qui coupent une fonction pour tous ; **changement de prix** (nouveau tarif Paddle, anciens abonnés conservés).
- Paiements (configuration Paddle, création des tarifs, événements) et journaux (erreurs + journal des actions admin).
- Sécurité : chaque fonction admin vérifie `platform_admins` **dans la base** ; aucune fonction ne permet de devenir admin.

Mise à jour : exécuter `supabase/migrations/20261125000005_admin.sql` (une fois), puis redéployer.

## Architecture
- `src/` : Next.js 15 (App Router) + TypeScript + Tailwind CSS 4.
- `supabase/migrations/` : schéma PostgreSQL, triggers métier, RLS, stockage.
- `supabase/tests/phase1_test.sql` (57), `phase2_test.sql` (41), `phase3_test.sql` (25), `phase4_test.sql` (35).
- `tests/e2e_phase1.py` (27), `e2e_phase2.py` (18), `e2e_phase3.py` (21), `e2e_phase4.py` (13) : tests navigateur de bout en bout.
- `dev/local-stack/mock-paddle.js`, `mock-ai.js` : faux serveurs pour les tests locaux uniquement.
- `tests/ai_guard_test.mts` : tests du garde-fou des chiffres de l'IA.
- `dev/local-stack/` : stack locale de test (Postgres + PostgREST + GoTrue). Non utilisée en production.

## Mise à jour vers la phase 2 (projet déjà en ligne)
1. Supabase > SQL Editor : exécuter `supabase/migrations/20261125000003_intelligence.sql` (une seule fois).
2. Vercel : redéployer. Facultatif : ajouter `ANTHROPIC_API_KEY` (clé API Anthropic, côté serveur uniquement) pour activer le bouton « Expliquer avec l'IA ». Sans clé, tout fonctionne avec les explications standard.
3. Paramètres de l'appli : renseigner marge cible, marge minimale et solde de caisse de départ.

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
