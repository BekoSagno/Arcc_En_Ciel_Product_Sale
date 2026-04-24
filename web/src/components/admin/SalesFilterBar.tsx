"use client";

import { useRef, useState } from "react";

export type SalesFilterState = {
  q: string;
  onlyNotDelivered: boolean;
};

export function SalesFilterBar({
  value,
  onChange,
}: {
  value: SalesFilterState;
  onChange: (next: SalesFilterState) => void;
}) {
  const [localQ, setLocalQ] = useState(value.q);
  const timeoutRef = useRef<number | null>(null);

  const debounced = (next: string) => {
    if (timeoutRef.current != null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      onChange({ ...value, q: next });
    }, 180);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            value={localQ}
            onChange={(e) => {
              const next = e.target.value;
              setLocalQ(next);
              debounced(next);
            }}
            placeholder="Filtrer (email, produit, statut)…"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-black/20 focus:ring-2 focus:ring-black/10"
          />
        </div>
        {value.q ? (
          <button
            type="button"
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold shadow-sm hover:bg-neutral-50"
            onClick={() => {
              setLocalQ("");
              onChange({ ...value, q: "" });
            }}
          >
            Effacer
          </button>
        ) : null}
      </div>

      <label className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold shadow-sm">
        <input
          type="checkbox"
          checked={value.onlyNotDelivered}
          onChange={(e) => onChange({ ...value, onlyNotDelivered: e.target.checked })}
        />
        Non livrées
      </label>
    </div>
  );
}

