import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import dns from "dns";
import https from "https";

// Réduit les soucis IPv6/Happy-Eyeballs sous Windows (ETIMEDOUT/ENETUNREACH).
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // ignore
}

async function httpsJson(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<{ status: number; headers: Record<string, string>; json: unknown }> {
  const u = new URL(url);
  const method = (init.method || "GET").toUpperCase();
  const bodyStr = typeof init.body === "string" ? init.body : init.body ? String(init.body) : null;

  return await new Promise((resolve, reject) => {
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port ? Number(u.port) : 443,
        path: `${u.pathname}${u.search}`,
        method,
        headers: init.headers as Record<string, string> | undefined,
        // Force IPv4 resolution for this request.
        lookup(hostname, options, cb) {
          return dns.lookup(hostname, { ...options, family: 4 }, cb);
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          const headers: Record<string, string> = {};
          for (const [k, v] of Object.entries(res.headers)) {
            if (typeof v === "string") headers[k] = v;
            else if (Array.isArray(v)) headers[k] = v.join(", ");
          }
          const json = (() => {
            try {
              return raw ? JSON.parse(raw) : null;
            } catch {
              return null;
            }
          })();
          resolve({ status: res.statusCode || 0, headers, json });
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("ETIMEDOUT"));
    });

    if (init.signal) {
      const onAbort = () => req.destroy(new Error("AbortError"));
      if (init.signal.aborted) onAbort();
      else init.signal.addEventListener("abort", onAbort, { once: true });
    }

    if (bodyStr != null) req.write(bodyStr);
    req.end();
  });
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<{ res: Response; json: unknown }> {
  const { timeoutMs = 20000, ...rest } = init;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const out = await httpsJson(url, { ...rest, signal: controller.signal }, timeoutMs);
    // Construit un Response compatible avec le reste du code (status + json déjà parsé).
    const res = new Response(JSON.stringify(out.json ?? null), {
      status: out.status,
      headers: out.headers,
    });
    return { res, json: out.json };
  } catch (e) {
    const err = e as unknown as { message?: string; cause?: unknown; code?: unknown };
    const msg = e instanceof Error ? e.message : String(e);
    const code =
      err && typeof err === "object" && err != null && "code" in (err as Record<string, unknown>)
        ? String((err as Record<string, unknown>).code)
        : undefined;
    const cause = (err && typeof err === "object" && "cause" in err) ? err.cause : undefined;
    const causeCode =
      cause && typeof cause === "object" && cause != null && "code" in (cause as Record<string, unknown>)
        ? String((cause as Record<string, unknown>).code)
        : undefined;
    const bits = [code ? `code: ${code}` : null, causeCode ? `cause: ${causeCode}` : null]
      .filter(Boolean)
      .join(", ");
    const extra = bits ? ` (${bits})` : "";
    throw new Error(`Djomy fetch failed (${url}): ${msg}${extra}`);
  } finally {
    clearTimeout(t);
  }
}

async function fetchJsonWithRetries(
  url: string,
  init: RequestInit & { timeoutMs?: number; retries?: number } = {}
) {
  const retries = Number.isFinite(Number(init.retries)) ? Math.max(0, Number(init.retries)) : 2;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchJsonWithTimeout(url, init);
    } catch (e) {
      lastErr = e;
      if (attempt >= retries) break;
      // backoff léger: 250ms, 750ms, ...
      const delayMs = 250 + attempt * 500;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function normalizeDjomyApiBase(raw: string): string {
  const t = (raw || "").trim().replace(/\/$/, "");
  if (!t) return "https://sandbox-api.djomy.africa";
  try {
    const u = new URL(t);
    const host = u.hostname.toLowerCase();
    // Beaucoup de configs mettent sandbox.djomy.africa (portail). L'API est sandbox-api.djomy.africa.
    if (host === "sandbox.djomy.africa") u.hostname = "sandbox-api.djomy.africa";
    if (host === "djomy.africa" || host === "www.djomy.africa") u.hostname = "api.djomy.africa";
    return u.toString().replace(/\/$/, "");
  } catch {
    return t;
  }
}

function normalizeDjomyPortalBase(raw: string): string {
  const t = (raw || "").trim().replace(/\/$/, "");
  if (!t) return "https://sandbox.djomy.africa";
  try {
    const u = new URL(t);
    const host = u.hostname.toLowerCase();
    // Inverse du mapping API -> portail
    if (host === "sandbox-api.djomy.africa") u.hostname = "sandbox.djomy.africa";
    if (host === "api.djomy.africa") u.hostname = "djomy.africa";
    return u.toString().replace(/\/$/, "");
  } catch {
    return t;
  }
}

function hmacHex(message: string, secret: string) {
  return createHmac("sha256", secret).update(message).digest("hex");
}

function isProbablyUrl(v: string) {
  const t = v.trim().toLowerCase();
  return t.startsWith("http://") || t.startsWith("https://");
}

function resolveDjomySigningSecret(): string | null {
  // Certains providers signent les webhooks avec un secret dédié (dashboard),
  // pas forcément le DJOMY_CLIENT_SECRET.
  const webhookSecret = env.djomyWebhookSecret?.trim();
  if (webhookSecret && !isProbablyUrl(webhookSecret)) return webhookSecret;

  const clientSecret = env.djomyClientSecret?.trim();
  if (clientSecret) return clientSecret;

  return null;
}

function buildXApiKey(): string {
  const clientId = env.djomyClientId?.trim();
  const clientSecret = env.djomyClientSecret?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("Identifiants Djomy manquants (DJOMY_CLIENT_ID / DJOMY_CLIENT_SECRET).");
  }
  const signature = hmacHex(clientId, clientSecret);
  return `${clientId}:${signature}`;
}

type AuthResponse = {
  success?: boolean;
  message?: string;
  data?: { accessToken?: string; token?: string; jwt?: string };
  accessToken?: string;
};

export async function djomyGetAccessToken(): Promise<string> {
  const base = normalizeDjomyApiBase(env.djomyApiBase ?? "");
  const { res, json } = await fetchJsonWithRetries(`${base}/v1/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": buildXApiKey(),
    },
    body: JSON.stringify({}),
    cache: "no-store",
    retries: 2,
  });
  const parsed = json as AuthResponse | null;
  if (!res.ok) {
    const maybeErr =
      parsed && typeof parsed === "object" && "error" in parsed
        ? (parsed as { error?: unknown }).error
        : undefined;
    const msg = (parsed && (parsed.message || String(maybeErr ?? ""))) || `HTTP ${res.status}`;
    throw new Error(`Djomy auth: ${msg}`.trim());
  }
  const token =
    parsed?.data?.accessToken ||
    parsed?.data?.token ||
    parsed?.data?.jwt ||
    parsed?.accessToken;
  if (!token) throw new Error("Djomy auth: accessToken manquant dans la réponse.");
  return token;
}

type CreateLinkInput = {
  amountToPay: number;
  linkName: string;
  description?: string;
  countryCode: string; // ex: GN
  usageType?: "UNIQUE" | "MULTIPLE";
  merchantReference?: string;
  returnUrl: string;
  cancelUrl?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type CreateLinkResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reference?: string;
    url?: string;
    linkUrl?: string;
    paymentUrl?: string;
    redirectUrl?: string;
    checkoutUrl?: string;
  };
};

type LinkDetailResponse = {
  success?: boolean;
  message?: string;
  data?: {
    reference?: string;
    url?: string;
    linkUrl?: string;
    paymentUrl?: string;
    redirectUrl?: string;
    checkoutUrl?: string;
  };
};

async function djomyGetLinkUrlByReference(reference: string, token: string): Promise<string | null> {
  const base = normalizeDjomyApiBase(env.djomyApiBase ?? "");
  const ref = reference.trim();
  if (!ref) return null;
  const { res, json } = await fetchJsonWithRetries(
    `${base}/v1/links/${encodeURIComponent(ref)}`,
    {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "X-API-KEY": buildXApiKey(),
    },
    cache: "no-store",
    retries: 2,
    }
  );
  const parsed = json as LinkDetailResponse | null;
  if (!res.ok) return null;
  const url =
    parsed?.data?.url ||
    parsed?.data?.linkUrl ||
    parsed?.data?.paymentUrl ||
    parsed?.data?.redirectUrl ||
    parsed?.data?.checkoutUrl;
  return url?.trim() || null;
}

export async function djomyCreatePaymentLink(input: CreateLinkInput): Promise<string> {
  const base = normalizeDjomyApiBase(env.djomyApiBase ?? "");
  const token = await djomyGetAccessToken();
  const { res, json } = await fetchJsonWithRetries(`${base}/v1/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-API-KEY": buildXApiKey(),
    },
    body: JSON.stringify({
      amountToPay: input.amountToPay,
      linkName: input.linkName,
      description: input.description ?? undefined,
      countryCode: input.countryCode,
      usageType: input.usageType ?? "UNIQUE",
      merchantReference: input.merchantReference ?? undefined,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl ?? undefined,
      metadata: input.metadata ?? undefined,
    }),
    cache: "no-store",
    retries: 2,
  });
  const parsed = json as CreateLinkResponse | null;
  if (!res.ok) {
    const maybeErr =
      parsed && typeof parsed === "object" && "error" in parsed
        ? (parsed as { error?: unknown }).error
        : undefined;
    const msg = (parsed && (parsed.message || String(maybeErr ?? ""))) || `HTTP ${res.status}`;
    throw new Error(`Djomy create link: ${msg}`.trim());
  }

  const url =
    parsed?.data?.url ||
    parsed?.data?.linkUrl ||
    parsed?.data?.paymentUrl ||
    parsed?.data?.redirectUrl ||
    parsed?.data?.checkoutUrl;
  if (url?.trim()) return url.trim();

  // Certaines réponses renvoient uniquement une référence, puis il faut faire GET /v1/links/{reference}.
  const ref = parsed?.data?.reference?.trim() || "";
  if (ref) {
    const resolved = await djomyGetLinkUrlByReference(ref, token);
    if (resolved) return resolved;
    // D'après le portail Djomy: un lien est accessible via /p/{reference}.
    const portal = normalizeDjomyPortalBase(env.djomyApiBase ?? "");
    return `${portal}/p/${encodeURIComponent(ref)}`;
  }

  const keys =
    parsed && typeof parsed === "object" && parsed.data && typeof parsed.data === "object"
      ? Object.keys(parsed.data as Record<string, unknown>).join(", ")
    : "none";
  throw new Error(
    `Djomy create link: URL de paiement introuvable dans la réponse (data keys: ${keys}).`
  );
}

/** Vérifie l'entête Djomy: X-Webhook-Signature: v1:<hex> */
export function verifyDjomyWebhookSignature(
  rawBody: string,
  headerValue: string | null
): boolean {
  const secret = resolveDjomySigningSecret();
  if (!secret) return false;
  const hv = (headerValue ?? "").trim();
  const sig = hv.startsWith("v1:") ? hv.slice(3) : hv;
  if (!sig) return false;
  const bodies = [
    rawBody,
    // Tolérance: certains proxies normalisent CRLF.
    rawBody.replace(/\r\n/g, "\n"),
    rawBody.trim(),
  ];

  for (const b of bodies) {
    // Variante 1: hex (doc)
    const expectedHex = hmacHex(b, secret);
    try {
      if (
        sig.length === expectedHex.length &&
        timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedHex, "hex"))
      ) {
        return true;
      }
    } catch {
      // ignore
    }

    // Variante 2: base64 (certaines implémentations renvoient base64)
    const expectedB64 = createHmac("sha256", secret).update(b).digest("base64");
    try {
      if (
        sig.length === expectedB64.length &&
        timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expectedB64, "utf8"))
      ) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

/** Vérifie la signature en calculant HMAC sur les octets bruts (recommandé). */
export function verifyDjomyWebhookSignatureBytes(
  bodyBytes: Uint8Array,
  headerValue: string | null
): boolean {
  const secret = resolveDjomySigningSecret();
  if (!secret) return false;
  const hv = (headerValue ?? "").trim();
  const sigRaw = hv.startsWith("v1:") ? hv.slice(3) : hv;
  const sig = sigRaw.trim();
  if (!sig) return false;

  const expectedHex = createHmac("sha256", secret).update(bodyBytes).digest("hex");
  const sigLower = sig.toLowerCase();
  const expectedLower = expectedHex.toLowerCase();

  // 1) Hex compare (recommandé)
  try {
    if (
      sigLower.length === expectedLower.length &&
      timingSafeEqual(Buffer.from(sigLower, "hex"), Buffer.from(expectedLower, "hex"))
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  // 2) Base64 compare (tolérance)
  try {
    const expectedB64 = createHmac("sha256", secret).update(bodyBytes).digest("base64");
    if (
      sig.length === expectedB64.length &&
      timingSafeEqual(Buffer.from(sig, "utf8"), Buffer.from(expectedB64, "utf8"))
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

