import { NextResponse } from "next/server";
import { verifySaleDownloadToken } from "@/lib/delivery-token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { PRODUCT_ASSETS_BUCKET } from "@/lib/upload-product-asset";
import { objectPathFromProductFileUrl } from "@/lib/storage-product-path";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("t")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "Jeton manquant" }, { status: 400 });
  }

  const verified = verifySaleDownloadToken(token);
  if (!verified) {
    return NextResponse.json(
      { ok: false, error: "Lien invalide ou expiré" },
      { status: 401 }
    );
  }

  if (!env.supabaseServiceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "Téléchargement indisponible (configuration)" },
      { status: 503 }
    );
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Téléchargement indisponible" },
      { status: 503 }
    );
  }

  const { data: sale, error } = await admin
    .from("sales")
    .select("id, status, products ( product_file_path, product_type )")
    .eq("id", verified.saleId)
    .maybeSingle();

  if (error || !sale) {
    return NextResponse.json({ ok: false, error: "Commande introuvable" }, { status: 404 });
  }

  if (sale.status !== "completed") {
    return NextResponse.json(
      { ok: false, error: "Paiement non confirmé pour cette commande" },
      { status: 403 }
    );
  }

  const raw = sale.products as
    | { product_file_path?: string | null; product_type?: string | null }
    | { product_file_path?: string | null; product_type?: string | null }[]
    | null;
  const p = Array.isArray(raw) ? raw[0] : raw;
  if (p?.product_type === "physical") {
    return NextResponse.json(
      { ok: false, error: "Ce produit est physique : aucun téléchargement disponible." },
      { status: 400 }
    );
  }
  const fileUrl = p?.product_file_path?.trim();
  if (!fileUrl) {
    return NextResponse.json(
      { ok: false, error: "Aucun fichier numérique configuré pour ce produit" },
      { status: 404 }
    );
  }

  const storagePath = objectPathFromProductFileUrl(fileUrl);
  if (!storagePath) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Fichier non hébergé sur l’espace sécurisé (URL non reconnue). Contactez le support.",
      },
      { status: 422 }
    );
  }

  const { data: signed, error: signErr } = await admin.storage
    .from(PRODUCT_ASSETS_BUCKET)
    .createSignedUrl(storagePath, env.deliveryStorageSignedUrlSeconds);

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { ok: false, error: signErr?.message ?? "Impossible de générer le lien de fichier" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signed.signedUrl);
}
