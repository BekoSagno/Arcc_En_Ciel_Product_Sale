"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrushText } from "@/components/ui/BrushText";
import { formatGNF } from "@/lib/format";

function clampMs(ms: number) {
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.floor(ms));
}

type Props = {
  slug: string;
  version?: string | null;
  currency: string;
  priceOriginal: number;
  pricePromo: number;
  timerDurationMinutes: number;
  /** Affichage plus grand sous le hero produit (page /p/…). */
  emphasis?: boolean;
};

export function HeroPrice({
  slug,
  version,
  currency,
  priceOriginal,
  pricePromo,
  timerDurationMinutes,
  emphasis = false,
}: Props) {
  const durationMs = Math.max(1, timerDurationMinutes) * 60_000;
  const storageKey = `salespage_timer_deadline_${slug}_${version ?? "v0"}`;

  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const existing = localStorage.getItem(storageKey);
      const existingMs = existing ? Number(existing) : NaN;

      // IMPORTANT: une fois expiré, on ne reprogramme pas automatiquement.
      // Si une deadline existe (même passée), on la respecte.
      if (Number.isFinite(existingMs)) {
        setDeadlineMs(existingMs);
        return;
      }

      const newDeadline = Date.now() + durationMs;
      localStorage.setItem(storageKey, String(newDeadline));
      setDeadlineMs(newDeadline);
    }, 0);

    return () => window.clearTimeout(id);
  }, [storageKey, durationMs]);

  useEffect(() => {
    const clear = () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const tick = () => {
      setNowMs(Date.now());
      const msToNext = 1000 - (Date.now() % 1000);
      timeoutRef.current = window.setTimeout(tick, msToNext);
    };

    const start = () => {
      clear();
      tick();
    };
    const stop = () => clear();

    if (document.visibilityState === "visible") start();
    const onVis = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      clear();
    };
  }, []);

  const remainingMs = useMemo(() => {
    if (!deadlineMs) return durationMs;
    return clampMs(deadlineMs - nowMs);
  }, [deadlineMs, nowMs, durationMs]);

  const isTimerActive = remainingMs > 0;
  // Quand le timer est fini : promo désactivée jusqu’à reprogrammation admin.
  const displayed = isTimerActive ? pricePromo : priceOriginal;

  const text = `${formatGNF(displayed)} ${currency}`;
  return (
    <span
      className={[
        "font-extrabold text-[#FFF5E6] [font-family:var(--font-display)] [text-shadow:0_3px_0_rgba(0,0,0,0.20)]",
        emphasis
          ? "text-3xl sm:text-4xl md:text-[2.65rem] md:leading-none lg:text-5xl"
          : "text-2xl",
      ].join(" ")}
    >
      <BrushText text={text} variant="red" className="text-[#FFF5E6]" />
    </span>
  );
}

