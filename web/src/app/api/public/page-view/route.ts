import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Enregistre une vue pour les stats de conversion (RLS : insert autorisé). */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const slug =
    typeof body === "object" &&
    body !== null &&
    "slug" in body &&
    typeof (body as { slug: unknown }).slug === "string"
      ? (body as { slug: string }).slug.trim()
      : "";

  if (!slug) {
    return NextResponse.json({ ok: false, error: "slug requis" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  const { error } = await supabase.from("page_views").insert({
    slug,
    product_id: product?.id ?? null,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
