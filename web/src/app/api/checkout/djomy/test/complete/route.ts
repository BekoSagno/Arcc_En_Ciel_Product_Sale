import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DJOMY_SANDBOX_MAX_GNF } from "@/lib/djomy-sandbox";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slug = body?.slug as string | undefined;
  const email = body?.email as string | undefined;
  const name = body?.name as string | undefined;

  if (!slug || !email) {
    return NextResponse.json({ error: "Missing slug or email" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, price_promo, currency")
    .eq("slug", slug)
    .maybeSingle();

  if (productError) {
    return NextResponse.json({ error: productError.message }, { status: 500 });
  }
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const currency = String(product.currency ?? "GNF").toUpperCase();
  const amount = Number(product.price_promo ?? 0);
  if (currency === "GNF" && amount > DJOMY_SANDBOX_MAX_GNF) {
    return NextResponse.json(
      {
        error: `Sandbox Djomy : le prix promo ne doit pas dépasser ${DJOMY_SANDBOX_MAX_GNF} GNF (actuellement ${amount}). Modifie le produit dans l’admin.`,
        code: "DJOMY_SANDBOX_PRICE_LIMIT",
      },
      { status: 400 }
    );
  }

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      product_id: product.id,
      customer_email: email,
      customer_name: name ?? null,
      amount,
      currency: currency || "GNF",
      status: "completed",
      payment_provider: "djomy_test",
      is_delivered: false,
    })
    .select("id")
    .single();

  if (saleError) {
    return NextResponse.json(
      { error: saleError.message, hint: "RLS: il faut autoriser INSERT sur sales en mode test." },
      { status: 403 }
    );
  }

  return NextResponse.json({ sale_id: sale.id });
}

