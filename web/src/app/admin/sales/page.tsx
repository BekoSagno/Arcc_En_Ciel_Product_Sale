import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { SalesMonitorClient } from "@/components/admin/SalesMonitorClient";
import Link from "next/link";
import { PRODUCT_CATEGORIES, normalizeCategory } from "@/lib/product-categories";

type AdminSaleProduct = {
  title: string;
  slug: string;
  category?: string | null;
  product_type?: string | null;
};

type AdminSaleRow = {
  id: string;
  created_at: string;
  customer_email: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  amount: number;
  currency: string;
  status: string;
  is_delivered: boolean;
  product_id: string | null;
  delivery_error: string | null;
  products: AdminSaleProduct | AdminSaleProduct[] | null;
};

function saleProductLabel(row: AdminSaleRow): string {
  const raw = row.products;
  const p = Array.isArray(raw) ? raw[0] : raw;
  return p?.title?.trim() || "—";
}

const SALES_SELECT =
  "id, created_at, customer_email, customer_name, customer_phone, customer_address, amount, currency, status, is_delivered, product_id, delivery_error, products ( title, slug, category, product_type )";

async function loadSales(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  if (env.supabaseServiceRoleKey) {
    try {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin
        .from("sales")
        .select(SALES_SELECT)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error) return (data as AdminSaleRow[] | null) ?? [];
    } catch {
      // ignore
    }
  }

  const { data } = await supabase
    .from("sales")
    .select(SALES_SELECT)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data as AdminSaleRow[] | null) ?? [];
}

export default async function AdminSalesPage({
  searchParams,
}: {
  searchParams?: Promise<{ cat?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const selectedCat = sp?.cat ? String(sp.cat).trim() : "";

  const supabase = await createSupabaseServerClient();
  const sales = await loadSales(supabase);

  const normalizedSales = sales.map((s) => {
    const raw = s.products;
    const p = Array.isArray(raw) ? raw[0] : raw;
    const cat = normalizeCategory(p?.category);
    return { row: s, category: cat };
  });

  const categoryCounts = (() => {
    const m = new Map<string, number>();
    for (const s of normalizedSales) m.set(s.category, (m.get(s.category) ?? 0) + 1);
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
                Ventes
              </div>
              <div className="mt-1 text-2xl font-extrabold tracking-tight text-black">
                Commandes — catégories
              </div>
              <div className="mt-1 text-sm text-neutral-700">
                Choisissez une catégorie pour afficher les ventes.
              </div>
            </div>
          </div>
        </header>

        <div className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c}
                href={`/admin/sales?cat=${encodeURIComponent(c)}`}
                className="group rounded-3xl border border-black/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                  Catégorie
                </div>
                <div className="mt-1 text-lg font-extrabold text-black group-hover:text-neutral-800">
                  {c}
                </div>
                <div className="mt-2 text-sm font-semibold text-neutral-700">
                  {categoryCounts.get(c) ?? 0} vente{(categoryCounts.get(c) ?? 0) !== 1 ? "s" : ""}
                </div>
              </Link>
            ))}
          </div>

          {sales.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 text-sm text-neutral-800">
              Aucune vente pour le moment.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const filtered = normalizedSales
    .filter((s) => s.category === normalizeCategory(selectedCat))
    .map((s) => s.row);

  return (
    <div className="min-w-0">
      <header className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              Ventes
            </div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-black">
              Commandes — {normalizeCategory(selectedCat)}
            </div>
            <div className="mt-1 text-sm text-neutral-700">
              {filtered.length} commande{filtered.length !== 1 ? "s" : ""} (sur les 50 dernières)
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/sales"
              className="rounded-2xl border border-black/15 bg-white px-4 py-2.5 text-sm font-extrabold text-black shadow-sm hover:bg-neutral-50"
            >
              ← Catégories
            </Link>
          </div>
        </div>
      </header>

      <div className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <SalesMonitorClient
          sales={filtered.map((s) => ({
            id: s.id,
            created_at: s.created_at,
            customer_email: s.customer_email,
            customer_name: (s as { customer_name?: string | null }).customer_name ?? null,
            customer_phone: (s as { customer_phone?: string | null }).customer_phone ?? null,
            customer_address: (s as { customer_address?: string | null }).customer_address ?? null,
            amount: Number(s.amount ?? 0),
            currency: s.currency,
            status: s.status,
            is_delivered: s.is_delivered,
            delivery_error: s.delivery_error ?? null,
            productTitle: saleProductLabel(s),
            product_type: (() => {
              const raw = s.products;
              const p = Array.isArray(raw) ? raw[0] : raw;
              return p?.product_type ?? null;
            })(),
          }))}
        />
      </div>
    </div>
  );
}

