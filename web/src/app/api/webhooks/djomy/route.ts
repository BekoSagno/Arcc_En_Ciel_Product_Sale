import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendDeliveryEmail } from "@/lib/email/delivery";
import { isDjomySandboxBase } from "@/lib/djomy-webhook";
import { verifyDjomyWebhookSignatureBytes } from "@/lib/djomy-api";
import { env } from "@/lib/env";
import { createHmac } from "crypto";

export const dynamic = "force-dynamic";

const DEFAULT_CORS_ALLOW_HEADERS =
  "Content-Type, Authorization, Accept, Accept-Language, X-Requested-With, Ngrok-Skip-Browser-Warning";

function isAllowedDjomyOrigin(origin: string | null): origin is string {
  if (!origin) return false;
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();
    return (
      host === "djomy.africa" ||
      host === "www.djomy.africa" ||
      host.endsWith(".djomy.africa")
    );
  } catch {
    return false;
  }
}

/**
 * CORS pour le test d’URL dans le dashboard Djomy (navigateur).
 * Si Djomy utilise `credentials: "include"`, il faut renvoyer l’Origin exacte + Allow-Credentials,
 * pas `*`. Le prévol doit reprendre Access-Control-Request-Headers tel quel.
 */
function buildCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  const requestedHeaders = request.headers.get("access-control-request-headers");
  const allowHeaders =
    requestedHeaders?.trim() || DEFAULT_CORS_ALLOW_HEADERS;

  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Max-Age": "86400",
  };

  if (isAllowedDjomyOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers.Vary = "Origin";
  } else {
    headers["Access-Control-Allow-Origin"] = "*";
  }

  return headers;
}

function jsonWithCors<T extends object>(request: Request, body: T, status = 200) {
  return NextResponse.json(body, { status, headers: buildCorsHeaders(request) });
}

type DjomyWebhookPayload = {
  status?: string;
  amount?: number | string;
  currency?: string;
  transaction_id?: string;
  reference?: string;
  customer?: {
    email?: string;
    name?: string;
  };
  metadata?: Record<string, unknown>;
  [k: string]: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function pickFirstString(...values: unknown[]) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickFirstNumber(...values: unknown[]) {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

/** Certains fournisseurs enveloppent le corps dans `data` ou `event`. */
function unwrapPayload(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") return {};
  const root = body as Record<string, unknown>;
  const nested = root.data ?? root.event ?? root.payload;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...root, ...(nested as Record<string, unknown>) };
  }
  return root;
}

function metadataRecord(f: Record<string, unknown>): Record<string, unknown> | null {
  const raw = f.metadata;
  let m = asRecord(raw);
  if (!m && typeof raw === "string") {
    try {
      m = asRecord(JSON.parse(raw));
    } catch {
      m = null;
    }
  }
  return m;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(request) });
}

/** Même réponse que GET sans corps (certains validateurs n’utilisent que HEAD). */
export async function HEAD(request: Request) {
  return new NextResponse(null, { status: 200, headers: buildCorsHeaders(request) });
}

/** Djomy ou les proxies peuvent vérifier l’URL avec GET. */
export async function GET(request: Request) {
  return jsonWithCors(request, {
    ok: true,
    service: "arc-en-ciel-djomy-webhook",
    hint: "Les notifications de paiement doivent être envoyées en POST avec un corps JSON.",
  });
}

function parseWebhookBody(request: Request, raw: string): { ok: true; data: unknown } | { ok: false; error: string } {
  const ct = (request.headers.get("content-type") ?? "").toLowerCase();
  if (!raw.trim()) return { ok: true, data: {} };

  if (ct.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(raw);
    const obj: Record<string, unknown> = {};
    for (const [k, v] of params.entries()) {
      obj[k] = v;
    }
    return { ok: true, data: obj };
  }

  try {
    return { ok: true, data: JSON.parse(raw) };
  } catch {
    return { ok: false, error: "Corps JSON invalide." };
  }
}

/** Champs souvent utilisés par les PSP (dont références type 8586059Y4). */
function resolveProviderTransactionId(
  flat: Record<string, unknown>,
  meta: Record<string, unknown> | null,
  payloadRecord: Record<string, unknown> | null,
  payload: DjomyWebhookPayload
): string | null {
  const payment = asRecord(flat.payment);
  const transaction = asRecord(flat.transaction);
  const order = asRecord(flat.order);

  return pickFirstString(
    payload.transaction_id,
    payload.reference,
    meta?.transaction_id != null ? String(meta.transaction_id) : null,
    meta?.reference != null ? String(meta.reference) : null,
    payloadRecord?.id != null ? String(payloadRecord.id) : null,
    payloadRecord?.transaction_id != null ? String(payloadRecord.transaction_id) : null,
    flat.transactionId,
    flat.payment_id,
    flat.reference != null ? String(flat.reference) : null,
    flat.reference_code != null ? String(flat.reference_code) : null,
    flat.payment_reference != null ? String(flat.payment_reference) : null,
    flat.transaction_reference != null ? String(flat.transaction_reference) : null,
    flat.ref != null ? String(flat.ref) : null,
    flat.external_reference != null ? String(flat.external_reference) : null,
    typeof flat.id === "string" ? flat.id : null,
    typeof flat.id === "number" && Number.isFinite(flat.id) ? String(flat.id) : null,
    payment?.reference != null ? String(payment.reference) : null,
    payment?.transaction_id != null ? String(payment.transaction_id) : null,
    payment?.id != null ? String(payment.id) : null,
    transaction?.reference != null ? String(transaction.reference) : null,
    transaction?.id != null ? String(transaction.id) : null,
    order?.reference != null ? String(order.reference) : null
  );
}

export async function POST(request: Request) {
  const buf = await request.arrayBuffer();
  const bytes = new Uint8Array(buf);
  const raw = new TextDecoder("utf-8").decode(bytes);

  // Vérifie l'authenticité du webhook (HMAC clientSecret).
  const sigHeader = request.headers.get("x-webhook-signature");
  if (env.djomyWebhookVerify) {
    if (!sigHeader) {
      return jsonWithCors(request, { ok: false, error: "Signature webhook manquante" }, 401);
    }
    if (!verifyDjomyWebhookSignatureBytes(bytes, sigHeader)) {
      if (process.env.DJOMY_WEBHOOK_DEBUG === "1") {
        const hv = sigHeader.trim();
        const sig = hv.toLowerCase().startsWith("v1:") ? hv.slice(3).trim() : hv.trim();
        const expected = env.djomyClientSecret
          ? createHmac("sha256", env.djomyClientSecret.trim()).update(bytes).digest("hex")
          : null;
        console.warn("[djomy-webhook] signature invalide (DJOMY_WEBHOOK_VERIFY=1)", {
          sig_prefix: sig.slice(0, 12),
          sig_len: sig.length,
          expected_prefix: expected?.slice(0, 12) ?? null,
          expected_len: expected?.length ?? null,
          has_client_secret: Boolean(env.djomyClientSecret?.trim()),
          webhook_secret_is_url: Boolean(env.djomyWebhookSecret && /^https?:\/\//i.test(env.djomyWebhookSecret.trim())),
        });
      }
      return jsonWithCors(request, { ok: false, error: "Signature webhook invalide" }, 401);
    }
  }
  if (sigHeader && !env.djomyWebhookVerify && process.env.DJOMY_WEBHOOK_DEBUG === "1") {
    console.warn("[djomy-webhook] signature ignorée (DJOMY_WEBHOOK_VERIFY=0)");
  }

  const parsed = parseWebhookBody(request, raw);
  if (!parsed.ok) {
    return jsonWithCors(request, { ok: false, error: parsed.error }, 400);
  }

  const flat = unwrapPayload(parsed.data);
  const payload = flat as DjomyWebhookPayload;

  const meta = metadataRecord(flat);
  const payloadRecord = asRecord(payload);

  const providerTransactionId = resolveProviderTransactionId(flat, meta, payloadRecord, payload);

  if (!providerTransactionId) {
    if (process.env.DJOMY_WEBHOOK_DEBUG === "1") {
      console.warn("[djomy-webhook] identifiant transaction introuvable, clés reçues:", Object.keys(flat));
    }
    return jsonWithCors(
      request,
      {
        ok: false,
        error:
          "Identifiant de transaction manquant (attendu : transaction_id, reference ou équivalent dans le JSON).",
      },
      422
    );
  }

  const statusRaw = pickFirstString(payload.status, payloadRecord?.state) ?? "unknown";
  const statusLower = statusRaw.toLowerCase();
  const status =
    statusLower.includes("success") ||
    statusLower.includes("completed") ||
    statusLower.includes("paid")
      ? "completed"
      : statusLower.includes("fail") || statusLower.includes("cancel")
        ? "failed"
        : "pending";

  const amount = pickFirstNumber(payload.amount, payloadRecord?.total_amount) ?? 0;
  const currency = pickFirstString(payload.currency, payloadRecord?.currency_code) ?? "GNF";

  const cust = asRecord(flat.customer) ?? asRecord(payload.customer);
  const customerEmail =
    pickFirstString(
      payload.customer?.email,
      cust?.email,
      flat.email,
      flat.payer_email,
      flat.buyer_email,
      meta?.email != null ? String(meta.email) : null,
      payloadRecord?.email
    ) ?? "unknown@example.com";
  const customerName = pickFirstString(
    payload.customer?.name,
    cust?.name,
    flat.customer_name,
    payloadRecord?.name,
    meta?.name != null ? String(meta.name) : null,
    cust?.phone != null ? String(cust.phone) : null,
    flat.phone != null ? String(flat.phone) : null
  );

  const customerPhone = pickFirstString(
    meta?.phone != null ? String(meta.phone) : null,
    cust?.phone != null ? String(cust.phone) : null,
    flat.phone != null ? String(flat.phone) : null
  );
  const customerAddress = pickFirstString(
    meta?.address != null ? String(meta.address) : null,
    (cust as { address?: unknown } | null)?.address != null
      ? String((cust as { address?: unknown }).address)
      : null,
    (flat as { address?: unknown } | null)?.address != null
      ? String((flat as { address?: unknown }).address)
      : null
  );

  const slug = pickFirstString(
    meta?.slug != null ? String(meta.slug) : null,
    typeof meta?.["product_slug"] === "string" ? meta.product_slug : null,
    payloadRecord?.slug != null ? String(payloadRecord.slug) : null,
    flat.slug != null ? String(flat.slug) : null,
    flat.product_slug != null ? String(flat.product_slug) : null,
    flat.external_reference != null ? String(flat.external_reference) : null,
    flat.external_id != null ? String(flat.external_id) : null,
    flat.client_reference_id != null ? String(flat.client_reference_id) : null
  );

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Configuration serveur incomplète.";
    return jsonWithCors(request, { ok: false, error: msg }, 500);
  }

  let productId: string | null = null;
  let productTitle: string | null = null;
  let productType: "electronic" | "physical" = "electronic";
  if (slug) {
    const { data: product } = await supabase
      .from("products")
      .select("id, title, product_type")
      .eq("slug", slug)
      .maybeSingle();
    productId = product?.id ?? null;
    productTitle = (product as { title?: string } | null)?.title ?? null;
    productType =
      (product as { product_type?: unknown } | null)?.product_type === "physical"
        ? "physical"
        : "electronic";
  }

  const paymentProvider = isDjomySandboxBase() ? "djomy_sandbox" : "djomy";

  type ExistingDelivery = { is_delivered: boolean; delivery_error: string | null };
  let existingDelivery: ExistingDelivery | null = null;
  const { data: existing } = await supabase
    .from("sales")
    .select("is_delivered, delivery_error")
    .eq("provider_transaction_id", providerTransactionId)
    .maybeSingle();
  existingDelivery = (existing as ExistingDelivery | null) ?? null;

  const { data: sale, error } = await supabase
    .from("sales")
    .upsert(
      {
        product_id: productId,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone ?? null,
        customer_address: customerAddress ?? null,
        amount,
        currency,
        status,
        payment_provider: paymentProvider,
        provider_transaction_id: providerTransactionId,
        is_delivered: existingDelivery?.is_delivered ?? false,
        delivery_error: existingDelivery?.delivery_error ?? null,
      },
      { onConflict: "provider_transaction_id" }
    )
    .select("id, is_delivered")
    .single();

  if (error) {
    return jsonWithCors(request, { ok: false, error: error.message }, 500);
  }

  if (
    status === "completed" &&
    !sale.is_delivered &&
    customerEmail &&
    customerEmail !== "unknown@example.com"
  ) {
    // Produit physique : pas de livraison instantanée (pas de lien), uniquement suivi manuel côté admin.
    if (productType === "physical") {
      return jsonWithCors(request, { ok: true, sale_id: sale.id }, 200);
    }
    try {
      await sendDeliveryEmail({
        to: customerEmail,
        customerName,
        productTitle,
        saleId: sale.id,
        slug,
      });

      await supabase
        .from("sales")
        .update({ is_delivered: true, delivery_error: null })
        .eq("id", sale.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabase
        .from("sales")
        .update({ is_delivered: false, delivery_error: msg.slice(0, 500) })
        .eq("id", sale.id);
    }
  }

  return jsonWithCors(request, { ok: true, sale_id: sale.id }, 200);
}
