import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { createSaleDownloadToken } from "@/lib/delivery-token";

type Props = {
  searchParams: Promise<{
    slug?: string;
    mock?: string;
    sale_id?: string;
    transactionId?: string;
    status?: string;
    flow?: string;
  }>;
};

async function resolveSaleDownloadHref(saleId: string): Promise<string | null> {
  if (!saleId.trim() || !env.supabaseServiceRoleKey) return null;
  try {
    const admin = createSupabaseAdminClient();
    const { data: sale } = await admin
      .from("sales")
      .select("id, status, products ( product_file_path )")
      .eq("id", saleId.trim())
      .maybeSingle();

    if (!sale || sale.status !== "completed") return null;

    const raw = sale.products as
      | { product_file_path?: string | null }
      | { product_file_path?: string | null }[]
      | null;
    const p = Array.isArray(raw) ? raw[0] : raw;
    if (!p?.product_file_path?.trim()) return null;

    const token = createSaleDownloadToken(saleId.trim(), env.deliveryLinkTtlSeconds);
    return `/api/download/deliver?t=${encodeURIComponent(token)}`;
  } catch {
    return null;
  }
}

export default async function SuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const slug = sp.slug?.trim() || "";
  const saleId = sp.sale_id?.trim() || "";
  const txId = sp.transactionId?.trim() || "";
  const flow = sp.flow;

  let productTitle: string | null = null;
  if (slug) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("products")
      .select("title")
      .eq("slug", slug)
      .maybeSingle();
    productTitle = data?.title ?? null;
  }

  const isTestFlow = flow === "test";
  const isSandboxConfirmFlow = flow === "sandbox";

  let effectiveSaleId = saleId;
  if (!effectiveSaleId && txId && env.supabaseServiceRoleKey) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: sale } = await admin
        .from("sales")
        .select("id")
        .eq("provider_transaction_id", txId)
        .maybeSingle();
      if (sale?.id) effectiveSaleId = sale.id;
    } catch {
      // ignore
    }
  }

  const downloadHref = effectiveSaleId ? await resolveSaleDownloadHref(effectiveSaleId) : null;

  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100/90 px-4 py-14">
      <div className="animate-ui-enter w-full max-w-[440px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)]">
        <div className="border-b border-neutral-100 bg-emerald-50/60 px-6 py-5">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl text-white shadow-sm"
            aria-hidden
          >
            ✓
          </div>
          <h1 className="text-center text-2xl font-bold tracking-tight text-neutral-900">
            Merci !
          </h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-neutral-600">
            Votre paiement a bien été pris en compte.
          </p>
        </div>

        <div className="space-y-4 px-6 py-6">
          {isTestFlow ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-950">
              <p className="font-semibold text-sky-900">
                Paiement de test (sans Djomy)
              </p>
              <p className="mt-1.5 leading-relaxed">
                Ce parcours enregistre la commande dans votre base sans ouvrir la
                plateforme Djomy. Pour que le bouton « ACHETER » envoie vos clients
                sur Djomy, renseignez le{" "}
                <strong> lien de paiement Djomy (sandbox)</strong> sur la fiche
                produit dans l’administration — tant qu’il est vide, l’app redirige
                vers cette page de test.
              </p>
            </div>
          ) : null}

          {isSandboxConfirmFlow ? (
            <div className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
              <p className="font-semibold text-violet-900">
                Commande enregistrée (sandbox)
              </p>
              <p className="mt-1.5 leading-relaxed">
                Cette commande provient de la confirmation manuelle après un
                paiement côté Djomy (ou simulation), et non du flux automatisé de
                production.
              </p>
            </div>
          ) : null}

          {downloadHref ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-950">
                Votre fichier est prêt
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                Lien sécurisé valable environ{" "}
                {(() => {
                  const days = Math.max(1, Math.round(env.deliveryLinkTtlSeconds / 86400));
                  return `${days} jour${days > 1 ? "s" : ""}`;
                })()}{" "}
                — chaque clic génère un accès temporaire au stockage.
              </p>
              <a
                href={downloadHref}
                className="mt-3 flex w-full items-center justify-center rounded-xl bg-[#0b6b63] px-4 py-3 text-center text-sm font-extrabold text-white shadow-md transition hover:brightness-110"
              >
                Télécharger mon fichier
              </a>
            </div>
          ) : null}

          <dl className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50/50 px-4 py-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Produit
              </dt>
              <dd className="mt-1 text-base font-semibold text-neutral-900">
                {productTitle ?? (slug ? slug : "—")}
              </dd>
              {slug && productTitle ? (
                <dd className="mt-0.5 font-mono text-xs text-neutral-500">
                  {slug}
                </dd>
              ) : null}
            </div>
            {effectiveSaleId ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Réf. commande
                </dt>
                <dd className="mt-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm text-neutral-800 ring-1 ring-neutral-200/80">
                  {effectiveSaleId}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {slug ? (
              <Link
                href={`/p/${encodeURIComponent(slug)}`}
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:from-sky-700 hover:to-teal-700"
              >
                Retour au produit
              </Link>
            ) : null}
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-center text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              Accueil
            </Link>
          </div>

          {!saleId && slug ? (
            <Link
              href={`/checkout/confirm?slug=${encodeURIComponent(slug)}`}
              className="flex w-full items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Confirmer le paiement (sandbox)
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
