import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function secretBytes(): Buffer {
  const explicit = env.deliveryDownloadSecret;
  if (explicit) return Buffer.from(explicit, "utf8");
  const fallback = env.supabaseServiceRoleKey;
  if (fallback) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "DELIVERY_DOWNLOAD_SECRET est obligatoire en production (ne pas réutiliser la service role)."
      );
    }
    return Buffer.from(fallback, "utf8");
  }
  throw new Error(
    "DELIVERY_DOWNLOAD_SECRET ou SUPABASE_SERVICE_ROLE_KEY requis pour les liens de téléchargement."
  );
}

/** Jeton « saleId.exp.sig » ; exp = unix, sig = hmac-sha-256 hex. */
export function createSaleDownloadToken(saleId: string, ttlSeconds: number): string {
  if (!UUID_RE.test(saleId)) throw new Error("saleId invalide");
  const exp = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds);
  const payload = `${saleId}.${exp}`;
  const sig = createHmac("sha256", secretBytes())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function verifySaleDownloadToken(token: string): { saleId: string } | null {
  let secret: Buffer;
  try {
    secret = secretBytes();
  } catch {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [saleId, expStr, sig] = parts;
  if (!UUID_RE.test(saleId)) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const payload = `${saleId}.${exp}`;
  const expected = createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  let ok = false;
  try {
    ok =
      sig.length === expected.length &&
      timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    ok = false;
  }
  if (!ok) return null;
  return { saleId };
}
