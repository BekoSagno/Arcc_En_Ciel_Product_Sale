import { NextResponse } from "next/server";
import { getAdminSessionUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { PRODUCT_ASSETS_BUCKET } from "@/lib/upload-product-asset";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 45 * 1024 * 1024;

function sanitizeFileName(name: string) {
  const base = name.replace(/[^\w.\-() ]/g, "_").replace(/\s+/g, "-");
  return base.slice(0, 96) || "fichier";
}

function publicUrlFromPath(path: string) {
  const base = env.supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${PRODUCT_ASSETS_BUCKET}/${path}`;
}

export async function POST(request: Request) {
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "FormData invalide" }, { status: 400 });
  }

  const file = form.get("file");
  const kind = String(form.get("kind") ?? "file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Fichier manquant" }, { status: 400 });
  }

  const isImage = kind === "image";
  if (isImage && !file.type.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, error: "Choisissez une image (JPG, PNG, WebP, GIF…)." },
      { status: 400 }
    );
  }

  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      {
        ok: false,
        error: `Fichier trop volumineux (max. ${Math.round(maxBytes / 1024 / 1024)} Mo).`,
      },
      { status: 400 }
    );
  }

  const subfolder = isImage ? "images" : "fichiers";
  const path = `${subfolder}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
  const admin = createSupabaseAdminClient();

  const { error } = await admin.storage
    .from(PRODUCT_ASSETS_BUCKET)
    .upload(path, file, {
      cacheControl: isImage ? "31536000, immutable" : "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    const msg = error.message || "";
    return NextResponse.json(
      {
        ok: false,
        error: msg.includes("Bucket not found")
          ? "Bucket Supabase `product-assets` introuvable."
          : msg,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, url: publicUrlFromPath(path), path });
}

