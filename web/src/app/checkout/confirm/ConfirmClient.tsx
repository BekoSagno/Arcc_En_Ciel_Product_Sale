"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function ConfirmClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const slug = useMemo(() => sp.get("slug")?.trim() ?? "", [sp]);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tx, setTx] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center bg-gradient-to-b from-[#fafaf6] to-[#f0f0ea] px-4 py-14">
      <div className="animate-ui-enter w-full max-w-[420px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)]">
        <div className="border-b border-neutral-100 bg-[#ede9fe] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-900">
            Sandbox Djomy
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-neutral-900">
            Confirmer le paiement
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-800">
            Enregistrez la commande dans <strong>sales</strong> lorsque le webhook
            Djomy n’est pas encore branché automatiquement.
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-xl border border-violet-200 bg-violet-50/90 px-4 py-3 text-sm text-violet-950">
            <p className="font-semibold text-violet-900">Produit</p>
            <p className="mt-1 font-mono text-sm text-violet-950">{slug || "—"}</p>
          </div>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              try {
                const res = await fetch("/api/checkout/djomy/sandbox/confirm", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    slug,
                    email,
                    name,
                    provider_transaction_id: tx,
                  }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error ?? "Erreur");
                router.replace(
                  `/success?slug=${encodeURIComponent(
                    slug
                  )}&sale_id=${encodeURIComponent(
                    json.sale_id
                  )}&flow=sandbox`
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
              <span className="text-sm font-semibold text-neutral-900">
                Email client
              </span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-400/30"
                placeholder="client@email.com"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-900">
                Nom <span className="font-normal text-neutral-600">(optionnel)</span>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-400/30"
                placeholder="Nom du client"
                autoComplete="name"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-900">
                ID transaction Djomy{" "}
                <span className="font-normal text-neutral-600">(optionnel)</span>
              </span>
              <input
                value={tx}
                onChange={(e) => setTx(e.target.value)}
                className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 font-mono text-sm text-neutral-900 shadow-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-400/30"
                placeholder="ex. 626606960"
              />
              <span className="mt-1.5 block text-xs leading-relaxed text-neutral-800">
                S’il apparaît sur l’écran Djomy après paiement, collez-le ici ;
                sinon laissez vide.
              </span>
            </label>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !slug}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-center text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading ? "En cours…" : "Confirmer la commande"}
            </button>

            <button
              type="button"
              className="w-full rounded-xl border-2 border-neutral-300 bg-white py-3 text-center text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
              onClick={() => router.push(`/p/${encodeURIComponent(slug)}`)}
            >
              Revenir à la page produit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
