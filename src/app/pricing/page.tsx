import { redirect } from "next/navigation";

/** Adresse publique de la grille tarifaire (demandée par Paddle) : renvoie vers la section « Formules » de l'accueil. */
export default function PricingPage() {
  redirect("/#pricing");
}
