import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { RequestsClient } from "./RequestsClient";

type ReqProduct = { title: string; slug: string; category?: string | null } | null;

type PhysicalRequestRow = {
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

const SELECT =
  "id, created_at, slug, customer_email, customer_name, customer_phone, customer_address, customer_note, status, product_id, products ( title, slug, category )";

async function loadRequests(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  if (env.supabaseServiceRoleKey) {
    try {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin
        .from("physical_requests")
        .select(SELECT)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error) return (data as PhysicalRequestRow[] | null) ?? [];
    } catch {
      // ignore
    }
  }

  const { data } = await supabase
    .from("physical_requests")
    .select(SELECT)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data as PhysicalRequestRow[] | null) ?? [];
}

function productLabel(row: PhysicalRequestRow) {
  const raw = row.products;
  const p = Array.isArray(raw) ? raw[0] : raw;
  return p?.title?.trim() || row.slug || "—";
}

export default async function AdminRequestsPage() {
  const supabase = await createSupabaseServerClient();
  const rows = await loadRequests(supabase);

  return (
    <div className="min-w-0">
      <header className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
              Produits physiques
            </div>
            <div className="mt-1 text-2xl font-extrabold tracking-tight text-black">
              Demandes de livraison
            </div>
            <div className="mt-1 text-sm text-neutral-700">
              Dernières demandes envoyées depuis le CTA (sans paiement).
            </div>
          </div>
        </div>
      </header>

      <RequestsClient initialRows={rows} />
    </div>
  );
}

