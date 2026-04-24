import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Nombre de ventes `completed` pour un slug (produit publié), via RPC sécurisée.
 * Retourne 0 si la fonction SQL n’est pas déployée ou en cas d’erreur.
 */
export async function getCompletedSalesCountForSlug(
  supabase: SupabaseClient,
  slug: string
): Promise<number> {
  const { data, error } = await supabase.rpc("completed_sales_count_for_slug", {
    product_slug: slug,
  });
  if (error) return 0;
  const raw = data as unknown;
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number(raw)
        : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}
