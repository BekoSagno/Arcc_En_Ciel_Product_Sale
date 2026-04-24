export function formatGNF(amount: number) {
  // Format lisible Guinée (espaces fines si dispo)
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(amount);
}

