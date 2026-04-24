"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";

export function NewProductTypeSelectClient({
  initialType,
}: {
  initialType?: string;
}) {
  const router = useRouter();
  const [ptype, setPtype] = useState<"electronic" | "physical" | "">(
    initialType === "electronic" || initialType === "physical"
      ? initialType
      : ""
  );
  const [cat, setCat] = useState<string>(PRODUCT_CATEGORIES[0] ?? "Ordinateurs");

  const options = useMemo(() => {
    const base = [...PRODUCT_CATEGORIES];
    return base.length ? base : (["Autres"] as const);
  }, []);

  return (
    <div className="min-w-0">
      <header className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Nouveau produit
          </div>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-black">
            Choisissez le type de produit
          </div>
        </div>
      </header>

      <div className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={
              ptype === "electronic"
                ? "rounded-2xl bg-black px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                : "rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm font-extrabold text-black shadow-sm hover:bg-neutral-50"
            }
            onClick={() => {
              setPtype("electronic");
              router.replace("/admin/products/new?type=electronic");
            }}
          >
            PRODUIT ÉLECTRONIC
          </button>
          <button
            type="button"
            className={
              ptype === "physical"
                ? "rounded-2xl bg-black px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                : "rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm font-extrabold text-black shadow-sm hover:bg-neutral-50"
            }
            onClick={() => {
              setPtype("physical");
              router.replace("/admin/products/new?type=physical");
            }}
          >
            PRODUIT PHYSIQUE
          </button>
        </div>

        {ptype ? (
          <div className="mt-5">
            <label className="text-sm font-extrabold text-black">Catégorie</label>
            <select
              className="mt-2 w-full rounded-2xl border-2 border-neutral-300 bg-white px-3.5 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-[#0b6b63] focus:ring-2 focus:ring-[#0b6b63]/20"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            >
              {options.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-2xl border border-black/15 bg-white px-4 py-2.5 text-sm font-extrabold text-black shadow-sm hover:bg-neutral-50"
            onClick={() => router.push("/admin/products")}
          >
            ← Annuler
          </button>
          <button
            type="button"
            className="rounded-2xl bg-black px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.22)] active:scale-[0.99]"
            onClick={() =>
              ptype
                ? router.push(
                    `/admin/products/new?type=${encodeURIComponent(
                      ptype
                    )}&cat=${encodeURIComponent(cat)}`
                  )
                : null
            }
            disabled={!ptype}
          >
            Continuer →
          </button>
        </div>
      </div>
    </div>
  );
}

