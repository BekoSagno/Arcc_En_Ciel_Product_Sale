import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAdminSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
  }

  if (!env.supabaseServiceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manquant" },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  const productId = id?.trim();
  if (!productId) {
    return NextResponse.json({ ok: false, error: "id invalide" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Supprime le produit ; les ventes restent (product_id -> set null) selon le schéma.
  const { error } = await admin.from("products").delete().eq("id", productId);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

