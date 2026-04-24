import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { djomyCreatePaymentLink } from "@/lib/djomy-api";
import { getWebhookPublicBaseUrl } from "@/lib/djomy-webhook";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugRaw = searchParams.get("slug");
  const slug = slugRaw?.trim() ?? "";

  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  // Nouveau flux : on collecte l'email sur /checkout/pay puis POST ci-dessous.
  const url = new URL("/checkout/pay", request.url);
  url.searchParams.set("slug", slug);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slug = String(body?.slug ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const name = String(body?.name ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const address = String(body?.address ?? "").trim();

  if (!slug || !email) {
    return NextResponse.json(
      { ok: false, error: "Slug et email requis" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: product, error } = await supabase
    .from("products")
    .select("slug, title, price_promo, currency, product_type")
    .eq("slug", slug)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // RLS : les anonymes ne voient que is_published = true. Sinon product = null :
  // on renvoie une erreur lisible.
  if (!product) {
    return NextResponse.json(
      { ok: false, error: "Produit introuvable (ou non publié)." },
      { status: 404 }
    );
  }

  const ptype = product.product_type === "physical" ? "physical" : "electronic";
  if (ptype === "physical") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Ce produit est physique : paiement en ligne désactivé. Utilisez la demande de livraison.",
      },
      { status: 400 }
    );
  }

  // Si l'API Djomy est configurée, on génère un lien via /v1/links (webhook envoyé car paiement créé via API).
  const publicBase = getWebhookPublicBaseUrl();
  const returnUrl = `${publicBase}/success?slug=${encodeURIComponent(slug)}`;
  const cancelUrl = `${publicBase}/p/${encodeURIComponent(slug)}`;

  try {
    const redirectUrl = await djomyCreatePaymentLink({
      amountToPay: Number(product.price_promo ?? 0),
      linkName: product.title ?? slug,
      description: product.title ?? undefined,
      countryCode: "GN",
      usageType: "UNIQUE",
      merchantReference: `slug:${slug}`,
      returnUrl,
      cancelUrl,
      metadata: {
        slug,
        email,
        ...(name ? { name } : {}),
        product_type: "electronic",
      },
    });
    return NextResponse.json({ ok: true, redirectUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
