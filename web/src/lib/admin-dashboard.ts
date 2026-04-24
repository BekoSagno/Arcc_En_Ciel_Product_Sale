import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import type { DashboardProductRow } from "@/types/admin-dashboard";

/** CA et nombre de ventes complétées (toutes commandes `completed`). */
export async function fetchCompletedSalesTotals(): Promise<{
  count: number;
  revenue: number;
}> {
  if (!env.supabaseServiceRoleKey) {
    return { count: 0, revenue: 0 };
  }
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("sales")
      .select("amount")
      .eq("status", "completed");
    if (error || !data) return { count: 0, revenue: 0 };
    const revenue = data.reduce(
      (acc, row) => acc + Number((row as { amount: number }).amount ?? 0),
      0
    );
    return { count: data.length, revenue };
  } catch {
    return { count: 0, revenue: 0 };
  }
}

export async function fetchProductCountAll(): Promise<number | null> {
  if (!env.supabaseServiceRoleKey) return null;
  try {
    const admin = createSupabaseAdminClient();
    const { count, error } = await admin
      .from("products")
      .select("id", { count: "exact", head: true });
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

/**
 * Liste produits pour le tableau de bord (brouillons inclus si la clé service role est définie).
 */
export async function fetchDashboardProducts(
  supabase: SupabaseClient,
  limit = 20
): Promise<DashboardProductRow[]> {
  const columns =
    "id, slug, title, category, product_type, price_promo, currency, is_published" as const;

  if (env.supabaseServiceRoleKey) {
    try {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin
        .from("products")
        .select(columns)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (!error && data) return data as unknown as DashboardProductRow[];
    } catch {
      /* repli ci-dessous */
    }
  }

  const { data, error } = await supabase
    .from("products")
    .select(columns)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as unknown as DashboardProductRow[]) ?? [];
}
