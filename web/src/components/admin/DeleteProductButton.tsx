"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProductButton({
  productId,
  label = "Supprimer",
  compact = false,
}: {
  productId: string;
  label?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const className = compact
    ? "rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
    : "rounded-xl border-2 border-red-200 bg-white px-3 py-2 text-sm font-extrabold text-red-700 shadow-sm transition hover:bg-red-50 disabled:opacity-50";

  async function onDelete() {
    setError(null);
    const ok = window.confirm(
      "Supprimer ce produit ?\n\n- La page /p/... ne sera plus accessible.\n- Les ventes restent dans l’historique.\n\nConfirmer la suppression ?"
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(productId)}/delete`,
        { method: "POST", credentials: "include" }
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Suppression impossible");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button type="button" className={className} disabled={busy} onClick={() => void onDelete()}>
        {busy ? "…" : label}
      </button>
      {error ? (
        <span className="max-w-[220px] text-[10px] leading-tight text-red-700">
          {error}
        </span>
      ) : null}
    </div>
  );
}

