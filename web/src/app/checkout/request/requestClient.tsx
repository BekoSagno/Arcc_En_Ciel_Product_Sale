"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ProductInfo = {
  title?: string | null;
  product_type?: string | null;
};

export function RequestClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const slug = useMemo(() => sp.get("slug")?.trim() ?? "", [sp]);

  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [infoBusy, setInfoBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okId, setOkId] = useState<string | null>(null);

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
          product?: ProductInfo;
        };
        if (!res.ok || !json.ok) throw new Error(json.error || "Produit introuvable.");
        const p = json.product ?? {};
        if ((p.product_type ?? "electronic") !== "physical") {
          throw new Error("Ce produit n’est pas un produit physique.");
        }
        if (!cancelled) setProduct(p);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur inconnue");
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
      <div className="animate-ui-enter w-full max-w-[520px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)]">
        <div className="border-b border-neutral-100 bg-[#fff7ed] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
            Demande de livraison
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
            Commander un produit physique
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-800">
            Remplissez vos informations. L’admin vous recontacte par email ou téléphone pour
            organiser la livraison. <span className="font-semibold">Aucun paiement en ligne ici.</span>
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold text-amber-900">Produit</p>
            <p className="mt-1 font-mono text-sm text-amber-950">{slug || "—"}</p>
            {product?.title ? (
              <p className="mt-1 text-sm font-semibold text-amber-950">{product.title}</p>
            ) : null}
          </div>

          {okId ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-950">
              <div className="text-base font-extrabold">Demande envoyée</div>
              <div className="mt-1">
                Référence:{" "}
                <span className="font-mono font-extrabold">
                  {okId.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="w-full rounded-xl bg-black py-3 text-center text-sm font-extrabold text-white shadow-sm transition hover:brightness-105"
                  onClick={() => router.push(`/p/${encodeURIComponent(slug)}`)}
                >
                  Revenir au produit
                </button>
                <button
                  type="button"
                  className="w-full rounded-xl border-2 border-neutral-300 bg-white py-3 text-center text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
                  onClick={() => router.push("/")}
                >
                  Accueil
                </button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);
                try {
                  const res = await fetch("/api/checkout/physical-request", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ slug, email, name, phone, address, note }),
                  });
                  const json = (await res.json().catch(() => ({}))) as {
                    ok?: boolean;
                    id?: string;
                    error?: string;
                  };
                  if (!res.ok || !json.ok || !json.id) {
                    throw new Error(json.error ?? "Impossible d’envoyer la demande.");
                  }
                  setOkId(json.id);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Erreur inconnue");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <label className="block">
                <span className="text-sm font-semibold text-neutral-900">Nom</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-400/30"
                  placeholder="Nom du client"
                  autoComplete="name"
                  disabled={loading || infoBusy}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-neutral-900">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-400/30"
                  placeholder="client@email.com"
                  autoComplete="email"
                  disabled={loading || infoBusy}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-neutral-900">Téléphone</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-400/30"
                  placeholder="+224 ..."
                  autoComplete="tel"
                  disabled={loading || infoBusy}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-neutral-900">Adresse de livraison</span>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="mt-1.5 min-h-[70px] w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-400/30"
                  placeholder="Ville, quartier, rue, repère..."
                  autoComplete="street-address"
                  disabled={loading || infoBusy}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-neutral-900">
                  Note (optionnel)
                </span>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1.5 min-h-[60px] w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-400/30"
                  placeholder="Ex: horaire de livraison, repère, urgence..."
                  disabled={loading || infoBusy}
                />
              </label>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || infoBusy || !slug}
                className="w-full rounded-xl bg-black py-3 text-center text-sm font-extrabold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {loading ? "Envoi…" : "Envoyer la demande"}
              </button>

              <button
                type="button"
                className="w-full rounded-xl border-2 border-neutral-300 bg-white py-3 text-center text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
                onClick={() => router.push(`/p/${encodeURIComponent(slug)}`)}
                disabled={loading}
              >
                Revenir au produit
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

