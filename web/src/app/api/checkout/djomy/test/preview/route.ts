import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DJOMY_SANDBOX_MAX_GNF } from "@/lib/djomy-sandbox";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("title, price_promo, price_original, currency, slug")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const currency = String(data.currency ?? "GNF").toUpperCase();
  const pricePromo = Number(data.price_promo ?? 0);
  const withinSandbox =
    currency !== "GNF" || pricePromo <= DJOMY_SANDBOX_MAX_GNF;

  return NextResponse.json({
    title: data.title,
    price_promo: pricePromo,
    price_original: Number(data.price_original ?? 0),
    currency,
    slug: data.slug,
    djomy_sandbox_max_gnf: DJOMY_SANDBOX_MAX_GNF,
    within_djomy_sandbox_limit: withinSandbox,
  });
}
