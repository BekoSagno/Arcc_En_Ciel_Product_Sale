import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { sanitizeProductRichFields } from "@/lib/product-rich-fields";
import {
  isRichHtmlEmpty,
  sanitizePlainOneLine,
  sanitizeRichHtml,
} from "@/lib/sanitize-rich-html";

export const dynamic = "force-dynamic";

const ProductInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  category: z.string().min(1),
  product_type: z.enum(["electronic", "physical"]).default("electronic"),
  price_original: z.number().nonnegative(),
  price_promo: z.number().nonnegative(),
  currency: z.string().min(1),
  timer_duration_minutes: z.number().int().min(1),
  stock_total: z.number().int().min(0),
  sales_count_initial: z.number().int().min(0),
  is_published: z.boolean(),
  main_image_url: z.string().nullable().optional(),
  gallery_urls: z.array(z.string()).optional(),
  product_file_path: z.string().nullable().optional(),
  payment_link_url: z.string().nullable().optional(),
  description_html: z.string().nullable().optional(),
  features: z.array(
    z.object({
      title: z.string(),
      text: z.string(),
      image_url: z.string().nullable().optional(),
    })
  ),
  use_cases: z.array(z.object({ title: z.string(), text: z.string() })),
  how_it_works: z.array(z.object({ text: z.string() })),
  testimonials: z.array(
    z.object({
      name: z.string(),
      rating: z.number().min(1).max(5),
      text: z.string(),
      date: z.string().nullable().optional(),
    })
  ),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export async function POST(request: Request) {
  const user = await getAdminSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
  }

  if (!env.supabaseServiceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manquant" },
      { status: 503 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalide" }, { status: 400 });
  }

  const parsed = ProductInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Données invalides", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  const rich = sanitizeProductRichFields({
    features: parsed.data.features,
    use_cases: parsed.data.use_cases,
    how_it_works: parsed.data.how_it_works,
    faqs: parsed.data.faqs,
    testimonials: parsed.data.testimonials,
  });
  const descriptionSan = sanitizeRichHtml(parsed.data.description_html ?? "");
  const payload = {
    ...parsed.data,
    category: sanitizePlainOneLine(parsed.data.category) || "Autres",
    ...rich,
    description_html: isRichHtmlEmpty(descriptionSan) ? null : descriptionSan,
    gallery_urls: parsed.data.gallery_urls ?? [],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await admin
    .from("products")
    .insert(payload)
    .select("id, slug")
    .single();

  if (error) {
    const msg = String(error.message ?? "");
    if (
      msg.includes("schema cache") &&
      msg.toLowerCase().includes("product_type") &&
      msg.toLowerCase().includes("products")
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Migration Supabase manquante: la colonne `products.product_type` n'existe pas encore. Exécute le SQL de migration (ALTER TABLE) dans Supabase, puis réessaie.",
          sql: [
            "alter table public.products add column if not exists product_type text default 'electronic';",
            "alter table public.sales add column if not exists customer_phone text;",
            "alter table public.sales add column if not exists customer_address text;",
            "select pg_notify('pgrst', 'reload schema');",
          ].join("\\n"),
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
}

