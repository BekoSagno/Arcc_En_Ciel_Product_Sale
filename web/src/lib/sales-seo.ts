import type { Metadata } from "next";

/** Extrait un extrait plain-text depuis du HTML (description produit). */
export function stripHtmlToPlain(
  html: string | null | undefined,
  maxLen = 160
): string {
  if (!html) return "";
  const t = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, Math.max(0, maxLen - 1))}…`;
}

export type ProductSeoInput = {
  title: string;
  descriptionHtml: string | null | undefined;
  mainImageUrl: string | null | undefined;
  slug: string;
};

export function buildProductMetadata(input: ProductSeoInput): Metadata {
  const site = process.env.NEXT_PUBLIC_SITE_NAME ?? "Arc en Ciel";
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const desc =
    stripHtmlToPlain(input.descriptionHtml, 160) ||
    `Découvrez ${input.title} — ${site}.`;

  const canonical = base ? `${base}/p/${input.slug}` : undefined;

  let ogImage: string | undefined;
  if (input.mainImageUrl) {
    ogImage = input.mainImageUrl.startsWith("http")
      ? input.mainImageUrl
      : base
        ? `${base}${input.mainImageUrl.startsWith("/") ? "" : "/"}${input.mainImageUrl}`
        : input.mainImageUrl;
  }

  const fullTitle = `${input.title} | ${site}`;

  return {
    title: fullTitle,
    description: desc,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: input.title,
      description: desc,
      url: canonical,
      siteName: site,
      type: "website",
      locale: "fr_FR",
      ...(ogImage ? { images: [{ url: ogImage, alt: input.title }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: input.title,
      description: desc,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
