import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { sendDeliveryEmail } from "@/lib/email/delivery";

export const dynamic = "force-dynamic";

type ProductRow = { title: string; slug: string };

function normalizeProduct(
  row: unknown
): ProductRow | null {
  if (!row || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const slug = typeof o.slug === "string" ? o.slug.trim() : "";
  if (!title) return null;
  return { title, slug };
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ saleId: string }> }
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

  const { saleId } = await context.params;
  const id = saleId?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, error: "saleId invalide" }, { status: 400 });
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Configuration serveur incomprète" },
      { status: 503 }
    );
  }

  const { data: sale, error: fetchError } = await admin
    .from("sales")
    .select(
      "id, customer_email, customer_name, products ( title, slug, product_type )"
    )
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !sale) {
    return NextResponse.json(
      { ok: false, error: fetchError?.message ?? "Commande introuvable" },
      { status: 404 }
    );
  }

  const email = String(sale.customer_email ?? "").trim();
  if (!email || email === "unknown@example.com") {
    return NextResponse.json(
      { ok: false, error: "Aucun e-mail client valide pour cette commande" },
      { status: 400 }
    );
  }

  const rawProduct = (sale as { products?: unknown }).products;
  const product =
    Array.isArray(rawProduct)
      ? normalizeProduct(rawProduct[0])
      : normalizeProduct(rawProduct);

  const productType =
    (Array.isArray(rawProduct)
      ? (rawProduct[0] as { product_type?: unknown } | undefined)?.product_type
      : (rawProduct as { product_type?: unknown } | undefined)?.product_type) === "physical"
      ? "physical"
      : "electronic";
  if (productType === "physical") {
    return NextResponse.json(
      { ok: false, error: "Produit physique : aucune livraison automatique à renvoyer." },
      { status: 400 }
    );
  }

  const name =
    typeof sale.customer_name === "string" ? sale.customer_name.trim() : null;

  try {
    await sendDeliveryEmail({
      to: email,
      customerName: name || undefined,
      productTitle: product?.title ?? undefined,
      saleId: sale.id,
      slug: product?.slug ?? null,
    });

    await admin
      .from("sales")
      .update({ is_delivered: true, delivery_error: null })
      .eq("id", sale.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await admin
      .from("sales")
      .update({ is_delivered: false, delivery_error: msg.slice(0, 500) })
      .eq("id", sale.id);

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
