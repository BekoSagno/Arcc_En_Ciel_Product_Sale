"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function PayClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const slug = useMemo(() => sp.get("slug")?.trim() ?? "", [sp]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [productType, setProductType] = useState<"electronic" | "physical">("electronic");
  const [infoBusy, setInfoBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!slug) return;
      setInfoBusy(true);
      try {
        const res = await fetch(
          `/api/public/product-checkout-info?slug=${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          product?: { product_type?: string };
        };
        if (!res.ok || !json.ok) throw new Error(json.error || "Produit introuvable.");
        const t = json.product?.product_type === "physical" ? "physical" : "electronic";
        if (!cancelled) setProductType(t);
      } catch {
        if (!cancelled) setProductType("electronic");
      } finally {
        if (!cancelled) setInfoBusy(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center bg-gradient-to-b from-[#fafaf6] to-[#f0f0ea] px-4 py-14">
      <div className="animate-ui-enter w-full max-w-[440px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)]">
        <div className="border-b border-neutral-100 bg-[#eafff8] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
            Paiement sécurisé
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
            Finaliser l’achat
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-800">
            {productType === "physical"
              ? "Ce produit se commande par demande de livraison (sans paiement en ligne)."
              : "Indiquez l’email de livraison. Vous serez ensuite redirigé vers Djomy pour payer."}
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          {productType === "physical" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
              <div className="font-extrabold">Produit physique</div>
              <div className="mt-1">
                Cliquez sur le bouton ci-dessous pour faire une demande, puis nous vous
                recontactons pour la livraison.
              </div>
              <button
                type="button"
                disabled={infoBusy || !slug}
                className="mt-3 w-full rounded-xl bg-black py-3 text-center text-sm font-extrabold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
                onClick={() => router.push(`/checkout/request?slug=${encodeURIComponent(slug)}`)}
              >
                Faire une demande de livraison
              </button>
            </div>
          ) : null}

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
            <p className="font-semibold text-emerald-900">Produit</p>
            <p className="mt-1 font-mono text-sm text-emerald-950">{slug || "—"}</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              if (productType === "physical") {
                setError("Ce produit ne se paie pas en ligne. Utilisez la demande de livraison.");
                return;
              }
              setLoading(true);
              try {
                const res = await fetch("/api/checkout/djomy", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ slug, email, name, phone, address }),
                });
                const json = (await res.json().catch(() => ({}))) as {
                  ok?: boolean;
                  redirectUrl?: string;
                  error?: string;
                };
                if (!res.ok || !json.redirectUrl) {
                  throw new Error(json.error ?? "Impossible de démarrer le paiement.");
                }
                window.location.href = json.redirectUrl;
              } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur inconnue");
              } finally {
                setLoading(false);
              }
            }}
          >
            <label className="block">
              <span className="text-sm font-semibold text-neutral-900">
                Email de livraison
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30"
                placeholder="client@email.com"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-900">
                Nom {productType === "physical" ? null : (
                  <span className="font-normal text-neutral-600">(optionnel)</span>
                )}
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={productType === "physical"}
                className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30"
                placeholder="Nom du client"
                autoComplete="name"
              />
            </label>

            {productType === "physical" ? (
              <>
                <label className="block">
                  <span className="text-sm font-semibold text-neutral-900">Téléphone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30"
                    placeholder="+224 ..."
                    autoComplete="tel"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-neutral-900">Adresse de livraison</span>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="mt-1.5 min-h-[70px] w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/30"
                    placeholder="Ville, quartier, rue, repère..."
                    autoComplete="street-address"
                  />
                </label>
              </>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || infoBusy || !slug || productType === "physical"}
              className="w-full rounded-xl bg-gradient-to-r from-[#00C9FF] to-[#92FE9D] py-3 text-center text-sm font-extrabold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading ? "Redirection…" : "Continuer vers le paiement"}
            </button>

            <button
              type="button"
              className="w-full rounded-xl border-2 border-neutral-300 bg-white py-3 text-center text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
              onClick={() => router.push(`/p/${encodeURIComponent(slug)}`)}
            >
              Revenir au produit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

