import type { SupabaseClient } from "@supabase/supabase-js";

export const PRODUCT_ASSETS_BUCKET = "product-assets";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_FILE_BYTES = 45 * 1024 * 1024;
const DEFAULT_MAX_IMAGE_DIM = 1600;
const DEFAULT_IMAGE_CACHE_CONTROL = "31536000, immutable";

function sanitizeFileName(name: string) {
  const base = name.replace(/[^\w.\-() ]/g, "_").replace(/\s+/g, "-");
  return base.slice(0, 96) || "fichier";
}

async function optimizeImageForUpload(file: File, maxDim = DEFAULT_MAX_IMAGE_DIM) {
  if (!file.type.startsWith("image/")) return file;
  // Déjà WebP et raisonnable : on ne touche pas.
  if (file.type === "image/webp" && file.size <= 2 * 1024 * 1024) return file;

  // createImageBitmap est le plus rapide si dispo.
  const bitmap = await createImageBitmap(file);
  try {
    const w = bitmap.width;
    const h = bitmap.height;
    const scale = Math.min(1, maxDim / Math.max(1, w, h));
    const outW = Math.max(1, Math.round(w * scale));
    const outH = Math.max(1, Math.round(h * scale));

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(outW, outH)
        : (document.createElement("canvas") as HTMLCanvasElement);
    if (!(canvas instanceof OffscreenCanvas)) {
      canvas.width = outW;
      canvas.height = outH;
    }

    const ctx =
      canvas instanceof OffscreenCanvas
        ? canvas.getContext("2d", { alpha: true, desynchronized: true })
        : canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return file;

    // Dessin (on privilégie la netteté du texte/Canva)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, outW, outH);

    const blob =
      canvas instanceof OffscreenCanvas
        ? await canvas.convertToBlob({ type: "image/webp", quality: 0.78 })
        : await new Promise<Blob | null>((resolve) =>
            (canvas as HTMLCanvasElement).toBlob(
              (b) => resolve(b),
              "image/webp",
              0.78
            )
          );

    if (!blob) return file;
    // Si la conversion n'est pas bénéfique, on garde l'original.
    if (blob.size >= file.size * 0.98) return file;

    const base = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } finally {
    bitmap.close();
  }
}

export async function uploadProductAsset(
  client: SupabaseClient,
  file: File,
  opts?: {
    subfolder?: string;
    maxBytes?: number;
    /** Optimise automatiquement les images (resize + WebP) avant upload. */
    optimizeImage?: boolean;
    /** Taille max (px) du plus grand côté lors de l'optimisation. */
    maxImageDim?: number;
    /** Cache-Control Supabase Storage (secondes). */
    cacheControl?: string;
  }
): Promise<string> {
  const subfolder = opts?.subfolder ?? "products";
  const maxBytes = opts?.maxBytes ?? MAX_FILE_BYTES;
  const optimizeImage = opts?.optimizeImage ?? true;

  const uploadFile =
    optimizeImage && file.type.startsWith("image/")
      ? await optimizeImageForUpload(file, opts?.maxImageDim ?? DEFAULT_MAX_IMAGE_DIM)
      : file;

  if (uploadFile.size > maxBytes) {
    throw new Error(
      `Fichier trop volumineux (max. ${Math.round(maxBytes / 1024 / 1024)} Mo).`
    );
  }

  const cacheControl =
    opts?.cacheControl ??
    (uploadFile.type.startsWith("image/") ? DEFAULT_IMAGE_CACHE_CONTROL : "3600");

  const path = `${subfolder}/${crypto.randomUUID()}-${sanitizeFileName(uploadFile.name)}`;
  const { error } = await client.storage.from(PRODUCT_ASSETS_BUCKET).upload(path, uploadFile, {
    cacheControl,
    upsert: false,
    contentType: uploadFile.type || undefined,
  });

  if (error) {
    const msg = error.message || "";
    throw new Error(
      msg.includes("Bucket not found")
        ? "Upload impossible : bucket Supabase « product-assets » introuvable. Exécutez `supabase/storage-product-assets.sql` dans Supabase SQL Editor."
        : msg.toLowerCase().includes("row-level security") ||
            msg.toLowerCase().includes("violates row level security") ||
            msg.toLowerCase().includes("permission denied") ||
            msg.toLowerCase().includes("not authorized")
          ? "Upload refusé par Supabase (permissions). Exécutez `supabase/storage-product-assets.sql` (policies Storage) et reconnectez-vous à l’admin."
          : msg
    );
  }

  const { data } = client.storage.from(PRODUCT_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImage(client: SupabaseClient, file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choisissez une image (JPG, PNG, WebP, GIF…).");
  }
  return uploadProductAsset(client, file, {
    subfolder: "images",
    maxBytes: MAX_IMAGE_BYTES,
    // Un peu plus agressif pour réduire la charge réseau sur les sales pages.
    maxImageDim: 1400,
  });
}
