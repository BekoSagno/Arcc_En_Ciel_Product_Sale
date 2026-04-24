import { PRODUCT_ASSETS_BUCKET } from "@/lib/upload-product-asset";

/**
 * Extrait le chemin objet dans le bucket `product-assets` depuis une URL publique Supabase,
 * ou accepte un chemin relatif déjà stocké (ex. `fichiers/...`).
 */
export function objectPathFromProductFileUrl(url: string): string | null {
  const t = url.trim();
  if (!t) return null;

  if (!/^https?:\/\//i.test(t)) {
    const rel = t.replace(/^\/+/, "");
    return rel || null;
  }

  const marker = `/object/public/${PRODUCT_ASSETS_BUCKET}/`;
  const i = t.indexOf(marker);
  if (i === -1) return null;
  const path = decodeURIComponent(t.slice(i + marker.length).split(/[?#]/)[0] ?? "");
  return path || null;
}
