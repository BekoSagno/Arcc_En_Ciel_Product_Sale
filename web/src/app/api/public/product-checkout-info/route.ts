import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = String(searchParams.get("slug") ?? "").trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Slug manquant" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("slug, title, currency, price_promo, product_type, is_published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  if (!data || data.is_published !== true) {
    return NextResponse.json(
      { ok: false, error: "Produit introuvable (ou non publié)." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    product: {
      slug: data.slug,
      title: data.title,
      currency: data.currency,
      price_promo: data.price_promo,
      product_type: data.product_type ?? "electronic",
    },
  });
}

