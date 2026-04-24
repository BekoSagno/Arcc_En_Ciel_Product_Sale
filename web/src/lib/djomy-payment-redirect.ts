/**
 * Ajoute le slug produit à l’URL de paiement Djomy pour qu’il puisse le renvoyer
 * dans le webhook (query → metadata selon leur stack, ou au minimum côté logs).
 * Le webhook côté app lit aussi metadata.slug et slug racine.
 */
export function withProductSlugOnPaymentLink(
  paymentUrl: string,
  slug: string
): string {
  const s = slug.trim();
  if (!s) return paymentUrl;
  try {
    const u = new URL(paymentUrl);
    if (!u.searchParams.has("slug")) u.searchParams.set("slug", s);
    /* convention courante metadata en query (PHP / gateways) */
    if (!u.searchParams.has("metadata[slug]")) {
      u.searchParams.set("metadata[slug]", s);
    }
    return u.toString();
  } catch {
    return paymentUrl;
  }
}
