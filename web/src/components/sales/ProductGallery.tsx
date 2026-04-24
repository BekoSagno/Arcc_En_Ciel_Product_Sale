"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Props = {
  title: string;
  mainImageUrl?: string | null;
  galleryUrls?: string[] | null;
  /** Zone hero : image plus imposante à côté du titre. */
  variant?: "default" | "hero";
};

export function ProductGallery({
  title,
  mainImageUrl,
  galleryUrls,
  variant = "default",
}: Props) {
  const images = useMemo(() => {
    const urls = [
      ...(mainImageUrl ? [mainImageUrl] : []),
      ...((galleryUrls ?? []).filter(Boolean) as string[]),
    ];
    // unique
    return Array.from(new Set(urls));
  }, [mainImageUrl, galleryUrls]);

  const [selected, setSelected] = useState(0);
  const current = images[selected];

  const isHero = variant === "hero";

  return (
    <div
      className={[
        "overflow-hidden rounded-3xl border border-black/10 bg-white",
        isHero
          ? "shadow-[0_16px_40px_-14px_rgba(15,23,42,0.22)]"
          : "shadow-[0_10px_25px_rgba(0,0,0,0.08)]",
      ].join(" ")}
    >
      <div
        className={[
          "relative w-full bg-black/5",
          isHero
            ? "aspect-[3/2] min-h-[220px] sm:min-h-[260px] md:aspect-[4/3] md:min-h-[min(52vh,440px)] lg:min-h-[min(48vh,500px)]"
            : "aspect-[4/3]",
        ].join(" ")}
      >
        {current ? (
          <Image
            src={current}
            alt={`Image de ${title}`}
            fill
            className="object-cover"
            sizes={
              isHero
                ? "(max-width: 768px) 100vw, (max-width: 1280px) 58vw, 720px"
                : "(max-width: 768px) 100vw, (max-width: 1280px) 48vw, 560px"
            }
            quality={75}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-700">
            Image produit
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto px-3 py-3">
          {images.slice(0, 8).map((url, idx) => (
            <button
              key={url}
              type="button"
              onClick={() => setSelected(idx)}
              className={[
                "relative h-16 w-16 flex-none overflow-hidden rounded-xl border",
                idx === selected ? "border-black/60" : "border-black/10",
              ].join(" ")}
              aria-label={`Miniature ${idx + 1}`}
            >
              <Image
                src={url}
                alt={`Miniature ${idx + 1} — ${title}`}
                fill
                className="object-cover"
                sizes="64px"
                quality={70}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

