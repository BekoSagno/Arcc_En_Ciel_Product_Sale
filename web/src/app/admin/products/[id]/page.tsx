import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { NewProductForm } from "../new/NewProductForm";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const productId = id?.trim();
  if (!productId) notFound();
  const sp = searchParams ? await searchParams : undefined;
  const initialTab =
    sp?.tab === "medias" || sp?.tab === "contenu" || sp?.tab === "infos"
      ? sp.tab
      : undefined;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();
  if (env.adminEmail && user.email?.toLowerCase() !== env.adminEmail.toLowerCase()) {
    notFound();
  }

  let admin;
  try {
    admin = createSupabaseAdminClient();
  } catch {
    notFound();
  }

  const { data: product } = await admin
    .from("products")
    .select(
      "id, slug, title, category, product_type, price_original, price_promo, currency, timer_duration_minutes, stock_total, sales_count_initial, is_published, main_image_url, gallery_urls, product_file_path, payment_link_url, description_html, features, use_cases, how_it_works, testimonials, faqs"
    )
    .eq("id", productId)
    .maybeSingle();

  if (!product) notFound();

  return (
    <NewProductForm
      productId={productId}
      initialProduct={product}
      initialTab={initialTab}
    />
  );
}

