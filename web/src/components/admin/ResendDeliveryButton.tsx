"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const btnClass =
  "whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:opacity-50";

export function ResendDeliveryButton({
  saleId,
  canResend,
}: {
  saleId: string;
  /** false si aucun e-mail exploitable côté liste */
  canResend: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onResend() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sales/${encodeURIComponent(saleId)}/resend-delivery`, {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 401) {
          setError("Session expirée — reconnecte-toi.");
          window.location.href = `/login?next=${encodeURIComponent("/admin")}`;
          return;
        }
        if (res.status === 403) {
          setError("Accès refusé.");
          return;
        }
        setError(data.error ?? "Échec du renvoi");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!canResend) {
    return <span className="text-[11px] text-neutral-400">—</span>;
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <button
        type="button"
        className={btnClass}
        disabled={busy}
        onClick={() => void onResend()}
      >
        {busy ? "…" : "Renvoyer l’e-mail"}
      </button>
      {error ? (
        <span className="max-w-[200px] text-[10px] leading-tight text-red-700">
          {error}
        </span>
      ) : null}
    </div>
  );
}
