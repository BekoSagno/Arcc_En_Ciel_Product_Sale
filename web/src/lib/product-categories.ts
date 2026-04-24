export const PRODUCT_CATEGORIES = [
  "Ordinateurs",
  "Accessoires",
  "Logiciels",
  "Réseau",
  "Services",
  "Autres",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function normalizeCategory(raw: unknown): string {
  const s = String(raw ?? "").trim();
  return s || "Autres";
}

