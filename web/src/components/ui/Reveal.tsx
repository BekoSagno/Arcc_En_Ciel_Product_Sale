"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Décalage vertical au départ (px). */
  y?: number;
  /** Durée de l’animation (ms). */
  durationMs?: number;
  /** Délai (ms) pour un effet stagger. */
  delayMs?: number;
  /** Seuil d’apparition. */
  threshold?: number;
  className?: string;
};

export function Reveal({
  children,
  y = 10,
  durationMs = 420,
  delayMs = 0,
  threshold = 0.14,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        if (e.isIntersecting && (e.intersectionRatio ?? 0) >= threshold) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: [0, threshold] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [shown, threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0px)" : `translateY(${y}px)`,
        transitionProperty: "opacity, transform",
        transitionDuration: `${durationMs}ms`,
        transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

