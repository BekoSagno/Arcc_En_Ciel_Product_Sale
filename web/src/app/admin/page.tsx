import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { getPageViewCount } from "@/lib/admin-stats";
import { formatGNF } from "@/lib/format";
import {
  fetchCompletedSalesTotals,
  fetchDashboardProducts,
  fetchProductCountAll,
} from "@/lib/admin-dashboard";
import { PRODUCT_CATEGORIES, normalizeCategory } from "@/lib/product-categories";

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-800">
      {children}
    </span>
  );
}

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double sécurité (middleware + vérification server)
  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F0] px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
          <div className="text-lg font-extrabold">Non connecté</div>
          <div className="mt-2 text-sm text-neutral-800">
            Va sur <a className="underline" href="/login">/login</a>.
          </div>
        </div>
      </div>
    );
  }

  if (env.adminEmail && user.email?.toLowerCase() !== env.adminEmail.toLowerCase()) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#F5F5F0] px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
          <div className="text-lg font-extrabold">Accès refusé</div>
          <div className="mt-2 text-sm text-neutral-800">
            Ce compte n’est pas admin.
          </div>
        </div>
      </div>
    );
  }

  const [totals, pageViewCount, productCountAll, dashboardProducts] =
    await Promise.all([
      fetchCompletedSalesTotals(),
      getPageViewCount(),
      fetchProductCountAll(),
      fetchDashboardProducts(supabase, 20),
    ]);

  const { revenue: totalRevenue, count: completedSalesCount } = totals;

  const { count: productCountFallback } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true });
  const productCount = productCountAll ?? productCountFallback ?? 0;

  const conversionPct =
    pageViewCount != null &&
    pageViewCount > 0 &&
    completedSalesCount >= 0
      ? ((100 * completedSalesCount) / pageViewCount).toFixed(1)
      : null;

  return (
    <div className="min-w-0">
      <header className="animate-ui-enter rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_14px_36px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              Tableau de bord
            </div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-black">
              Vue d’ensemble
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-700">
              <Badge>Admin</Badge>
              <span className="truncate">
                <span className="font-semibold">{user.email}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/products/new"
              className="rounded-2xl bg-black px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.22)] active:scale-[0.99]"
            >
              + Nouveau produit
            </Link>
          </div>
        </div>
      </header>

      <section className="admin-kpi-grid mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            CA (ventes payées)
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-black">
            {formatGNF(totalRevenue)}{" "}
            <span className="text-base">GNF</span>
          </div>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Ventes payées
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-black">
            {completedSalesCount}
          </div>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Produits
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-black">
            {productCount ?? 0}
          </div>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.08)]">
          <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
            Conversion (global)
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-black">
            {conversionPct != null ? (
              <>
                {conversionPct}
                <span className="text-base font-bold">%</span>
              </>
            ) : (
              <span className="text-xl text-neutral-500">—</span>
            )}
          </div>
          {pageViewCount != null && pageViewCount > 0 ? (
            <div className="mt-1 text-[11px] leading-snug text-neutral-500">
              {pageViewCount} vue{pageViewCount !== 1 ? "s" : ""} · ventes
              complétées / vues
            </div>
          ) : null}
        </div>
      </section>

      <section className="animate-ui-enter mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_14px_36px_rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              Catalogue
            </div>
            <div className="mt-1 text-lg font-extrabold text-black">
              Catégories
            </div>
          </div>
          <Link
            href="/admin/products"
            className="text-sm font-bold text-black underline decoration-2 underline-offset-2 hover:text-neutral-700"
          >
            Voir tout le catalogue
          </Link>
        </div>

        {(() => {
          const counts = new Map<string, number>();
          for (const p of dashboardProducts) {
            const c = normalizeCategory((p as { category?: unknown }).category);
            counts.set(c, (counts.get(c) ?? 0) + 1);
          }
          const categories = Array.from(
            new Set([...PRODUCT_CATEGORIES, ...Array.from(counts.keys())].map((c) =>
              normalizeCategory(c)
            ))
          );
          return (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                    {counts.get(c) ?? 0} produit{(counts.get(c) ?? 0) !== 1 ? "s" : ""}
                  </div>
                </Link>
              ))}
            </div>
          );
        })()}
      </section>
    </div>
  );
}

