"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { formatGNF } from "@/lib/format";

function clampMs(ms: number) {
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.floor(ms));
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function msToParts(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return { days, hours, minutes };
}

type Props = {
  slug: string;
  version?: string | null;
  productType?: "electronic" | "physical" | null;
  currency: string;
  priceOriginal: number;
  pricePromo: number;
  timerDurationMinutes: number;
  disabled?: boolean;
  /**
   * bottom : barre fixe en bas (mobile)
   * floating : carte flottante en bas à droite (md+)
   * sidebar : carte “inline” (dans le flux)
   */
  placement?: "bottom" | "floating" | "sidebar" | "responsive";
};

export function StickyCta({
  slug,
  version,
  productType,
  currency,
  priceOriginal,
  pricePromo,
  timerDurationMinutes,
  disabled,
  placement = "bottom",
}: Props) {
  const storageKey = `salespage_timer_deadline_${slug}_${version ?? "v0"}`;
  const durationMs = Math.max(1, timerDurationMinutes) * 60_000;

  // Important: on garde le 1er rendu identique SSR/Client pour éviter les erreurs d’hydratation.
  // On initialise la deadline après le montage (useEffect).
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
      // Aligne sur la prochaine seconde (évite drift + moins de travail).
      const msToNext = 1000 - (Date.now() % 1000);
      timeoutRef.current = window.setTimeout(tick, msToNext);
    };

    const start = () => {
      clear();
      tick();
    };

    const stop = () => clear();

    // Démarre seulement si la page est visible (réduit CPU en arrière-plan).
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
    // Tant que la deadline n’est pas chargée côté client, on affiche la durée "par défaut"
    // (SSR et 1er rendu client identiques).
    if (!deadlineMs) return durationMs;
    return clampMs(deadlineMs - nowMs);
  }, [deadlineMs, nowMs, durationMs]);

  const { days, hours, minutes } = msToParts(remainingMs);
  const isTimerActive = remainingMs > 0;

  const content = (
    <div className="overflow-hidden rounded-xl border border-black/10 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <div
        className={clsx(
          "px-3 pt-2.5 pb-2 text-white transition-colors duration-300",
          isTimerActive
            ? "bg-gradient-to-b from-[#c41e1c] to-[#8b1210]"
            : "bg-[#0b6b63]"
        )}
      >
        <div className="flex items-end justify-between gap-2">
          <div className="text-[10px] leading-tight opacity-95">
            {isTimerActive ? (
              <div className="line-through decoration-white/70">
                {formatGNF(priceOriginal)} {currency}
              </div>
            ) : (
              <div className="font-extrabold">
                {formatGNF(priceOriginal)} {currency}
              </div>
            )}
          </div>
          {isTimerActive ? (
            <div className="text-sm font-extrabold leading-none text-[#ffe066] drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
              {formatGNF(pricePromo)} {currency}
            </div>
          ) : null}
        </div>

        {isTimerActive ? (
          <div className="mt-1.5 flex items-center justify-center">
            <div
              className="text-[17px] font-black tabular-nums tracking-widest text-white [text-shadow:0_1px_0_rgba(0,0,0,0.35)]"
              aria-label={`Temps restant : ${days} jours, ${hours} heures, ${minutes} minutes`}
            >
              {pad2(days)}:{pad2(hours)}:{pad2(minutes)}
            </div>
          </div>
        ) : (
          <div className="mt-1.5 text-center text-[10px] font-semibold text-white/90">
            Offre expirée — prix normal
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          const t = productType === "physical" ? "physical" : "electronic";
          window.location.href =
            t === "physical"
              ? `/checkout/request?slug=${encodeURIComponent(slug)}`
              : `/checkout/pay?slug=${encodeURIComponent(slug)}`;
        }}
        className={clsx(
          "relative w-full overflow-hidden border-t border-white/35 py-2.5 text-center text-[16px] font-extrabold tracking-[0.12em] text-white uppercase",
          "bg-gradient-to-b from-[#4ade80] via-[#22c55e] to-[#15803d]",
          "shadow-[inset_0_2px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.12),0_4px_18px_rgba(34,197,94,0.55)]",
          "transition-[transform,filter,box-shadow] duration-200",
          "hover:brightness-[1.08] hover:shadow-[inset_0_2px_0_rgba(255,255,255,0.55),inset_0_-1px_0_rgba(0,0,0,0.1),0_6px_24px_rgba(34,197,94,0.65)]",
          "active:scale-[0.99] active:brightness-105",
          "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-gradient-to-b before:from-white/35 before:via-white/5 before:to-transparent before:content-['']",
          "after:pointer-events-none after:absolute after:-left-[20%] after:top-0 after:z-0 after:h-full after:w-[45%] after:rotate-12 after:bg-gradient-to-r after:from-transparent after:via-white/25 after:to-transparent after:content-['']",
          "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:brightness-100 disabled:active:scale-100"
        )}
      >
        <span className="relative z-10">
          {productType === "physical" ? "DEMANDER" : "ACHETER"}
        </span>
      </button>
      {disabled ? (
        <div className="bg-white px-3 py-2 text-center text-[12px] font-bold text-neutral-900">
          Stock épuisé
        </div>
      ) : null}
    </div>
  );

  return (
    placement === "sidebar" ? (
      <div className="w-full">{content}</div>
    ) : placement === "responsive" ? (
      <>
        <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
          <div className="mx-auto w-full max-w-md px-3 pb-3">{content}</div>
        </div>
        <div className="fixed bottom-6 right-6 z-50 hidden md:block">
          <div className="w-[min(300px,calc(100vw-3rem))]">{content}</div>
        </div>
      </>
    ) : placement === "floating" ? (
      <div className="fixed bottom-6 right-6 z-50 hidden md:block">
        <div className="w-[min(300px,calc(100vw-3rem))]">{content}</div>
      </div>
    ) : (
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-md px-3 pb-3">{content}</div>
      </div>
    )
  );
}

