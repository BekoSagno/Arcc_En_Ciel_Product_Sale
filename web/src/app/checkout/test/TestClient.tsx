"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatGNF } from "@/lib/format";

type PreviewOk = {
  title: string;
  price_promo: number;
  price_original: number;
  currency: string;
  slug: string;
  djomy_sandbox_max_gnf: number;
  within_djomy_sandbox_limit: boolean;
};

export function TestClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const slug = useMemo(() => sp.get("slug")?.trim() ?? "", [sp]);
  const checkoutInfo = useMemo(() => sp.get("checkout_info")?.trim() ?? "", [sp]);
  const checkoutInfoMessage = useMemo(() => {
    switch (checkoutInfo) {
      case "not_public":
        return "Le checkout n’a pas trouvé ce produit côté « visiteur ». Dans Supabase, ouvrez la ligne du produit : le slug doit correspondre à l’URL, et la colonne is_published doit être à true (sinon le lien Djomy n’est jamais lu par l’API).";
      case "bad_payment_link":
        return "Le champ payment_link_url doit être une URL complète, par ex. https://sandbox.djomy.africa/… (pas seulement du texte ou un chemin sans https://).";
      default:
        return null;
    }
  }, [checkoutInfo]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [preview, setPreview] = useState<PreviewOk | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setPreview(null);
      setPreviewError(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);
    fetch(`/api/checkout/djomy/test/preview?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Produit introuvable");
        return json as PreviewOk;
      })
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPreview(null);
          setPreviewError(
            err instanceof Error ? err.message : "Impossible de charger le produit"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const canPay =
    Boolean(slug) &&
    Boolean(preview) &&
    preview!.within_djomy_sandbox_limit &&
    !previewLoading &&
    !previewError;

  const priceLine = preview
    ? `${formatGNF(preview.price_promo)} ${preview.currency}`
    : null;

  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100/90 px-4 py-14">
      <div className="animate-ui-enter w-full max-w-[420px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)]">
        <div className="border-b border-neutral-100 bg-neutral-50/80 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Checkout de test
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
            Paiement simulé
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Finalisez un achat fictif ; une ligne est créée dans{" "}
            <span className="font-medium text-neutral-800">sales</span> avec{" "}
            <span className="font-mono text-xs text-neutral-700">
              payment_provider = djomy_test
            </span>
            .
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          {checkoutInfoMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-relaxed text-rose-950">
              <p className="font-semibold text-rose-900">
                Redirection Djomy impossible
              </p>
              <p className="mt-1.5">{checkoutInfoMessage}</p>
            </div>
          ) : null}
          {!slug ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Aucun produit sélectionné. Revenez à la page produit et utilisez le
              lien de paiement test.
            </div>
          ) : previewLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-3/4 rounded bg-neutral-200" />
              <div className="h-8 w-1/2 rounded bg-neutral-200" />
              <div className="h-3 w-full rounded bg-neutral-100" />
            </div>
          ) : previewError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {previewError}
            </div>
          ) : preview ? (
            <>
              <div>
                <p className="text-xs font-medium text-neutral-500">Produit</p>
                <p className="mt-1 text-base font-semibold text-neutral-900">
                  {preview.title}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Réf. <span className="font-mono text-neutral-700">{preview.slug}</span>
                </p>
              </div>
              <div className="flex items-baseline justify-between gap-3 rounded-xl bg-neutral-900 px-4 py-3 text-white">
                <span className="text-sm font-medium text-white/80">À payer</span>
                <span className="text-lg font-bold tabular-nums">{priceLine}</span>
              </div>
              {preview.currency === "GNF" && !preview.within_djomy_sandbox_limit ? (
                <div
                  className="rounded-xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
                  role="status"
                >
                  <p className="font-semibold">Montant hors plage sandbox Djomy</p>
                  <p className="mt-1 leading-relaxed">
                    En GNF, les tests Djomy acceptent un prix promotionnel maximal de{" "}
                    <strong>
                      {formatGNF(preview.djomy_sandbox_max_gnf)} GNF
                    </strong>
                    . Ajustez le prix promo du produit ou passez en production avec les
                    montants réels.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-2.5 text-xs text-emerald-950">
                  <span className="font-medium">Sandbox OK</span>
                  {preview.currency === "GNF" ? (
                    <>
                      {" "}
                      — prix promo ≤{" "}
                      {formatGNF(preview.djomy_sandbox_max_gnf)} GNF
                    </>
                  ) : null}
                </div>
              )}
            </>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              try {
                const res = await fetch("/api/checkout/djomy/test/complete", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ slug, email, name }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error ?? "Erreur");
                router.replace(
                  `/success?slug=${encodeURIComponent(
                    slug
                  )}&sale_id=${encodeURIComponent(
                    json.sale_id
                  )}&flow=test`
                );
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur inconnue");
              } finally {
                setLoading(false);
              }
            }}
          >
            <label className="block">
              <span className="text-sm font-medium text-neutral-900">
                Nom <span className="font-normal text-neutral-500">(optionnel)</span>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none ring-offset-2 placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-400/30"
                placeholder="Ex. Amadou Diallo"
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-neutral-900">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="mt-1.5 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none ring-offset-2 placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-400/30"
                placeholder="client@email.com"
                autoComplete="email"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !canPay}
              className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-teal-600 py-3 text-center text-sm font-semibold text-white shadow-md transition hover:from-sky-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading ? "Traitement…" : "Payer (test)"}
            </button>

            <button
              type="button"
              className="w-full rounded-xl border-2 border-neutral-300 bg-white py-3 text-center text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
              onClick={() => router.back()}
            >
              Annuler
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
