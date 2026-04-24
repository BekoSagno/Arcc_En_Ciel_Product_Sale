import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slug = body?.slug as string | undefined;
  const email = body?.email as string | undefined;
  const name = body?.name as string | undefined;
  const providerTransactionId = body?.provider_transaction_id as string | undefined;

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

  // Sans webhook, on enregistre une vente "completed" côté sandbox (confirmation manuelle).
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      product_id: product.id,
      customer_email: email,
      customer_name: name ?? null,
      amount: product.price_promo,
      currency: product.currency ?? "GNF",
      status: "completed",
      payment_provider: "djomy_sandbox_manual",
      provider_transaction_id: providerTransactionId || null,
      is_delivered: false,
    })
    .select("id")
    .single();

  if (saleError) {
    return NextResponse.json(
      {
        error: saleError.message,
        hint:
          "RLS: autoriser INSERT sur sales pour payment_provider = djomy_sandbox_manual.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({ sale_id: sale.id });
}

