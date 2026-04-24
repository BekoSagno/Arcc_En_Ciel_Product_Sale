"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";

type ReqProduct = { title: string; slug: string; category?: string | null } | null;

export type PhysicalRequestRow = {
  id: string;
  created_at: string;
  slug: string;
  customer_email: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_note?: string | null;
  status: string;
  product_id: string | null;
  products: ReqProduct | ReqProduct[] | null;
};

type Status = "new" | "in_progress" | "done" | "cancelled";

function normalizeStatus(s: string | null | undefined): Status {
  const v = String(s ?? "").trim();
  if (v === "in_progress" || v === "done" || v === "cancelled") return v;
  return "new";
}

function productLabel(row: PhysicalRequestRow) {
  const raw = row.products;
  const p = Array.isArray(raw) ? raw[0] : raw;
  return p?.title?.trim() || row.slug || "—";
}

function statusBadge(status: Status) {
  const label =
    status === "new"
      ? "Nouveau"
      : status === "in_progress"
        ? "En cours"
        : status === "done"
          ? "Traité"
          : "Annulé";
  const klass =
    status === "new"
      ? "bg-amber-100 text-amber-950"
      : status === "in_progress"
        ? "bg-sky-100 text-sky-950"
        : status === "done"
          ? "bg-emerald-100 text-emerald-950"
          : "bg-neutral-200 text-neutral-900";

  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2 py-1 text-[11px] font-extrabold",
        klass
      )}
    >
      {label}
    </span>
  );
}

export function RequestsClient({ initialRows }: { initialRows: PhysicalRequestRow[] }) {
  const [rows, setRows] = useState<PhysicalRequestRow[]>(initialRows);
  const [filter, setFilter] = useState<Status | "all">("new");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => normalizeStatus(r.status) === filter);
  }, [rows, filter]);

  const counts = useMemo(() => {
    const c = { all: rows.length, new: 0, in_progress: 0, done: 0, cancelled: 0 } as const;
    const m = { ...c } as unknown as Record<string, number>;
    for (const r of rows) m[normalizeStatus(r.status)]++;
    return m as Record<Status | "all", number>;
  }, [rows]);

  async function setStatus(id: string, status: Status) {
    setError(null);
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/requests/physical", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Impossible de modifier le statut.");
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["new", "Nouvelles"],
              ["in_progress", "En cours"],
              ["done", "Traitées"],
              ["cancelled", "Annulées"],
              ["all", "Toutes"],
            ] as const
          ).map(([key, label]) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={clsx(
                  "rounded-2xl border px-3 py-2 text-sm font-extrabold transition",
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-white text-black hover:bg-neutral-50"
                )}
              >
                {label}{" "}
                <span className={clsx("ml-1 text-xs", active ? "text-white/80" : "text-neutral-500")}>
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-900">
            {error}
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Adresse</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((r) => {
                const ref = r.id.slice(0, 8).toUpperCase();
                const s = normalizeStatus(r.status);
                const busy = busyId === r.id;
                return (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-mono text-[12px] text-neutral-700">
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                      <div className="mt-1 text-[11px] font-extrabold text-neutral-500">
                        REF {ref}
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="font-extrabold text-neutral-900">{productLabel(r)}</div>
                      <div className="mt-1 text-[12px] text-neutral-700">
                        <Link
                          className="underline decoration-2 underline-offset-2"
                          href={`/p/${encodeURIComponent(r.slug)}`}
                          target="_blank"
                        >
                          Ouvrir la page
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="font-extrabold text-neutral-900">{r.customer_name || "—"}</div>
                      <div className="mt-1 text-[12px] text-neutral-700">
                        <a
                          className="underline decoration-2 underline-offset-2"
                          href={`mailto:${encodeURIComponent(r.customer_email)}`}
                        >
                          {r.customer_email}
                        </a>
                      </div>
                      {r.customer_note ? (
                        <div className="mt-2 text-[12px] text-neutral-800">
                          <span className="font-bold">Note:</span> {r.customer_note}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.customer_phone ? (
                        <a
                          className="font-semibold text-neutral-900 underline decoration-2 underline-offset-2"
                          href={`tel:${encodeURIComponent(r.customer_phone)}`}
                        >
                          {r.customer_phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 min-w-[260px]">
                      <div className="text-neutral-900">{r.customer_address || "—"}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{statusBadge(s)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-black hover:bg-neutral-50 disabled:opacity-55"
                          onClick={() => setStatus(r.id, "in_progress")}
                        >
                          En cours
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-black hover:bg-neutral-50 disabled:opacity-55"
                          onClick={() => setStatus(r.id, "done")}
                        >
                          Traité
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-black hover:bg-neutral-50 disabled:opacity-55"
                          onClick={() => setStatus(r.id, "cancelled")}
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-extrabold text-black hover:bg-neutral-50 disabled:opacity-55"
                          onClick={() => setStatus(r.id, "new")}
                        >
                          Nouveau
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-neutral-600" colSpan={7}>
                  Aucune demande dans ce filtre.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

