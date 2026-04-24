"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type UseCase = {
  title?: string | null;
  text?: string | null;
};

type Props = {
  items: UseCase[];
};

const accentByIndex = [
  { bg: "#FF6B86", shadow: "rgba(255, 107, 134, 0.55)" }, // rose
  { bg: "#92FE9D", shadow: "rgba(146, 254, 157, 0.55)" }, // vert
  { bg: "#8FB7FF", shadow: "rgba(143, 183, 255, 0.55)" }, // bleu
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function UseCasesSlider({ items }: Props) {
  const list = useMemo(() => (items ?? []).slice(0, 6), [items]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const rafRef = useRef<number | null>(null);
  const inViewRef = useRef(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const compute = () => {
      rafRef.current = null;
      if (!inViewRef.current) return;
      const first = el.querySelector<HTMLElement>("[data-slide]");
      if (!first) return;
      const slideW = first.offsetWidth;
      const gap = 16; // matches gap-4
      const idx = Math.round(el.scrollLeft / Math.max(1, slideW + gap));
      setActive(clamp(idx, 0, Math.max(0, list.length - 1)));
    };

    const onScroll = () => {
      if (!inViewRef.current) return;
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(compute);
    };

    const obs = new IntersectionObserver(
      ([e]) => {
        inViewRef.current = Boolean(e?.isIntersecting);
        onScroll();
      },
      { threshold: [0, 0.15], rootMargin: "0px 0px -10% 0px" }
    );
    obs.observe(el);

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      obs.disconnect();
      el.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [list.length]);

  const scrollTo = (idx: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-slide="${idx}"]`);
    if (!target) return;
    el.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  };

  if (list.length === 0) return null;

  return (
    <div className="mt-4">
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
      >
        {list.map((u, idx) => {
          const accent = accentByIndex[idx % accentByIndex.length];
          return (
            <div
              key={idx}
              data-slide={idx}
              className="snap-center min-w-[86%] sm:min-w-[420px] flex-1"
            >
              <div className="relative mx-auto w-full">
                <div className="mx-auto flex w-full max-w-md flex-col items-center text-center md:max-w-none">
                  <div
                    className="relative inline-flex px-2 pb-1 text-2xl font-extrabold tracking-tight text-black"
                    style={{
                      fontFamily: "var(--font-hand), cursive",
                      textShadow: "0 3px 0 rgba(0,0,0,0.12)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-0 right-0 bottom-0 -z-10 h-[0.75em] rounded-[12px] [transform:rotate(-1deg)]"
                      style={{
                        backgroundColor: accent.bg,
                        boxShadow: `0 10px 18px ${accent.shadow}`,
                        clipPath:
                          "polygon(2% 60%, 10% 18%, 28% 4%, 52% 10%, 76% 20%, 97% 62%, 98% 94%, 90% 98%, 70% 94%, 46% 92%, 20% 92%, 4% 94%)",
                      }}
                    />
                    {u.title || `Titre Cas d’usage ${idx + 1}`}
                  </div>

                  {/* Papier froissé + lignes */}
                  <div
                    className="relative mt-4 w-full overflow-hidden rounded-[22px] bg-[#FAFAF7] px-6 py-16 shadow-[0_18px_30px_rgba(0,0,0,0.10)]"
                    style={{
                      clipPath:
                        "polygon(3% 6%, 12% 2%, 28% 1%, 46% 2%, 64% 1%, 82% 3%, 97% 8%, 99% 24%, 98% 48%, 99% 72%, 96% 92%, 84% 98%, 66% 99%, 48% 98%, 30% 99%, 12% 97%, 2% 90%, 1% 70%, 2% 44%, 1% 22%)",
                      backgroundImage:
                        "repeating-linear-gradient(180deg, rgba(90,140,200,0.18) 0px, rgba(90,140,200,0.18) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 22px), radial-gradient(240px 140px at 40% 35%, rgba(0,0,0,0.07), transparent 62%), radial-gradient(240px 160px at 70% 70%, rgba(0,0,0,0.06), transparent 64%), linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-[0.28]"
                      style={{
                        backgroundImage:
                          "linear-gradient(135deg, rgba(0,0,0,0.06), transparent 42%), linear-gradient(315deg, rgba(0,0,0,0.05), transparent 46%), repeating-radial-gradient(circle at 30% 35%, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 7px)",
                        mixBlendMode: "multiply",
                      }}
                    />

                    <div
                      className="sales-rich-html relative text-lg font-semibold text-black"
                      dangerouslySetInnerHTML={{
                        __html: String(u.text ?? "Votre texte ici !"),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        {list.slice(0, 3).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => scrollTo(idx)}
            aria-label={`Aller au cas d’usage ${idx + 1}`}
            className={[
              "h-4 w-4 rounded-full border-2 border-black transition-all",
              idx === active ? "bg-black" : "bg-[#CFCFCF]",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

