import Link from "next/link";
import { formatGNF } from "@/lib/format";
import type { DashboardProductRow } from "@/types/admin-dashboard";

export function AdminDashboardProductList({
  products,
}: {
  products: DashboardProductRow[];
}) {
  if (products.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Aucun produit.{" "}
        <Link href="/admin/products/new" className="font-bold underline">
          Créer un produit
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs font-black uppercase tracking-[0.12em] text-neutral-500">
          <tr>
            <th className="py-2 pr-3">Page</th>
            <th className="py-2 pr-3">Prix</th>
            <th className="py-2 pr-3">Statut</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-black/5">
              <td className="max-w-[200px] py-2.5 pr-3">
                <div className="truncate font-semibold text-black">{p.title}</div>
                <div className="truncate font-mono text-[11px] text-neutral-600">
                  /p/{p.slug}
                </div>
              </td>
              <td className="whitespace-nowrap py-2.5 pr-3 font-extrabold text-black">
                {formatGNF(Number(p.price_promo ?? 0))} {p.currency}
              </td>
              <td className="py-2.5 pr-3">
                {p.is_published ? (
                  <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    Publié
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-700">
                    Brouillon
                  </span>
                )}
              </td>
              <td className="py-2.5">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/p/${encodeURIComponent(p.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-black px-2.5 py-1.5 text-[11px] font-extrabold text-white transition-transform hover:scale-[1.02]"
                  >
                    Ouvrir
                  </a>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-black shadow-sm transition-transform hover:scale-[1.02] hover:bg-neutral-50"
                  >
                    Modifier
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
