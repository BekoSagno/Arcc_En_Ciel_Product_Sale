"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Testimonial } from "@/types/sales-page";
import { HeroPrice } from "@/components/sales/HeroPrice";
import { SALES_SECTION_FRAME } from "@/lib/sales-layout";

const SLIDE_COUNT = 3;
const AUTOPLAY_MS = 4500;

const PLACEHOLDER_SLOT: Testimonial = {
  name: "Nom ici",
  date: "date ici",
  text: "Votre texte ici !",
  rating: 5,
};

const PLACEHOLDER_TESTIMONIALS: Testimonial[] = [
  { ...PLACEHOLDER_SLOT, rating: 4 },
  { ...PLACEHOLDER_SLOT, rating: 5 },
  { ...PLACEHOLDER_SLOT, rating: 3 },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Toujours 3 fiches : données réelles puis placeholders. */
function buildThreeProfiles(testimonials: Testimonial[]): Testimonial[] {
  const source =
    testimonials.length > 0 ? testimonials : PLACEHOLDER_TESTIMONIALS;
  const out: Testimonial[] = [];
  for (let i = 0; i < SLIDE_COUNT; i++) {
    out.push(source[i] ?? { ...PLACEHOLDER_SLOT, rating: 4 + (i % 2) });
  }
  return out;
}

function AvatarPlaceholder() {
  return (
    <div
      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-sky-200 via-sky-100 to-amber-200"
      aria-hidden
    >
      <div className="absolute bottom-1.5 left-1/2 h-3 w-8 -translate-x-1/2 rounded-t-full bg-white/90" />
    </div>
  );
}

function StarRow({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <div className="mt-auto flex justify-center gap-0.5 pt-4 text-lg leading-none">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= r ? "text-[#EAB308]" : "text-neutral-200"}
          aria-hidden
        >
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <article className="mx-auto flex min-h-[220px] w-full max-w-md flex-col rounded-2xl bg-white px-5 py-5 shadow-[0_4px_20px_rgba(15,23,42,0.08)] md:max-w-none">
      <div className="flex gap-3">
        <AvatarPlaceholder />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="truncate text-sm font-bold text-black">{t.name}</div>
          {t.date ? (
            <div className="mt-0.5 text-xs text-neutral-500">{t.date}</div>
          ) : null}
        </div>
      </div>
      <div
        className="sales-rich-html mt-6 flex-1 text-center text-sm font-normal leading-relaxed text-neutral-600"
        dangerouslySetInnerHTML={{ __html: String(t.text ?? "") }}
      />
      <StarRow rating={t.rating} />
    </article>
  );
}

type Props = {
  sold: number;
  remaining: number;
  stockTotal: number;
  testimonials: Testimonial[];
  slug: string;
  productVersion?: string | null;
  currency: string;
  priceOriginal: number;
  pricePromo: number;
  timerDurationMinutes: number;
};

export function SocialProofSection({
  sold,
  remaining,
  stockTotal,
  testimonials,
  slug,
  productVersion,
  currency,
  priceOriginal,
  pricePromo,
  timerDurationMinutes,
}: Props) {
  const profiles = useMemo(
    () => buildThreeProfiles(testimonials),
    [testimonials]
  );

  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [inView, setInView] = useState(false);
  const rafRef = useRef<number | null>(null);

  const scrollToPage = useCallback((idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-slide="${idx}"]`);
    if (!target) return;
    el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
    setActivePage(clamp(idx, 0, SLIDE_COUNT - 1));
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        setInView(e.isIntersecting && e.intersectionRatio >= 0.22);
      },
      { threshold: [0, 0.15, 0.22, 0.35, 0.5], rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const id = window.setInterval(() => {
      setActivePage((p) => {
        const next = (p + 1) % SLIDE_COUNT;
        const el = scrollerRef.current;
        const target = el?.querySelector<HTMLElement>(`[data-slide="${next}"]`);
        if (el && target) {
          el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
        }
        return next;
      });
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [inView]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const compute = () => {
      rafRef.current = null;
      const first = el.querySelector<HTMLElement>("[data-slide]");
      if (!first) return;
      const slideW = first.offsetWidth;
      const gap = 12;
      const idx = Math.round(el.scrollLeft / Math.max(1, slideW + gap));
      setActivePage(clamp(idx, 0, SLIDE_COUNT - 1));
    };

    const onScroll = () => {
      if (!inView) return;
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(compute);
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [inView]);

  const pct =
    stockTotal > 0
      ? Math.min(100, Math.max(0, (sold / stockTotal) * 100))
      : 0;

  return (
    <section
      ref={sectionRef}
      id="social-proof"
      className="mt-8 scroll-mt-28"
      aria-label="Preuve sociale"
    >
      <div className={SALES_SECTION_FRAME}>
        <div className="relative mx-auto rounded-[28px] border-[5px] border-black bg-white px-6 py-4 shadow-[8px_12px_0_#000]">
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
            Témoignages
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div
          ref={scrollerRef}
          role="region"
          aria-label="Témoignages clients, trois profils"
          aria-roledescription="carrousel"
          className="flex gap-3 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
        >
          {profiles.map((t, pageIdx) => (
            <div
              key={pageIdx}
              data-slide={pageIdx}
              className="min-w-full shrink-0 snap-center px-0 md:min-w-[520px]"
            >
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-center">
          <div
            className="flex items-center gap-2.5 rounded-full bg-neutral-100/90 px-4 py-2"
            role="tablist"
            aria-label="Pagination des témoignages"
          >
            {Array.from({ length: SLIDE_COUNT }, (_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === activePage}
                onClick={() => scrollToPage(idx)}
                aria-label={`Témoignage ${idx + 1} sur ${SLIDE_COUNT}`}
                className={[
                  "h-2.5 w-2.5 rounded-full transition-colors",
                  idx === activePage
                    ? "bg-neutral-800"
                    : "bg-neutral-300 hover:bg-neutral-400",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className="mt-8 rounded-3xl bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.07)] ring-1 ring-neutral-200/80"
        aria-labelledby="scarcity-heading"
      >
        <h3 id="scarcity-heading" className="sr-only">
          Disponibilité du produit
        </h3>
        <div className="flex items-baseline justify-between gap-4 text-sm font-normal tracking-tight text-neutral-500">
          <span>
            Vendu :{" "}
            <span className="tabular-nums font-medium text-neutral-700">
              {sold}
            </span>
          </span>
          <span>
            Restant :{" "}
            <span className="tabular-nums font-medium text-neutral-700">
              {remaining}
            </span>
          </span>
        </div>
        <div
          className="mt-5 h-3 w-full overflow-hidden rounded-full bg-neutral-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-label={`Progression des ventes : ${Math.round(pct)} pour cent`}
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-4 text-center text-xs leading-snug text-neutral-600">
          Offre à durée limitée
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center px-2">
        <div className="mt-3">
          <HeroPrice
            slug={slug}
            version={productVersion ?? null}
            currency={currency}
            priceOriginal={priceOriginal}
            pricePromo={pricePromo}
            timerDurationMinutes={timerDurationMinutes}
          />
        </div>
      </div>
    </section>
  );
}
