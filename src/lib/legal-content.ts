/**
 * Projets de documents légaux (FR/EN). À FAIRE RELIRE par un professionnel avant mise en ligne réelle :
 * aucune conformité juridique n'est déclarée ici.
 * Les informations d'identité se règlent par variables d'environnement (aucun nom personnel codé en dur).
 */
export const LEGAL = {
  entity: process.env.NEXT_PUBLIC_LEGAL_ENTITY || "[Raison sociale à compléter]",
  // Facultatif : un entrepreneur individuel sans immatriculation n'affiche rien.
  registration: process.env.NEXT_PUBLIC_LEGAL_REGISTRATION || "",
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "[Adresse à compléter]",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "[E-mail de support à compléter]",
  country: process.env.NEXT_PUBLIC_LEGAL_COUNTRY || "[Pays à compléter]",
  reviewed: process.env.NEXT_PUBLIC_LEGAL_REVIEWED === "true",
  updated: "2026-11-25",
};

export const LEGAL_DOCS = ["terms", "privacy", "refund", "notice"] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];
type Section = { h: string; p: string[] };

const L = LEGAL;

export const legalContent: Record<"fr" | "en", Record<LegalDoc, Section[]>> = {
  fr: {
    terms: [
      { h: "1. Objet", p: [`Les présentes conditions régissent l'utilisation du service en ligne « Biz Pilot Digital » (le « Service »), édité par ${L.entity} (l'« Éditeur »). Le Service aide les commerçants et petites entreprises à suivre leurs ventes, dépenses, stocks et rapports, et propose des outils d'analyse.`] },
      { h: "2. Compte", p: ["La création d'un compte nécessite une adresse e-mail valide. Vous êtes responsable de la confidentialité de votre mot de passe et des données que vous saisissez.", "Vous devez fournir des informations exactes et utiliser le Service conformément aux lois applicables."] },
      { h: "3. Formules et prix", p: ["Le Service propose une formule gratuite (Free) et des formules payantes mensuelles (Standard, Premium, Business). Le contenu et le prix de chaque formule sont présentés sur la page « Formules » avant tout achat.", "Les abonnements sont renouvelés automatiquement chaque mois jusqu'à leur annulation. Vous pouvez annuler à tout moment depuis « Gérer mon abonnement » ; l'accès reste actif jusqu'à la fin de la période payée."] },
      { h: "4. Revendeur et paiement (Merchant of Record)", p: ["Nos commandes sont traitées par notre revendeur en ligne Paddle.com. Paddle.com est le Merchant of Record (revendeur officiel) pour toutes nos commandes. Paddle assure le service client lié aux paiements et gère les retours et remboursements.", "Le paiement, la facturation et les taxes éventuelles sont gérés par Paddle selon ses propres conditions d'achat. L'Éditeur n'a jamais accès à vos données de carte bancaire."] },
      { h: "5. Remboursement", p: ["Les conditions de remboursement figurent dans la Politique de remboursement, qui fait partie des présentes conditions."] },
      { h: "6. Calculs et conseils", p: ["Les chiffres, prévisions et recommandations du Service sont calculés à partir des données que vous enregistrez. Ce sont des aides à la décision : ils ne constituent ni un conseil comptable, fiscal, juridique ou financier, ni une garantie de résultat. Vérifiez vos décisions importantes avec un professionnel."] },
      { h: "7. Vos données", p: ["Vous restez propriétaire des données que vous saisissez. Vous pouvez les exporter à tout moment (sauvegarde). Leur traitement est décrit dans la Politique de confidentialité."] },
      { h: "8. Disponibilité et responsabilité", p: ["L'Éditeur fait ses meilleurs efforts pour assurer la disponibilité et la sécurité du Service, sans pouvoir garantir une disponibilité ininterrompue. Dans les limites permises par la loi, la responsabilité de l'Éditeur est limitée au montant payé pour le Service au cours des 12 derniers mois."] },
      { h: "9. Résiliation", p: ["Vous pouvez supprimer votre compte à tout moment en contactant le support. L'Éditeur peut suspendre un compte en cas d'usage frauduleux ou contraire aux présentes conditions."] },
      { h: "10. Modification", p: ["Ces conditions peuvent évoluer. Toute modification importante vous sera signalée avant son entrée en vigueur."] },
      { h: "11. Droit applicable et contact", p: [`Droit applicable : ${L.country}. Contact : ${L.email}.`] },
    ],
    refund: [
      { h: "Garantie de remboursement de 30 jours", p: ["Si vous n'êtes pas satisfait, vous pouvez demander le remboursement intégral de tout paiement d'abonnement dans les 30 jours suivant ce paiement, sans avoir à vous justifier."] },
      { h: "Comment demander un remboursement", p: [`Contactez Paddle, notre revendeur (Merchant of Record), via le lien figurant dans votre reçu de paiement ou sur paddle.net, ou écrivez-nous à ${L.email} : nous transmettrons votre demande. Le remboursement est effectué par Paddle sur le moyen de paiement utilisé.`] },
      { h: "Annulation", p: ["Vous pouvez annuler votre abonnement à tout moment depuis « Gérer mon abonnement ». Aucun nouveau paiement ne sera prélevé ; votre formule reste active jusqu'à la fin de la période payée, puis votre compte repasse en formule Free sans perte de vos données."] },
    ],
    privacy: [
      { h: "1. Responsable du traitement", p: [`${L.entity}, ${L.address}. Contact : ${L.email}.`] },
      { h: "2. Données collectées", p: ["Compte : nom, adresse e-mail, langue, mot de passe (chiffré, jamais lisible par nous).", "Entreprise : nom, secteur, ville, devise, fuseau horaire.", "Données de gestion que vous saisissez : produits, stocks, ventes, clients (nom facultatif), dépenses et justificatifs.", "Données techniques : journaux de sécurité et d'erreurs.", "Paiement : traité par Paddle. Nous recevons uniquement l'état de votre abonnement et des identifiants techniques, jamais vos données de carte."] },
      { h: "3. Finalités", p: ["Fournir le Service (calculs, tableaux de bord, rapports, prévisions, conseils), sécuriser les comptes, gérer les abonnements, répondre au support. Nous ne vendons pas vos données et ne les utilisons pas à des fins publicitaires."] },
      { h: "4. Sous-traitants", p: ["Hébergement de la base de données et authentification : Supabase. Hébergement de l'application : Vercel. Paiements : Paddle (Merchant of Record). Explications par intelligence artificielle (si activées) : Anthropic, qui ne reçoit que des chiffres agrégés déjà calculés, sans votre nom ni votre e-mail.", "Ces prestataires peuvent traiter des données hors de votre pays, avec des garanties contractuelles."] },
      { h: "5. Durée de conservation", p: ["Vos données sont conservées tant que votre compte est actif, puis supprimées dans un délai de 30 jours après la suppression du compte, sauf obligation légale de conservation (par exemple pour les données de facturation détenues par Paddle)."] },
      { h: "6. Vos droits", p: [`Vous pouvez accéder à vos données, les corriger, les exporter (fonction « Sauvegarde ») et demander leur suppression en écrivant à ${L.email}.`] },
      { h: "7. Cookies", p: ["Nous utilisons uniquement des cookies nécessaires : session de connexion, langue choisie et entreprise sélectionnée. Aucun cookie publicitaire."] },
      { h: "8. Sécurité", p: ["Chaque compte n'accède qu'aux données de ses entreprises (contrôle d'accès dans la base de données), connexions chiffrées (HTTPS), clés secrètes conservées uniquement côté serveur."] },
    ],
    notice: [
      { h: "Éditeur", p: [`${[L.entity, L.registration, L.address].filter(Boolean).join(" — ")}. Contact : ${L.email}.`] },
      { h: "Marque", p: ["Biz Pilot Digital est une marque exploitée par l'Éditeur."] },
      { h: "Hébergement", p: ["Application : Vercel Inc. (États-Unis). Base de données : Supabase Inc. (États-Unis). Coordonnées complètes sur leurs sites officiels."] },
      { h: "Paiements", p: ["Les paiements sont traités par Paddle.com Market Ltd, revendeur officiel (Merchant of Record) de nos abonnements."] },
    ],
  },
  en: {
    terms: [
      { h: "1. Purpose", p: [`These terms govern the use of the online service “Biz Pilot Digital” (the “Service”), published by ${L.entity} (the “Publisher”). The Service helps merchants and small businesses track sales, expenses, stock and reports, and provides analysis tools.`] },
      { h: "2. Account", p: ["Creating an account requires a valid email address. You are responsible for keeping your password confidential and for the data you enter.", "You must provide accurate information and use the Service in accordance with applicable laws."] },
      { h: "3. Plans and prices", p: ["The Service offers a free plan (Free) and monthly paid plans (Standard, Premium, Business). The content and price of each plan are shown on the “Plans” page before any purchase.", "Subscriptions renew automatically every month until cancelled. You can cancel at any time from “Manage my subscription”; access remains active until the end of the paid period."] },
      { h: "4. Reseller and payment (Merchant of Record)", p: ["Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries related to payments and handles returns and refunds.", "Payment, invoicing and any applicable taxes are handled by Paddle under its own buyer terms. The Publisher never has access to your card details."] },
      { h: "5. Refunds", p: ["Refund conditions are set out in the Refund Policy, which forms part of these terms."] },
      { h: "6. Calculations and advice", p: ["Figures, forecasts and recommendations are calculated from the data you record. They are decision aids: they are not accounting, tax, legal or financial advice, nor a guarantee of results. Check important decisions with a professional."] },
      { h: "7. Your data", p: ["You remain the owner of the data you enter. You can export it at any time (backup). Its processing is described in the Privacy Policy."] },
      { h: "8. Availability and liability", p: ["The Publisher makes its best efforts to keep the Service available and secure, but cannot guarantee uninterrupted availability. To the extent permitted by law, the Publisher's liability is limited to the amount paid for the Service in the last 12 months."] },
      { h: "9. Termination", p: ["You may delete your account at any time by contacting support. The Publisher may suspend an account in case of fraudulent use or breach of these terms."] },
      { h: "10. Changes", p: ["These terms may change. You will be notified of any significant change before it takes effect."] },
      { h: "11. Governing law and contact", p: [`Governing law: ${L.country}. Contact: ${L.email}.`] },
    ],
    refund: [
      { h: "30-day money-back guarantee", p: ["If you are not satisfied, you can request a full refund of any subscription payment within 30 days of that payment, no questions asked."] },
      { h: "How to request a refund", p: [`Contact Paddle, our reseller (Merchant of Record), via the link in your payment receipt or at paddle.net, or email us at ${L.email} and we will forward your request. Paddle refunds the payment method used.`] },
      { h: "Cancellation", p: ["You can cancel your subscription at any time from “Manage my subscription”. No further payment will be taken; your plan stays active until the end of the paid period, then your account returns to the Free plan without losing your data."] },
    ],
    privacy: [
      { h: "1. Data controller", p: [`${L.entity}, ${L.address}. Contact: ${L.email}.`] },
      { h: "2. Data collected", p: ["Account: name, email address, language, password (encrypted, never readable by us).", "Business: name, industry, city, currency, time zone.", "Management data you enter: products, stock, sales, customers (optional name), expenses and receipts.", "Technical data: security and error logs.", "Payment: handled by Paddle. We only receive your subscription status and technical identifiers, never your card details."] },
      { h: "3. Purposes", p: ["Providing the Service (calculations, dashboards, reports, forecasts, advice), securing accounts, managing subscriptions, answering support requests. We do not sell your data or use it for advertising."] },
      { h: "4. Processors", p: ["Database hosting and authentication: Supabase. Application hosting: Vercel. Payments: Paddle (Merchant of Record). AI explanations (if enabled): Anthropic, which only receives already-calculated aggregate figures, without your name or email.", "These providers may process data outside your country, under contractual safeguards."] },
      { h: "5. Retention", p: ["Your data is kept while your account is active, then deleted within 30 days of account deletion, unless the law requires retention (for example billing records held by Paddle)."] },
      { h: "6. Your rights", p: [`You can access, correct, export (“Backup” feature) and request deletion of your data by writing to ${L.email}.`] },
      { h: "7. Cookies", p: ["We only use necessary cookies: login session, chosen language and selected business. No advertising cookies."] },
      { h: "8. Security", p: ["Each account can only access its own businesses' data (access control in the database), encrypted connections (HTTPS), secret keys kept on the server only."] },
    ],
    notice: [
      { h: "Publisher", p: [`${[L.entity, L.registration, L.address].filter(Boolean).join(" — ")}. Contact: ${L.email}.`] },
      { h: "Brand", p: ["Biz Pilot Digital is a brand operated by the Publisher."] },
      { h: "Hosting", p: ["Application: Vercel Inc. (USA). Database: Supabase Inc. (USA). Full details on their official websites."] },
      { h: "Payments", p: ["Payments are processed by Paddle.com Market Ltd, the Merchant of Record for our subscriptions."] },
    ],
  },
};
