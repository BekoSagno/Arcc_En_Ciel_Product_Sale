/** Exemples modifiables (produits digitaux, vente en ligne, Djomy / GNF). */

export const EXAMPLE_TITLE =
  "Méthode express — Lancez votre première vente de produit digital";

export const EXAMPLE_PRICE_ORIGINAL = 185_000;
/** Montant compatible tests sandbox Djomy (≤ 1000 GNF) — à ajuster en production. */
export const EXAMPLE_PRICE_PROMO = 950;

export const EXAMPLE_TIMER_MINUTES = 20;
export const EXAMPLE_STOCK_TOTAL = 100;
export const EXAMPLE_SALES_INITIAL = 12;

export const EXAMPLE_DESCRIPTION = `Ce pack d’exemple est pensé pour les créateurs, coachs et entrepreneurs qui veulent vendre un produit numérique (guide PDF, mini formation, ressources téléchargeables) en Guinée et en Afrique francophone.

Vous présentez votre offre sur une page claire, le client paie en ligne via un partenaire comme Djomy, et la livraison peut se faire tout de suite après validation du paiement.

Remplacez ce texte par votre vrai argumentaire : bénéfices, pour qui c’est fait, ce qui est inclus.`;

export const EXAMPLE_FEATURES: { title: string; text: string; image_url: string }[] =
  [
    {
      title: "Livraison après achat",
      text: "Dès le paiement validé, le client reçoit un email avec le lien ou les fichiers : idéal pour un ebook, un pack PDF ou un accès simple.",
      image_url: "",
    },
    {
      title: "Paiement en ligne adapté",
      text: "Encaissement via un prestataire (ex. Djomy, cartes et solutions mobiles selon configuration). Vous n’avez pas à gérer les données bancaires sur votre site.",
      image_url: "",
    },
    {
      title: "Page de vente tout-en-un",
      text: "Une seule page : preuve sociale, étapes, disclaimer FAQ. Vous n’avez qu’à adapter les textes et les visuels à votre marque.",
      image_url: "",
    },
  ];

export const EXAMPLE_USE_CASES: { title: string; text: string }[] = [
  {
    title: "Formation ou coach",
    text: "Vendez un module en PDF + un lien vidéo : parfait pour tester l’intérêt avant un gros programme.",
  },
  {
    title: "Créateur ou artisan digital",
    text: "Proposez un kit (modèles, presets, ressources) avec téléchargement immédiat après paiement.",
  },
  {
    title: "Association ou média",
    text: "Monétisez un guide, un dossier thématique ou un hors-série numérique sans logistique papier.",
  },
];

export const EXAMPLE_HOW_IT_WORKS: { text: string }[] = [
  { text: "Lisez la fiche produit : titre, description et ce qui est inclus." },
  { text: "Cliquez sur « Acheter » : vous êtes guidé vers le paiement sécurisé." },
  { text: "Validez le règlement (carte ou autre moyen proposé par le prestataire)." },
  { text: "Recevez l’email de confirmation avec le contenu ou les liens d’accès." },
];

export const EXAMPLE_TESTIMONIALS: {
  name: string;
  rating: number;
  text: string;
  date: string;
}[] = [
  {
    name: "Aminata D.",
    rating: 5,
    text: "Très clair du début à la fin. J’ai reçu le pack par email juste après le paiement.",
    date: "2026-03-12",
  },
  {
    name: "Mohamed S.",
    rating: 5,
    text: "Enfin une présentation simple pour vendre sans me perdre dans la technique.",
    date: "2026-03-24",
  },
];

export const EXAMPLE_FAQS: { question: string; answer: string }[] = [
  {
    question: "Qu’est-ce que je reçois exactement après l’achat ?",
    answer:
      "Vous recevez par email les instructions et les liens ou fichiers prévus pour ce produit (selon ce qui est décrit sur cette page). Conservez ce message comme preuve d’achat.",
  },
  {
    question: "Le paiement est-il sécurisé ?",
    answer:
      "Le règlement s’effectue sur une page du prestataire de paiement (connexion chiffrée). Nous ne conservons pas vos coordonnées bancaires sur notre site.",
  },
  {
    question: "Puis-je être remboursé ?",
    answer:
      "Pour un contenu numérique livré immédiatement, le droit de rétractation peut être limité. En cas de dysfonctionnement avéré, contactez-nous pour trouver une solution.",
  },
];
