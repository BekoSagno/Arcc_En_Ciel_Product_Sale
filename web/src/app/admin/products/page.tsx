import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatGNF } from "@/lib/format";
import { PRODUCT_CATEGORIES, normalizeCategory } from "@/lib/product-categories";

type AdminProductRow = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  price_promo: number;
  currency: string;
  is_published: boolean;
  created_at: string;
};

function StatusPill({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
      Publié
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-700">
      Brouillon
    </span>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ cat?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const selectedCat = sp?.cat ? String(sp.cat).trim() : "";

  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, title, category, price_promo, currency, is_published, created_at")
    .order("created_at", { ascending: false });

  const list = (products as AdminProductRow[] | null) ?? [];
  const normalized = list.map((p) => ({
    ...p,
    category: normalizeCategory(p.category),
  }));

  const categoryCounts = (() => {
    const m = new Map<string, number>();
    for (const p of normalized) m.set(p.category ?? "Autres", (m.get(p.category ?? "Autres") ?? 0) + 1);
    return m;
  })();

  const categories = Array.from(
    new Set([...PRODUCT_CATEGORIES, ...Array.from(categoryCounts.keys())].map((c) => normalizeCategory(c)))
  );

  if (!selectedCat) {
    return (
      <div className="min-w-0">
        <header className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                Catalogue
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-black">
                Produits — catégories
              </div>
              <div className="mt-1 text-sm text-neutral-700">
                Choisissez une catégorie pour afficher les produits.
              </div>
            </div>
            <Link
              href="/admin/products/new"
              className="rounded-2xl bg-black px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
            >
              + Nouveau produit
            </Link>
          </div>
        </header>

        <div className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c}
                href={`/admin/products?cat=${encodeURIComponent(c)}`}
                className="group rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                  Catégorie
                </div>
                <div className="mt-1 text-lg font-extrabold text-black group-hover:text-neutral-800">
                  {c}
                </div>
                <div className="mt-2 text-sm font-semibold text-neutral-700">
                  {categoryCounts.get(c) ?? 0} produit{(categoryCounts.get(c) ?? 0) !== 1 ? "s" : ""}
                </div>
              </Link>
            ))}
          </div>

          {normalized.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 text-sm text-neutral-800">
              Aucun produit pour le moment.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const filtered = normalized.filter((p) => normalizeCategory(p.category) === normalizeCategory(selectedCat));

  return (
    <div className="min-w-0">
      <header className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              Catalogue
            </div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-black">
              Produits — {normalizeCategory(selectedCat)}
            </div>
            <div className="mt-1 text-sm text-neutral-700">
              {filtered.length} produit{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products"
              className="rounded-2xl border border-black/15 bg-white px-4 py-2.5 text-sm font-extrabold text-black shadow-sm hover:bg-neutral-50"
            >
              ← Catégories
            </Link>
            <Link
              href="/admin/products/new"
              className="rounded-2xl bg-black px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
            >
              + Nouveau produit
            </Link>
          </div>
        </div>
      </header>

      <div className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        {/* Mobile: cards */}
        <div className="grid gap-3 lg:hidden">
          {filtered.map((p) => (
            <div key={p.id} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-extrabold text-black">{p.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-800">
                    <span className="font-mono text-xs">{p.slug}</span>
                    <span>•</span>
                    <span className="font-extrabold text-black">
                      {formatGNF(Number(p.price_promo ?? 0))} {p.currency}
                    </span>
                  </div>
                </div>
                <StatusPill published={p.is_published} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  className="rounded-xl bg-black px-3 py-2 text-sm font-extrabold text-white"
                  href={`/p/${p.slug}`}
                  target="_blank"
                >
                  Ouvrir
                </a>
                <a
                  className="rounded-xl border-2 border-black/15 bg-white px-3 py-2 text-sm font-extrabold text-black shadow-sm hover:bg-neutral-50"
                  href={`/admin/products/${p.id}`}
                >
                  Modifier
                </a>
              </div>
            </div>
          ))}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-black/10 bg-white p-4 text-sm text-neutral-800">
              Aucun produit pour le moment.
            </div>
          ) : null}
        </div>

        {/* Desktop: table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="text-left text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              <tr>
                <th className="py-2">Slug</th>
                <th className="py-2">Titre</th>
                <th className="py-2">Catégorie</th>
                <th className="py-2">Prix</th>
                <th className="py-2">Statut</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-black/5">
                  <td className="py-3 font-mono text-xs">{p.slug}</td>
                  <td className="py-3">
                    <a className="font-semibold underline" href={`/p/${p.slug}`} target="_blank">
                      {p.title}
                    </a>
                  </td>
                  <td className="py-3 text-sm font-semibold text-neutral-800">
                    {normalizeCategory(p.category)}
                  </td>
                  <td className="py-3">
                    {formatGNF(Number(p.price_promo ?? 0))} {p.currency}
                  </td>
                  <td className="py-3">
                    <StatusPill published={p.is_published} />
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <a
                        className="rounded-lg bg-black px-2.5 py-1.5 text-[11px] font-extrabold text-white"
                        href={`/p/${p.slug}`}
                        target="_blank"
                      >
                        Ouvrir
                      </a>
                      <a
                        className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-black shadow-sm hover:bg-neutral-50"
                        href={`/admin/products/${p.id}`}
                      >
                        Modifier
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 ? (
            <div className="py-3 text-sm text-neutral-700">Aucun produit.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

