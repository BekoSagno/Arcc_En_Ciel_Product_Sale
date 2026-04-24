"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { slugify } from "@/lib/slugify";
import { legacyTextToRichEditorHtml } from "@/lib/legacy-rich-html";
import {
  isRichHtmlEmpty,
  sanitizePlainOneLine,
  sanitizeRichHtml,
} from "@/lib/sanitize-rich-html";
import { SimpleRichTextEditor } from "@/components/admin/SimpleRichTextEditor";
import {
  EXAMPLE_DESCRIPTION,
  EXAMPLE_FEATURES,
  EXAMPLE_FAQS,
  EXAMPLE_HOW_IT_WORKS,
  EXAMPLE_PRICE_ORIGINAL,
  EXAMPLE_PRICE_PROMO,
  EXAMPLE_SALES_INITIAL,
  EXAMPLE_STOCK_TOTAL,
  EXAMPLE_TESTIMONIALS,
  EXAMPLE_TIMER_MINUTES,
  EXAMPLE_TITLE,
  EXAMPLE_USE_CASES,
} from "@/lib/product-form-defaults";

type TabId = "infos" | "medias" | "contenu";

const FormSchema = z.object({
  title: z.string().min(1, "Titre requis"),
  slug: z.string().min(1, "Slug requis"),
  category: z.string().min(1, "Catégorie requise").default("Autres"),
  product_type: z.enum(["electronic", "physical"]).default("electronic"),
  price_original: z.coerce.number().min(0),
  price_promo: z.coerce.number().min(0),
  currency: z.string().min(1).default("GNF"),
  timer_duration_minutes: z.coerce.number().int().min(1).default(15),
  stock_total: z.coerce.number().int().min(0).default(100),
  sales_count_initial: z.coerce.number().int().min(0).default(0),
  is_published: z.coerce.boolean().default(true),
  main_image_url: z.string().optional().nullable(),
  gallery_urls: z.array(z.string()).optional().nullable(),
  product_file_path: z.string().optional().nullable(),
  description_html: z.string().optional().nullable(),
  features: z.array(
    z.object({
      title: z.string(),
      text: z.string(),
      image_url: z.string().optional().nullable(),
    })
  ),
  use_cases: z.array(z.object({ title: z.string(), text: z.string() })),
  how_it_works: z.array(z.object({ text: z.string() })),
  testimonials: z.array(
    z.object({
      name: z.string(),
      rating: z.coerce.number().min(1).max(5),
      text: z.string(),
      date: z.string().optional().nullable(),
    })
  ),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })),
});

type InitialProduct = Partial<z.infer<typeof FormSchema>> & {
  id?: string;
  description_html?: string | null;
};

function FieldLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <div className="text-base font-extrabold text-neutral-900">{children}</div>
      {hint ? (
        <p className="mt-0.5 text-xs leading-snug text-neutral-700">{hint}</p>
      ) : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-3 text-base text-neutral-900 shadow-sm outline-none focus:border-[#0b6b63] focus:ring-2 focus:ring-[#0b6b63]/20";
const btnSecondary =
  "rounded-xl border-2 border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50";
const btnGhost =
  "rounded-lg px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-50";

export function NewProductForm({
  productId,
  initialProduct,
  initialTab,
}: {
  productId?: string;
  initialProduct?: InitialProduct | null;
  initialTab?: TabId;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(initialTab ?? "infos");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = useState(initialProduct?.title ?? EXAMPLE_TITLE);
  const slugAuto = useMemo(() => slugify(title), [title]);
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initialProduct?.slug));
  const [category] = useState(
    String((initialProduct as { category?: unknown } | null | undefined)?.category ?? "Autres")
  );
  const [productType] = useState<"electronic" | "physical">(
    (initialProduct as { product_type?: unknown } | null | undefined)?.product_type === "physical"
      ? "physical"
      : "electronic"
  );

  const [priceOriginal, setPriceOriginal] = useState(
    initialProduct?.price_original ?? EXAMPLE_PRICE_ORIGINAL
  );
  const [pricePromo, setPricePromo] = useState(
    initialProduct?.price_promo ?? EXAMPLE_PRICE_PROMO
  );
  const [currency, setCurrency] = useState(initialProduct?.currency ?? "GNF");
  const [timer, setTimer] = useState(
    initialProduct?.timer_duration_minutes ?? EXAMPLE_TIMER_MINUTES
  );
  const [stockTotal, setStockTotal] = useState(
    initialProduct?.stock_total ?? EXAMPLE_STOCK_TOTAL
  );
  const [salesInitial, setSalesInitial] = useState(
    initialProduct?.sales_count_initial ?? EXAMPLE_SALES_INITIAL
  );
  const [isPublished, setIsPublished] = useState(
    initialProduct?.is_published ?? true
  );

  const [mainImage, setMainImage] = useState<string>(() =>
    String(initialProduct?.main_image_url ?? "").trim()
  );
  const [thumbs, setThumbs] = useState<string[]>(() =>
    ((initialProduct?.gallery_urls as string[] | null | undefined) ?? [])
      .map((s) => String(s ?? "").trim())
      .filter(Boolean)
      .slice(0, 4)
  );
  const [productFileUrl, setProductFileUrl] = useState(
    initialProduct?.product_file_path ?? ""
  );
  const [descriptionHtml, setDescriptionHtml] = useState(() => {
    if (initialProduct?.description_html) {
      return legacyTextToRichEditorHtml(initialProduct.description_html);
    }
    return legacyTextToRichEditorHtml(EXAMPLE_DESCRIPTION);
  });

  const [aiIdea, setAiIdea] = useState("");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const [mediaProgress, setMediaProgress] = useState<{ done: number; total: number } | null>(null);

  const MAX_THUMBS = 4;

  const [features, setFeatures] = useState(() => {
    const fromDb = Array.isArray(initialProduct?.features)
      ? (initialProduct?.features as unknown as typeof EXAMPLE_FEATURES)
      : null;
    return (fromDb ?? EXAMPLE_FEATURES).map((f) => ({
      ...f,
      text: legacyTextToRichEditorHtml(String(f.text ?? "")),
    }));
  });
  const [useCases, setUseCases] = useState(() => {
    const fromDb = Array.isArray(initialProduct?.use_cases)
      ? (initialProduct?.use_cases as unknown as typeof EXAMPLE_USE_CASES)
      : null;
    return (fromDb ?? EXAMPLE_USE_CASES).map((u) => ({
      ...u,
      text: legacyTextToRichEditorHtml(String(u.text ?? "")),
    }));
  });
  const [howRows, setHowRows] = useState(() => {
    const fromDb = Array.isArray(initialProduct?.how_it_works)
      ? (initialProduct?.how_it_works as unknown as typeof EXAMPLE_HOW_IT_WORKS)
      : null;
    return (fromDb ?? EXAMPLE_HOW_IT_WORKS).map((s) => ({
      text: legacyTextToRichEditorHtml(String(s.text ?? "")),
    }));
  });
  const [testimonials, setTestimonials] = useState(() => {
    const fromDb = Array.isArray(initialProduct?.testimonials)
      ? (initialProduct?.testimonials as unknown as typeof EXAMPLE_TESTIMONIALS)
      : null;
    return (fromDb ?? EXAMPLE_TESTIMONIALS).map((t) => ({
      ...t,
      text: legacyTextToRichEditorHtml(String(t.text ?? "")),
    }));
  });
  const [faqs, setFaqs] = useState(() => {
    const fromDb = Array.isArray(initialProduct?.faqs)
      ? (initialProduct?.faqs as unknown as typeof EXAMPLE_FAQS)
      : null;
    return (fromDb ?? EXAMPLE_FAQS).map((f) => ({
      ...f,
      answer: legacyTextToRichEditorHtml(String(f.answer ?? "")),
    }));
  });

  async function uploadViaAdminApi(file: File, kind: "image" | "file"): Promise<string> {
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kind);
    const res = await fetch("/api/admin/upload-product-asset", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      url?: string;
    };
    if (!res.ok || !data.ok || !data.url) {
      throw new Error(data.error || "Échec de l’envoi du fichier.");
    }
    return data.url;
  }

  async function runUpload(
    label: string,
    fn: () => Promise<void>
  ): Promise<void> {
    setUploadBusy(label);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec de l’envoi du fichier.";
      setError(msg);
      toast.error(msg);
      // Si l'utilisateur est scrolé plus bas, on remonte vers l'erreur.
      window.setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } finally {
      setUploadBusy(null);
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "infos", label: "Infos & prix" },
    { id: "medias", label: "Médias & texte" },
    { id: "contenu", label: "Contenu de la page" },
  ];

  const nextTab: TabId | null =
    tab === "infos" ? "medias" : tab === "medias" ? "contenu" : null;
  const submitLabel = tab === "contenu" ? "Publier le produit" : "Enregistrer et suivant";
  const submitLoadingLabel = tab === "contenu" ? "Publication…" : "Enregistrement…";

  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugAuto);
  }, [slugAuto, slugTouched]);

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <div className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-neutral-900">
              Nouveau produit
            </h1>
          </div>
          <button
            type="button"
            className={btnSecondary}
            onClick={() => router.push("/admin")}
          >
            ← Retour tableau de bord
          </button>
        </div>

        <div className="mx-auto flex max-w-5xl gap-1 border-t border-neutral-100 px-4 pb-3 pt-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                "rounded-lg px-3 py-2 text-sm font-semibold transition",
                tab === t.id
                  ? "bg-[#0b6b63] text-white shadow-sm"
                  : "text-neutral-800 hover:bg-neutral-100",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {error ? (
          <div
            ref={errorRef}
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            {error}
          </div>
        ) : null}

        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
              const slugFinal = (slug || slugAuto).trim();
              const safeTrim = (v: unknown) => String(v ?? "").trim();
              const feats = features
                .filter((r) => {
                  const textSan = sanitizeRichHtml(r.text);
                  return (
                    sanitizePlainOneLine(r.title).length > 0 ||
                    !isRichHtmlEmpty(textSan) ||
                    safeTrim((r as { image_url?: unknown }).image_url)
                  );
                })
                .map((r) => {
                  const textSan = sanitizeRichHtml(r.text);
                  return {
                    title: sanitizePlainOneLine(r.title) || "Point clé",
                    text: isRichHtmlEmpty(textSan) ? "—" : textSan,
                    ...(safeTrim((r as { image_url?: unknown }).image_url)
                      ? { image_url: safeTrim((r as { image_url?: unknown }).image_url) }
                      : {}),
                  };
                });
              const ucs = useCases
                .filter((r) => {
                  const textSan = sanitizeRichHtml(r.text);
                  return (
                    sanitizePlainOneLine(r.title).length > 0 || !isRichHtmlEmpty(textSan)
                  );
                })
                .map((r) => {
                  const textSan = sanitizeRichHtml(r.text);
                  return {
                    title: sanitizePlainOneLine(r.title) || "Cas d’usage",
                    text: isRichHtmlEmpty(textSan) ? "—" : textSan,
                  };
                });
              const how = howRows
                .map((r) => ({ text: sanitizeRichHtml(r.text) }))
                .filter((r) => !isRichHtmlEmpty(r.text));
              const tms = testimonials
                .filter((r) => {
                  const name = sanitizePlainOneLine(r.name);
                  const textSan = sanitizeRichHtml(r.text);
                  return name.length > 0 || !isRichHtmlEmpty(textSan);
                })
                .map((r) => {
                  const name = sanitizePlainOneLine(r.name) || "Client";
                  const textSan = sanitizeRichHtml(r.text);
                  return {
                    name,
                    rating: r.rating,
                    text: isRichHtmlEmpty(textSan) ? "—" : textSan,
                    date: safeTrim(r.date) || undefined,
                  };
                });
              const faqList = faqs
                .filter((r) => {
                  const q = sanitizePlainOneLine(r.question);
                  const a = sanitizeRichHtml(r.answer);
                  return q.length > 0 && !isRichHtmlEmpty(a);
                })
                .map((r) => {
                  const q = sanitizePlainOneLine(r.question);
                  const a = sanitizeRichHtml(r.answer);
                  return {
                    question: q,
                    answer: isRichHtmlEmpty(a) ? "—" : a,
                  };
                });

              const payload = FormSchema.parse({
                title: title.trim(),
                slug: slugFinal,
                category: sanitizePlainOneLine(category) || "Autres",
                product_type: productType,
                price_original: priceOriginal,
                price_promo: pricePromo,
                currency,
                timer_duration_minutes: timer,
                stock_total: stockTotal,
                sales_count_initial: salesInitial,
                is_published: isPublished,
                main_image_url: mainImage?.trim() || null,
                gallery_urls: thumbs.filter((u) => String(u).startsWith("http")).length
                  ? thumbs.filter((u) => String(u).startsWith("http"))
                  : null,
                product_file_path:
                  productType === "physical" ? null : productFileUrl.trim() || null,
                description_html: (() => {
                  const san = sanitizeRichHtml(descriptionHtml);
                  return isRichHtmlEmpty(san) ? null : san;
                })(),
                features: feats,
                use_cases: ucs,
                how_it_works: how,
                testimonials: tms,
                faqs: faqList,
              });

              const res = await fetch(
                productId
                  ? `/api/admin/products/${encodeURIComponent(productId)}`
                  : "/api/admin/products",
                {
                  method: productId ? "PUT" : "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    ...payload,
                    gallery_urls: payload.gallery_urls ?? [],
                  }),
                }
              );
              const data = (await res.json().catch(() => ({}))) as {
                ok?: boolean;
                id?: string;
                slug?: string;
                error?: string;
              };
              if (!res.ok || !data.ok) {
                throw new Error(data.error || "Erreur lors de l’enregistrement.");
              }
              toast.success(
                productId ? "Produit enregistré." : "Produit créé."
              );
              const nextId = data.id || productId;
              if (nextId) {
                const tabParam = nextTab ? `?tab=${encodeURIComponent(nextTab)}` : "";
                router.replace(`/admin/products/${encodeURIComponent(nextId)}${tabParam}`);
                if (nextTab) setTab(nextTab);
              } else if (data.slug) {
                router.replace(`/p/${encodeURIComponent(data.slug)}`);
              }
              router.refresh();
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Erreur lors de l’enregistrement."
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          {tab === "infos" ? (
            <div className="animate-ui-enter rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
              <h2 className="text-base font-extrabold text-neutral-900">
                Informations générales
              </h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>Nom du produit</FieldLabel>
                  <input
                    className={inputClass}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>URL du produit</FieldLabel>
                  <input
                    className={`${inputClass} font-mono text-xs`}
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    required
                  />
                </div>
                <div>
                  <FieldLabel>Prix d’affichage « barré »</FieldLabel>
                  <input
                    type="number"
                    className={inputClass}
                    value={priceOriginal}
                    onChange={(e) => setPriceOriginal(Number(e.target.value))}
                  />
                </div>
                <div>
                  <FieldLabel>Prix promotionnel actuel</FieldLabel>
                  <input
                    type="number"
                    className={inputClass}
                    value={pricePromo}
                    onChange={(e) => setPricePromo(Number(e.target.value))}
                  />
                </div>
                <div>
                  <FieldLabel>Devise</FieldLabel>
                  <input
                    className={inputClass}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Compte à rebours (minutes)</FieldLabel>
                  <input
                    type="number"
                    className={inputClass}
                    value={timer}
                    onChange={(e) => setTimer(Number(e.target.value))}
                  />
                </div>
                <div>
                  <FieldLabel>Stock affiché (total)</FieldLabel>
                  <input
                    type="number"
                    className={inputClass}
                    value={stockTotal}
                    onChange={(e) => setStockTotal(Number(e.target.value))}
                  />
                </div>
                <div>
                  <FieldLabel>Déjà vendus (nombre de départ)</FieldLabel>
                  <input
                    type="number"
                    className={inputClass}
                    value={salesInitial}
                    onChange={(e) => setSalesInitial(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {tab === "medias" ? (
            <div className="animate-ui-enter rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
              <h2 className="text-base font-extrabold text-neutral-900">
                Médias & texte de présentation
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>Images du produit</FieldLabel>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                      <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                        Image principale (1)
                      </div>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="block w-full rounded-xl border-2 border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-[#0b6b63] focus:ring-2 focus:ring-[#0b6b63]/20"
                          disabled={!!uploadBusy}
                          onChange={(e) => {
                            const input = e.currentTarget;
                            const file = input.files?.[0] ?? null;
                            input.value = "";
                            if (!file) return;
                            if (uploadBusy) return;
                            const localUrl = URL.createObjectURL(file);
                            setMainImage(localUrl);
                            setMediaStatus("Image principale sélectionnée. Téléversement…");
                            void runUpload("main-image", async () => {
                              const remote = await uploadViaAdminApi(file, "image");
                              setMainImage(remote);
                              window.setTimeout(() => URL.revokeObjectURL(localUrl), 0);
                              setMediaStatus("Image principale téléversée.");
                            });
                          }}
                        />
                      </div>

                      <div className="mt-3 relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
                        {mainImage ? (
                          mainImage.startsWith("blob:") || mainImage.startsWith("data:") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={mainImage}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <Image
                              src={mainImage}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          )
                        ) : null}
                      </div>

                      {mainImage ? (
                        <button
                          type="button"
                          className="mt-3 w-full rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-extrabold text-black shadow-sm hover:bg-neutral-50"
                          disabled={!!uploadBusy}
                          onClick={() => {
                            setMainImage("");
                            setMediaStatus("Image principale retirée.");
                          }}
                        >
                          Retirer l’image principale
                        </button>
                      ) : null}

                      {thumbs.length ? (
                        <div className="mt-3">
                          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
                            Miniatures ({thumbs.length}/{MAX_THUMBS})
                          </div>
                          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                            {thumbs.map((url, i) => (
                              <div
                                key={url + i}
                                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-neutral-100 sm:h-16 sm:w-16"
                              >
                                {url.startsWith("blob:") || url.startsWith("data:") ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={url}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover"
                                  />
                                ) : (
                                  <Image
                                    src={url}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                )}
                                <button
                                  type="button"
                                  className="absolute right-1 top-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-extrabold text-white"
                                  disabled={!!uploadBusy}
                                  onClick={() => setThumbs((prev) => prev.filter((_, j) => j !== i))}
                                  aria-label="Retirer la miniature"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                            Miniatures (jusqu’à {MAX_THUMBS})
                          </div>
                          <div className="mt-1 text-xs font-semibold text-neutral-700">
                            Ajoute 1 à {MAX_THUMBS} images (elles s’affichent sous l’image principale).
                          </div>
                        </div>
                        <div className="text-xs font-extrabold text-neutral-900">
                          {thumbs.length}/{MAX_THUMBS}
                        </div>
                      </div>

                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="block w-full rounded-xl border-2 border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none focus:border-[#0b6b63] focus:ring-2 focus:ring-[#0b6b63]/20"
                          disabled={!!uploadBusy}
                          onChange={(e) => {
                            const input = e.currentTarget;
                            const filesArr = Array.from(input.files ?? []);
                            input.value = "";
                            if (!filesArr.length) return;
                            if (uploadBusy) return;
                            const remaining = Math.max(0, MAX_THUMBS - thumbs.length);
                            if (remaining <= 0) {
                              toast.error(`Maximum ${MAX_THUMBS} miniatures.`);
                              return;
                            }
                            const picked = filesArr.slice(0, remaining);
                            const localUrls = picked.map((f) => URL.createObjectURL(f));
                            setThumbs((prev) => [...prev, ...localUrls].slice(0, MAX_THUMBS));
                            setMediaProgress({ done: 0, total: picked.length });
                            setMediaStatus(`Miniatures: ${picked.length} image(s) sélectionnée(s). Téléversement…`);
                            void runUpload("thumbs", async () => {
                              const uploaded: string[] = [];
                              const settled = await Promise.allSettled(
                                picked.map(async (f) => uploadViaAdminApi(f, "image"))
                              );
                              for (const r of settled) {
                                if (r.status === "fulfilled") {
                                  uploaded.push(r.value);
                                  setMediaProgress((p) =>
                                    p ? { ...p, done: Math.min(p.total, p.done + 1) } : p
                                  );
                                } else {
                                  throw r.reason instanceof Error
                                    ? r.reason
                                    : new Error("Échec de l’envoi du fichier.");
                                }
                              }
                              setThumbs((prev) => {
                                const keep = prev.filter((u) => !localUrls.includes(u));
                                return [...keep, ...uploaded].slice(0, MAX_THUMBS);
                              });
                              window.setTimeout(() => {
                                for (const u of localUrls) URL.revokeObjectURL(u);
                              }, 0);
                              setMediaProgress(null);
                              setMediaStatus("Miniatures téléversées.");
                            });
                          }}
                        />
                      </div>

                      {mediaProgress ? (
                        <div className="mt-2 text-xs font-semibold text-neutral-800">
                          Progression : {mediaProgress.done}/{mediaProgress.total}
                        </div>
                      ) : null}

                      {thumbs.length ? (
                        <button
                          type="button"
                          className="mt-3 w-full rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-extrabold text-black shadow-sm hover:bg-neutral-50"
                          disabled={!!uploadBusy}
                          onClick={() => {
                            setThumbs([]);
                            setMediaStatus("Miniatures retirées.");
                          }}
                        >
                          Tout retirer (miniatures)
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {mediaStatus ? (
                    <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-900">
                      {mediaStatus}
                    </div>
                  ) : null}
                </div>

                {productType === "electronic" ? (
                  <div className="md:col-span-2">
                    <FieldLabel>Fichier produit (téléchargement)</FieldLabel>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer rounded-xl border-2 border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50">
                        {uploadBusy === "file" ? "Envoi…" : "Choisir un fichier"}
                        <input
                          type="file"
                          className="sr-only"
                          disabled={!!uploadBusy}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            void runUpload("file", async () => {
                              const url = await uploadViaAdminApi(file, "file");
                              setProductFileUrl(url);
                            });
                          }}
                        />
                      </label>
                      {productFileUrl ? (
                        <a
                          href={productFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate text-sm font-medium text-[#0b6b63] underline"
                        >
                          Lien du fichier
                        </a>
                      ) : null}
                      {productFileUrl ? (
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() => setProductFileUrl("")}
                        >
                          Retirer
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="md:col-span-2 rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="text-sm font-extrabold text-neutral-900">
                    Auto‑remplissage IA (Gemini)
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-extrabold text-neutral-900">
                        Document (image / PDF / DOCX / TXT)
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="mt-2 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-3 text-base text-neutral-900 shadow-sm outline-none focus:border-[#0b6b63] focus:ring-2 focus:ring-[#0b6b63]/20"
                        disabled={aiBusy}
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setAiFile(f);
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-extrabold text-neutral-900">
                        Votre idée (optionnel)
                      </label>
                      <textarea
                        className="mt-2 min-h-[56px] w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-3 text-base text-neutral-900 shadow-sm outline-none focus:border-[#0b6b63] focus:ring-2 focus:ring-[#0b6b63]/20"
                        value={aiIdea}
                        disabled={aiBusy}
                        onChange={(e) => setAiIdea(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-2xl bg-black px-5 py-2.5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.22)] active:scale-[0.99] disabled:opacity-55 disabled:hover:translate-y-0"
                      disabled={aiBusy || (!aiFile && !aiIdea.trim())}
                      onClick={async () => {
                        setAiBusy(true);
                        setError(null);
                        try {
                          const fd = new FormData();
                          if (aiFile) fd.set("file", aiFile);
                          fd.set("idea", aiIdea);
                          fd.set("category", category);
                          fd.set("currency", currency);
                          const res = await fetch("/api/admin/ai/product-autofill", {
                            method: "POST",
                            credentials: "include",
                            body: fd,
                          });
                          const data = (await res.json().catch(() => ({}))) as {
                            ok?: boolean;
                            error?: string;
                            draft?: {
                              description_html: string;
                              features: { title: string; text: string; image_url?: string }[];
                              use_cases: { title: string; text: string }[];
                              how_it_works: { text: string }[];
                              faqs: { question: string; answer: string }[];
                              testimonials: {
                                name: string;
                                rating: number;
                                text: string;
                                date?: string;
                              }[];
                            };
                          };
                          if (!res.ok || !data.ok || !data.draft) {
                            throw new Error(data.error || "Erreur IA.");
                          }
                          setDescriptionHtml(data.draft.description_html || "<p></p>");
                          setFeatures(() =>
                            (data.draft?.features ?? []).map((f) => ({
                              title: f.title || "Point clé",
                              text: f.text || "<p>—</p>",
                              image_url: f.image_url || "",
                            }))
                          );
                          setUseCases(() =>
                            (data.draft?.use_cases ?? []).map((u) => ({
                              title: u.title || "Cas d’usage",
                              text: u.text || "<p>—</p>",
                            }))
                          );
                          setHowRows(() =>
                            (data.draft?.how_it_works ?? []).map((s) => ({
                              text: s.text || "<p>—</p>",
                            }))
                          );
                          setFaqs(() =>
                            (data.draft?.faqs ?? []).map((f) => ({
                              question: f.question || "Question",
                              answer: f.answer || "<p>—</p>",
                            }))
                          );
                          setTestimonials(() =>
                            (data.draft?.testimonials ?? []).map((t) => ({
                              name: t.name || "Client",
                              rating: t.rating || 5,
                              text: t.text || "<p>—</p>",
                              date: t.date || new Date().toISOString().slice(0, 10),
                            }))
                          );
                          toast.success("Brouillon généré.");
                          setTab("contenu");
                        } catch (e) {
                          setError(e instanceof Error ? e.message : "Erreur IA.");
                        } finally {
                          setAiBusy(false);
                        }
                      }}
                    >
                      {aiBusy ? "Génération…" : "Générer automatiquement"}
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl border border-black/15 bg-white px-4 py-2.5 text-sm font-extrabold text-black shadow-sm hover:bg-neutral-50 disabled:opacity-55"
                      disabled={aiBusy}
                      onClick={() => {
                        setAiIdea("");
                        setAiFile(null);
                      }}
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {tab === "contenu" ? (
            <div className="animate-ui-enter space-y-6">
              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                <h2 className="text-base font-extrabold text-neutral-900">
                  Présentation du produit
                </h2>
                <div className="mt-3">
                  <SimpleRichTextEditor
                    value={descriptionHtml}
                    onChange={setDescriptionHtml}
                    editorMinHeightClassName="min-h-[160px]"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                <h2 className="text-base font-extrabold text-neutral-900">
                  Points forts (3 blocs sur la page)
                </h2>
                <div className="mt-4 space-y-4">
                  {features.map((row, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-neutral-600">
                          Bloc {i + 1}
                        </span>
                        {features.length > 1 ? (
                          <button
                            type="button"
                            className={btnGhost}
                            onClick={() =>
                              setFeatures((rows) => rows.filter((_, j) => j !== i))
                            }
                          >
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                      <input
                        className={`${inputClass} mb-2`}
                        placeholder="Titre"
                        value={row.title}
                        onChange={(e) =>
                          setFeatures((rows) =>
                            rows.map((r, j) =>
                              j === i ? { ...r, title: e.target.value } : r
                            )
                          )
                        }
                      />
                      <SimpleRichTextEditor
                        value={row.text}
                        onChange={(html) =>
                          setFeatures((rows) =>
                            rows.map((r, j) => (j === i ? { ...r, text: html } : r))
                          )
                        }
                      />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-900">
                          {uploadBusy === `feat-${i}` ? "…" : "Image du bloc"}
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            disabled={!!uploadBusy}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (!file) return;
                              void runUpload(`feat-${i}`, async () => {
                                const url = await uploadViaAdminApi(file, "image");
                                setFeatures((rows) =>
                                  rows.map((r, j) =>
                                    j === i ? { ...r, image_url: url } : r
                                  )
                                );
                              });
                            }}
                          />
                        </label>
                        {row.image_url ? (
                          <button
                            type="button"
                            className="text-xs font-semibold text-red-700"
                            onClick={() =>
                              setFeatures((rows) =>
                                rows.map((r, j) =>
                                  j === i ? { ...r, image_url: "" } : r
                                )
                              )
                            }
                          >
                            Retirer l’image
                          </button>
                        ) : null}
                      </div>
                      {row.image_url ? (
                        <div className="relative mt-2 h-28 max-w-xs overflow-hidden rounded-lg border border-neutral-200">
                          <Image
                            src={row.image_url}
                            alt=""
                            fill
                            className="object-contain bg-white"
                            unoptimized
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() =>
                      setFeatures((r) => [
                        ...r,
                        { title: "", text: "", image_url: "" },
                      ])
                    }
                  >
                    + Ajouter un bloc
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                <h2 className="text-base font-extrabold text-neutral-900">
                  Cas d’usage
                </h2>
                <div className="mt-4 space-y-4">
                  {useCases.map((row, i) => (
                    <div key={i} className="rounded-xl border border-neutral-200 p-4">
                      <div className="mb-2 flex justify-end">
                        {useCases.length > 1 ? (
                          <button
                            type="button"
                            className={btnGhost}
                            onClick={() =>
                              setUseCases((rows) => rows.filter((_, j) => j !== i))
                            }
                          >
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                      <input
                        className={`${inputClass} mb-2`}
                        placeholder="Titre du cas"
                        value={row.title}
                        onChange={(e) =>
                          setUseCases((rows) =>
                            rows.map((r, j) =>
                              j === i ? { ...r, title: e.target.value } : r
                            )
                          )
                        }
                      />
                      <SimpleRichTextEditor
                        value={row.text}
                        onChange={(html) =>
                          setUseCases((rows) =>
                            rows.map((r, j) => (j === i ? { ...r, text: html } : r))
                          )
                        }
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() =>
                      setUseCases((r) => [...r, { title: "", text: "" }])
                    }
                  >
                    + Ajouter un cas
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                <h2 className="text-base font-extrabold text-neutral-900">
                  Comment ça marche (étapes)
                </h2>
                <div className="mt-4 space-y-3">
                  {howRows.map((row, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFD84D] text-sm font-extrabold text-black">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <SimpleRichTextEditor
                          value={row.text}
                          editorMinHeightClassName="min-h-[72px]"
                          onChange={(html) =>
                            setHowRows((rows) =>
                              rows.map((r, j) =>
                                j === i ? { text: html } : r
                              )
                            )
                          }
                        />
                      </div>
                      {howRows.length > 1 ? (
                        <button
                          type="button"
                          className="self-start text-sm font-semibold text-red-700"
                          onClick={() =>
                            setHowRows((rows) => rows.filter((_, j) => j !== i))
                          }
                        >
                          ×
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() => setHowRows((r) => [...r, { text: "" }])}
                  >
                    + Ajouter une étape
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                <h2 className="text-base font-extrabold text-neutral-900">
                  Avis clients
                </h2>
                <div className="mt-4 space-y-4">
                  {testimonials.map((row, i) => (
                    <div key={i} className="rounded-xl border border-neutral-200 p-4">
                      <div className="mb-2 flex justify-end">
                        <button
                          type="button"
                          className={btnGhost}
                          onClick={() =>
                            setTestimonials((rows) =>
                              rows.filter((_, j) => j !== i)
                            )
                          }
                        >
                          Supprimer
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          className={inputClass}
                          placeholder="Prénom N."
                          value={row.name}
                          onChange={(e) =>
                            setTestimonials((rows) =>
                              rows.map((r, j) =>
                                j === i ? { ...r, name: e.target.value } : r
                              )
                            )
                          }
                        />
                        <div>
                          <label className="text-xs font-semibold text-neutral-800">
                            Note (1 à 5)
                          </label>
                          <select
                            className={`${inputClass} mt-1`}
                            value={row.rating}
                            onChange={(e) =>
                              setTestimonials((rows) =>
                                rows.map((r, j) =>
                                  j === i
                                    ? { ...r, rating: Number(e.target.value) }
                                    : r
                                )
                              )
                            }
                          >
                            {[5, 4, 3, 2, 1].map((n) => (
                              <option key={n} value={n}>
                                {n} étoile{n > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="date"
                          className={inputClass}
                          value={row.date}
                          onChange={(e) =>
                            setTestimonials((rows) =>
                              rows.map((r, j) =>
                                j === i ? { ...r, date: e.target.value } : r
                              )
                            )
                          }
                        />
                      </div>
                      <div className="mt-2">
                        <SimpleRichTextEditor
                          value={row.text}
                          onChange={(html) =>
                            setTestimonials((rows) =>
                              rows.map((r, j) => (j === i ? { ...r, text: html } : r))
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() =>
                      setTestimonials((r) => [
                        ...r,
                        {
                          name: "",
                          rating: 5,
                          text: "",
                          date: new Date().toISOString().slice(0, 10),
                        },
                      ])
                    }
                  >
                    + Ajouter un avis
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
                <h2 className="text-base font-extrabold text-neutral-900">
                  Questions fréquentes (FAQ)
                </h2>
                <div className="mt-4 space-y-4">
                  {faqs.map((row, i) => (
                    <div key={i} className="rounded-xl border border-neutral-200 p-4">
                      <div className="mb-2 flex justify-end">
                        {faqs.length > 1 ? (
                          <button
                            type="button"
                            className={btnGhost}
                            onClick={() =>
                              setFaqs((rows) => rows.filter((_, j) => j !== i))
                            }
                          >
                            Supprimer
                          </button>
                        ) : null}
                      </div>
                      <input
                        className={`${inputClass} mb-2`}
                        placeholder="Question"
                        value={row.question}
                        onChange={(e) =>
                          setFaqs((rows) =>
                            rows.map((r, j) =>
                              j === i ? { ...r, question: e.target.value } : r
                            )
                          )
                        }
                      />
                      <SimpleRichTextEditor
                        value={row.answer}
                        onChange={(html) =>
                          setFaqs((rows) =>
                            rows.map((r, j) => (j === i ? { ...r, answer: html } : r))
                          )
                        }
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className={btnSecondary}
                    onClick={() =>
                      setFaqs((r) => [...r, { question: "", answer: "" }])
                    }
                  >
                    + Ajouter une FAQ
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          {tab === "contenu" ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
              <input
                id="pub"
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              <label htmlFor="pub" className="text-sm font-semibold text-neutral-900">
                Publier tout de suite (visible sur le site)
              </label>
            </div>
          ) : null}

          <div className="flex justify-end border-t border-neutral-200 pt-4">
            <button
              type="submit"
              disabled={loading || !!uploadBusy}
              className="rounded-2xl bg-gradient-to-r from-[#0b6b63] to-[#0d847a] px-8 py-3 text-sm font-extrabold text-white shadow-md transition hover:brightness-105 disabled:opacity-55"
            >
              {loading ? submitLoadingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}