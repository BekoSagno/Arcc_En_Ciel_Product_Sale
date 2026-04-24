import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildProductMetadata } from "@/lib/sales-seo";
import { stripHtmlToPlain } from "@/lib/sales-seo";
import type { Product } from "@/types/sales-page";
import { SalesHeader } from "@/components/sales/SalesHeader";
import { ProductGallery } from "@/components/sales/ProductGallery";
import { StickyCta } from "@/components/sales/StickyCta";
import { BrushText } from "@/components/ui/BrushText";
import { Reveal } from "@/components/ui/Reveal";
import { HeroPrice } from "@/components/sales/HeroPrice";
import { UseCasesSlider } from "@/components/sales/UseCasesSlider";
import { HowItWorksGrid } from "@/components/sales/HowItWorksGrid";
import { SocialProofSection } from "@/components/sales/SocialProofSection";
import { FaqSection } from "@/components/sales/FaqSection";
import {
  SalesFooter,
  SALES_PAGE_FOOTER_LINKS,
  SALES_PRESENTATION_LINK,
} from "@/components/sales/SalesFooter";
import { RecordPageView } from "@/components/analytics/RecordPageView";
import {
  SALES_PAGE_CONTENT,
  SALES_PAGE_INNER,
  SALES_SECTION_FRAME,
} from "@/lib/sales-layout";
import { getCompletedSalesCountForSlug } from "@/lib/public-product-stats";
import { resolveHowItWorksSteps } from "@/lib/how-it-works-resolve";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("title, description_html, main_image_url, is_published")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data || data.is_published !== true) {
    return { title: "Produit | Arc en Ciel" };
  }

  return buildProductMetadata({
    title: data.title,
    descriptionHtml: data.description_html,
    mainImageUrl: data.main_image_url,
    slug,
  });
}

function errorSignature(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    const m = err.message;
    const c =
      "cause" in err && err.cause != null
        ? errorSignature(err.cause as unknown)
        : "";
    return [m, c].filter(Boolean).join(" ");
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    return errorSignature((err as { message: unknown }).message);
  }
  return String(err);
}

function isLikelyNetworkFailure(err: unknown): boolean {
  const s = errorSignature(err).toLowerCase();
  return (
    s.includes("fetch failed") ||
    s.includes("econnrefused") ||
    s.includes("enotfound") ||
    s.includes("etimedout") ||
    s.includes("eai_again") ||
    s.includes("network") ||
    s.includes("connect timeout") ||
    s.includes("und_err_connect_timeout") ||
    s.includes("socket")
  );
}

export default async function SalesPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const query = () =>
    supabase
      .from("products")
      .select(
        "id, updated_at, slug, title, product_type, description_html, price_original, price_promo, currency, timer_duration_minutes, stock_total, sales_count_initial, main_image_url, gallery_urls, product_file_path, payment_link_url, features, use_cases, how_it_works, testimonials, faqs, is_published"
      )
      .eq("slug", slug)
      .maybeSingle();

  let { data, error } = await query();
  for (const ms of [900, 1800] as const) {
    if (!error || !isLikelyNetworkFailure(error)) break;
    await new Promise((r) => setTimeout(r, ms));
    ({ data, error } = await query());
  }
  if (error) notFound();
  if (!data) notFound();

  const product = data as unknown as Product;

  const completedSales = await getCompletedSalesCountForSlug(supabase, slug);
  // Barre rareté CDC : base marketing + ventes réellement complétées (webhook Djomy).
  const sold = Math.max(
    0,
    (product.sales_count_initial ?? 0) + completedSales
  );
  const remaining = Math.max(0, (product.stock_total ?? 0) - sold);

  const isSoldOut = remaining <= 0;

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Arc en Ciel";
  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@example.com";
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "";
  const contactAddressRaw = process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? "";
  const contactAddressLines = contactAddressRaw
    ? contactAddressRaw
        .split(/\r?\n|, /)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 4)
    : null;
  const socialLinks = {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK ?? "",
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM ?? "",
    linkedin: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN ?? "",
    tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK ?? "",
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE ?? "",
    x: process.env.NEXT_PUBLIC_SOCIAL_X ?? "",
    whatsapp: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP ?? "",
  };
  const socialDefaults = {
    facebook: "https://facebook.com/",
    linkedin: "https://www.linkedin.com/",
    tiktok: "https://www.tiktok.com/",
    whatsapp: contactPhone ? `https://wa.me/${contactPhone.replace(/[^\d]/g, "")}` : "",
  };
  const blurb =
    process.env.NEXT_PUBLIC_SITE_BLURB ??
    "Commandez en ligne. Produits électroniques livrés instantanément, produits physiques sur demande.";
  const hasPresentation = Boolean(product.description_html);
  const navLinks = [
    ...(hasPresentation ? [SALES_PRESENTATION_LINK] : []),
    ...SALES_PAGE_FOOTER_LINKS,
    { id: "footer", label: "Contact / CGV" },
  ];

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const canonicalUrl = siteUrl ? `${siteUrl}/p/${product.slug}` : undefined;
  const imageUrl = product.main_image_url
    ? product.main_image_url.startsWith("http")
      ? product.main_image_url
      : siteUrl
        ? `${siteUrl}${product.main_image_url.startsWith("/") ? "" : "/"}${product.main_image_url}`
        : product.main_image_url
    : undefined;
  const price = Number.isFinite(Number(product.price_promo))
    ? Number(product.price_promo)
    : Number(product.price_original);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: stripHtmlToPlain(product.description_html, 300),
    ...(canonicalUrl ? { url: canonicalUrl } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price,
      availability: isSoldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
    },
  };

  return (
    <div className="flex flex-1 flex-col bg-[#F5F5F0] pb-28">
      <RecordPageView slug={product.slug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Desktop : layout en bandes plein écran + container interne large */}
      <main className="w-full">
        <section
          id="hero"
          className="relative border-b border-black/10 bg-white/60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 18% 8%, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.00) 40%), radial-gradient(circle at 80% 20%, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.00) 44%)",
          }}
        >
          <SalesHeader
            variant="sticky"
            title={siteName}
            links={navLinks}
            socialLinks={{
              facebook: socialLinks.facebook || socialDefaults.facebook,
              linkedin: socialLinks.linkedin || socialDefaults.linkedin,
              tiktok: socialLinks.tiktok || socialDefaults.tiktok,
              whatsapp: socialLinks.whatsapp || socialDefaults.whatsapp,
            }}
          />

          {/* Bannière pleine largeur (mobile, tablette, desktop) — visuel + badge DIGITAL */}
          <div className="w-full border-b border-black/10 bg-white">
            <div className="relative aspect-[5/3] w-full max-h-[min(52vw,320px)] bg-black/5 sm:aspect-[2/1] sm:max-h-[min(42vw,380px)] md:max-h-[min(36vw,420px)] lg:aspect-[21/9] lg:max-h-[min(32vw,440px)]">
              <Image
                src="/canva/keyboard-cart.webp"
                alt=""
                fill
                priority
                className="object-cover object-center"
                sizes="100vw"
                quality={75}
              />
              <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 sm:bottom-4">
                <div className="rounded-full bg-[#6b4a2b] px-5 py-1.5 text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(0,0,0,0.25)] sm:px-6 sm:py-2 sm:text-sm [font-family:var(--font-display)]">
                  DIGITAL
                </div>
              </div>
            </div>
          </div>

          <div className={`${SALES_PAGE_CONTENT} pt-6 md:pt-8`}>
            {/* Grille : galerie occupe plus d’espace ; texte aligné à gauche dans la colonne droite, centré verticalement avec l’image */}
            <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:items-center md:gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)] lg:gap-10">
              <Reveal delayMs={80} className="min-w-0 w-full">
                <ProductGallery
                  variant="hero"
                  title={product.title}
                  mainImageUrl={product.main_image_url}
                  galleryUrls={product.gallery_urls}
                />
              </Reveal>

              <div className="flex min-w-0 flex-col items-start justify-center gap-5 text-left md:min-h-0 md:pl-1 lg:pl-2">
                <h1 className="w-full text-left text-4xl font-extrabold leading-[1.08] tracking-tight text-[#FF5A00] [font-family:var(--font-display)] [text-shadow:0_3px_0_rgba(0,0,0,0.18)] sm:text-5xl md:text-5xl lg:text-6xl lg:leading-[1.06]">
                  <BrushText
                    text={product.title}
                    variant="yellow"
                    className="text-[#FF5A00]"
                  />
                </h1>
                <div className="w-full">
                  <HeroPrice
                    emphasis
                    slug={product.slug}
                    version={product.updated_at ?? null}
                    currency={product.currency}
                    priceOriginal={product.price_original}
                    pricePromo={product.price_promo}
                    timerDurationMinutes={product.timer_duration_minutes}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {hasPresentation ? (
          <div className={SALES_PAGE_CONTENT}>
            <Reveal delayMs={30}>
              <section id="about" className="mt-6 scroll-mt-28">
                <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_14px_30px_rgba(0,0,0,0.08)]">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                    Présentation
                  </div>
                  <div
                    className="sales-rich-html mt-3 text-base font-semibold leading-relaxed text-neutral-900"
                    dangerouslySetInnerHTML={{
                      __html: String(product.description_html ?? ""),
                    }}
                  />
                </div>
              </section>
            </Reveal>
          </div>
        ) : null}

        <div className={SALES_PAGE_CONTENT}>
          <Reveal>
            <section
            id="features"
            className="mt-8 scroll-mt-28"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 10%, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.00) 38%), radial-gradient(circle at 80% 30%, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.00) 42%), repeating-radial-gradient(circle at 30% 60%, rgba(0,0,0,0.018) 0px, rgba(0,0,0,0.018) 1px, rgba(255,255,255,0.0) 2px, rgba(255,255,255,0.0) 6px)",
            }}
          >
          {/* Bannière pop-art (identique Canva) */}
          <div className={SALES_PAGE_INNER}>
            {/* Style image 11 (cadre blanc + liseré doré) */}
            <div
              className="relative mx-auto inline-flex rounded-[22px] bg-white px-10 py-5"
              style={{
                boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[6px] rounded-[18px]"
                style={{
                  boxShadow: "inset 0 0 0 4px #B88718",
                }}
              />
              <div
                className="relative text-4xl font-extrabold leading-none"
                style={{
                  fontFamily: "var(--font-anton), Impact, sans-serif",
                  color: "#FF5A00",
                  textShadow:
                    "2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000, 2px 2px #000, -2px 2px #000, 2px -2px #000, -2px -2px #000, 0 5px 0 rgba(0,0,0,0.10)",
                  letterSpacing: "0.5px",
                }}
              >
                Caractéristiques
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(product.features ?? []).slice(0, 3).map((f, idx) => (
              <Reveal key={idx} delayMs={idx * 60}>
                <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-[#F5F5F0] p-4 shadow-[0_12px_26px_rgba(0,0,0,0.10)]">
                <div className="flex flex-col items-center text-center">
                  <div className="text-xl font-extrabold tracking-tight [text-shadow:0_3px_0_rgba(0,0,0,0.18)]">
                    <BrushText
                      text={f.title || `Caractéristique ${idx + 1}`}
                      variant={
                        idx % 3 === 0 ? "pink" : idx % 3 === 1 ? "orange" : "yellow"
                      }
                      className="text-black"
                    />
                  </div>

                  {/* “scotch / bois” centré */}
                  <span
                    aria-hidden="true"
                    className="mt-2 h-10 w-24 rounded-[10px] shadow-[0_10px_18px_rgba(0,0,0,0.14)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(180deg, rgba(186,120,40,0.95), rgba(140,85,20,0.95)), radial-gradient(22px 18px at 30% 40%, rgba(255,255,255,0.25), transparent 70%), repeating-linear-gradient(90deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 2px, rgba(255,255,255,0.00) 3px, rgba(255,255,255,0.00) 10px)",
                    }}
                  />

                  {f.image_url ? (
                    <div className="relative mt-3 h-44 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
                      <Image
                        src={f.image_url}
                        alt=""
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <div
                    className="sales-rich-html mt-3 w-full rounded-2xl bg-[#D9D9D9] px-4 py-10 text-base font-semibold text-black shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
                    dangerouslySetInnerHTML={{ __html: String(f.text ?? "") }}
                  />
                </div>
                </div>
              </Reveal>
            ))}
          </div>
            </section>
          </Reveal>

        <Reveal delayMs={40}>
        <section id="use-cases" className="mt-8 scroll-mt-28">
          {/* Bannière identique Canva (Cas d’usage) */}
          <div className={SALES_PAGE_INNER}>
            <div
              className="mx-auto inline-flex rounded-[26px] bg-white px-10 py-5"
              style={{
                boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
              }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute"
              />
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-[6px] rounded-[18px]"
                  style={{
                    boxShadow: "inset 0 0 0 4px #B88718",
                  }}
                />
                <div
                  className="relative px-1 text-4xl font-extrabold leading-none"
                  style={{
                    fontFamily: "var(--font-anton), Impact, sans-serif",
                    color: "#FF5A00",
                    textShadow:
                      "2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000, 2px 2px #000, -2px 2px #000, 2px -2px #000, -2px -2px #000, 0 5px 0 rgba(0,0,0,0.10)",
                    letterSpacing: "0.5px",
                  }}
                >
                  Cas d’usage
                </div>
              </div>
            </div>
          </div>

          <UseCasesSlider items={product.use_cases ?? []} />
        </section>
        </Reveal>

        <Reveal delayMs={60}>
        <section id="how" className="mt-8 scroll-mt-28">
          {/* Titre : capsule blanche + contour noir + liseré doré (modèle) */}
          <div className={SALES_SECTION_FRAME}>
            <div className="relative mx-auto rounded-[28px] border-[5px] border-black bg-white px-8 py-6 shadow-[8px_12px_0_#000]">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-[11px] rounded-[20px]"
                style={{ boxShadow: "inset 0 0 0 3px #C9A227" }}
              />
              <p
                className="relative text-center text-3xl leading-none sm:text-4xl"
                style={{
                  fontFamily: "var(--font-hand), cursive",
                  color: "#E8381A",
                  textShadow:
                    "2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000, 0 6px 0 rgba(255,214,80,0.95)",
                }}
              >
                Comment ça marche ?
              </p>
            </div>
          </div>

          <HowItWorksGrid
            productType={product.product_type === "physical" ? "physical" : "electronic"}
            steps={resolveHowItWorksSteps(product.how_it_works)}
          />

          <div
            className={`${SALES_PAGE_INNER} mt-6 h-4 rounded-[10px] bg-[#FFD84D] shadow-[0_10px_18px_rgba(0,0,0,0.10)] [transform:rotate(-1deg)]`}
          />
        </section>
        </Reveal>

        <Reveal delayMs={80}>
        <SocialProofSection
          sold={sold}
          remaining={remaining}
          stockTotal={product.stock_total ?? 0}
          testimonials={product.testimonials ?? []}
          slug={product.slug}
          productVersion={product.updated_at ?? null}
          currency={product.currency}
          priceOriginal={product.price_original}
          pricePromo={product.price_promo}
          timerDurationMinutes={product.timer_duration_minutes}
        />
        </Reveal>

        <Reveal delayMs={100}>
        <FaqSection faqs={product.faqs ?? []} />
        </Reveal>

        <Reveal delayMs={120}>
          <SalesFooter
            siteName={siteName}
            tagline="Produits digitaux"
            contactEmail={contactEmail}
            contactPhone={contactPhone || null}
            contactAddressLines={contactAddressLines}
            socialLinks={Object.fromEntries(
              Object.entries(socialLinks).filter(([, v]) => String(v || "").trim())
            )}
            blurb={blurb}
            includePresentation={hasPresentation}
          />
        </Reveal>
        </div>
      </main>

      {/* CTA omniprésent : barre bas en mobile, carte flottante en desktop/tablette */}
      <StickyCta
        placement="responsive"
        slug={product.slug}
        version={product.updated_at ?? null}
        productType={product.product_type === "physical" ? "physical" : "electronic"}
        currency={product.currency}
        priceOriginal={product.price_original}
        pricePromo={product.price_promo}
        timerDurationMinutes={product.timer_duration_minutes}
        disabled={isSoldOut}
      />
    </div>
  );
}

