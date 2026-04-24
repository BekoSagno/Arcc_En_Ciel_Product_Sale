/** Libellés lisibles pour le statut de paiement (flux Djomy côté app). */
export function formatDjomyPaymentStatus(status: string): string {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "completed") return "Payé";
  if (s === "pending") return "En attente";
  if (s === "failed") return "Échoué";
  if (!s) return "—";
  return status;
}
