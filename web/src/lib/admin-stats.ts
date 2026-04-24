import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

/** Nombre total de vues enregistrées (toutes pages produit). Nécessite la clé service role. */
export async function getPageViewCount(): Promise<number | null> {
  if (!env.supabaseServiceRoleKey) return null;
  try {
    const admin = createSupabaseAdminClient();
    const { count, error } = await admin
      .from("page_views")
      .select("id", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}
