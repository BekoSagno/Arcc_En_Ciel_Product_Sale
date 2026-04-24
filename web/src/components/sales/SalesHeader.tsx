"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SALES_SITE_CONTAINER } from "@/lib/sales-layout";

type Link = { id: string; label: string };

type Props = {
  title?: string;
  links: Link[];
  variant?: "sticky" | "overlay";
  socialLinks?: Partial<{
    facebook: string;
    linkedin: string;
    tiktok: string;
    whatsapp: string;
  }> | null;
};

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-neutral-800 shadow-[0_6px_16px_rgba(0,0,0,0.10)] ring-1 ring-black/5 transition hover:bg-white"
    >
      {children}
    </a>
  );
}

export function SalesHeader({ title, links, variant = "sticky", socialLinks }: Props) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const orderedLinks = useMemo(
    () => links.filter((l) => l.id && l.id !== "hero"),
    [links]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Highlight dynamique: suit la section visible.
  useEffect(() => {
    if (!open) return;
    const ids = orderedLinks.map((l) => l.id).filter(Boolean);
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!visible?.target?.id) return;
        setActiveId(visible.target.id);
      },
      {
        root: null,
        threshold: [0.12, 0.18, 0.25, 0.4, 0.6],
        // un peu avant le milieu de l'écran pour un ressenti “menu actif”
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    for (const t of targets) obs.observe(t);
    return () => obs.disconnect();
  }, [open, orderedLinks]);

  const goTo = (id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Verrouillage du scroll quand le drawer est ouvert.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const socials = useMemo(() => {
    const s = socialLinks ?? {};
    const entries = Object.entries(s).filter(([, v]) => String(v ?? "").trim());
    return Object.fromEntries(entries) as NonNullable<Props["socialLinks"]>;
  }, [socialLinks]);

  const hasSocials = Object.keys(socials).length > 0;

  return (
    <>
      <header
        className={[
          "z-40",
          variant === "sticky"
            ? "sticky top-0 border-b border-black/10 bg-[#F5F5F0]"
            : "absolute inset-x-0 top-0",
        ].join(" ")}
      >
        <div className={`${SALES_SITE_CONTAINER} flex items-center justify-between gap-3 py-3`}>
          <a
            href="#hero"
            className="flex min-w-0 items-center gap-2 rounded-2xl bg-white/70 pr-2 pl-1.5 py-1.5 ring-1 ring-black/5 shadow-[0_8px_18px_rgba(0,0,0,0.06)] hover:bg-white -ml-1 md:-ml-3"
            aria-label="Retour en haut"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-[0_10px_22px_rgba(0,0,0,0.12)] ring-1 ring-black/5 md:h-12 md:w-12">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6.5 w-6.5 text-[#6b4a2b] md:h-7 md:w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 9h16l-1.2 11H5.2L4 9z" />
                <path d="M8 9l4-5 4 5" />
                <path d="M7 13h10" />
                <path d="M7.5 16h9" />
              </svg>
            </span>
            <span className="min-w-0 truncate text-sm font-extrabold text-neutral-900 md:text-[15px]">
              {title ?? "Arcc En Ciel"}
            </span>
          </a>

          {/* Desktop/tablette: menu horizontal dans le header (comme les plateformes).
             Pour éviter tout débordement, on autorise le scroll horizontal et on compacte en overlay. */}
          <nav
            className={[
              // Sur desktop large: on WRAP (pas de texte coupé).
              // Sur desktop/tablette étroits: on autorise le scroll horizontal.
              "hidden md:flex flex-1 min-w-0 items-center justify-end gap-2",
              "md:overflow-x-auto md:whitespace-nowrap",
              "lg:flex-wrap lg:overflow-visible lg:whitespace-normal",
              "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              variant === "overlay" ? "text-[13px]" : "text-sm",
            ].join(" ")}
            aria-label="Navigation"
          >
            {orderedLinks.map((l) => {
              const isActive = l.id && l.id === activeId;
              return (
              <a
                key={l.id}
                href={`#${l.id}`}
                className={[
                  "rounded-full px-3 py-1.5 font-semibold",
                  "shadow-[0_6px_16px_rgba(0,0,0,0.08)] ring-1 ring-black/5",
                  "transition-[transform,background-color] duration-200",
                  "hover:-translate-y-[1px] hover:bg-white",
                  "active:translate-y-0",
                  "motion-reduce:transform-none motion-reduce:transition-none",
                  isActive ? "bg-[#FFF1CC] text-neutral-900" : "bg-white/80 text-neutral-900",
                ].join(" ")}
              >
                {l.label}
              </a>
              );
            })}
          </nav>

          {hasSocials ? (
            <div className="hidden items-center gap-2 md:flex">
              {socials.facebook ? (
                <IconLink href={socials.facebook} label="Facebook">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M13.5 22v-8h2.7l.4-3H13.5V9.1c0-.9.3-1.6 1.7-1.6h1.6V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2V11H7.8v3h2.4v8h3.3Z"
                    />
                  </svg>
                </IconLink>
              ) : null}
              {socials.linkedin ? (
                <IconLink href={socials.linkedin} label="LinkedIn">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M6.5 6.9A2.4 2.4 0 1 1 6.5 2a2.4 2.4 0 0 1 0 4.9ZM4.7 22V9H8.3v13H4.7Zm5.9-13h3.4v1.8h.1c.5-1 1.8-2.1 3.8-2.1 4 0 4.7 2.6 4.7 6V22h-3.6v-5.7c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V22h-3.6V9Z"
                    />
                  </svg>
                </IconLink>
              ) : null}
              {socials.tiktok ? (
                <IconLink href={socials.tiktok} label="TikTok">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M16.6 3c.6 2.7 2.3 4.3 4.4 4.6V11c-1.6 0-3.1-.5-4.4-1.4v5.7c0 3.5-2.8 6.7-6.8 6.7-3.1 0-5.8-2.1-6.5-5.1-1-4.4 2.4-8.5 6.9-8.5.4 0 .8 0 1.2.1v3.8c-.4-.2-.8-.3-1.2-.3-2.1 0-3.7 1.7-3.4 3.8.2 1.4 1.4 2.6 2.8 2.8 2.1.3 3.8-1.4 3.8-3.4V3h3.2Z"
                    />
                  </svg>
                </IconLink>
              ) : null}
              {socials.whatsapp ? (
                <IconLink href={socials.whatsapp} label="WhatsApp">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M20.1 3.9A10 10 0 0 0 3.4 17.5L2 22l4.7-1.3A10 10 0 0 0 22 12a10 10 0 0 0-1.9-8.1ZM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.8.8-2.7-.2-.3A8 8 0 1 1 12 20Zm4.5-6.2c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.7.8c-.2.2-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.4 7.4 0 0 1-1.3-1.6c-.1-.2 0-.3.1-.4l.4-.5c.1-.1.2-.3.3-.4.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z"
                    />
                  </svg>
                </IconLink>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#6b4a2b] shadow-[0_6px_16px_rgba(0,0,0,0.12)] md:hidden"
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(true)}
          >
            <span className="text-lg leading-none">☰</span>
          </button>
        </div>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className={[
              "absolute inset-0 cursor-default",
              "bg-neutral-900/20 backdrop-blur-[2px]",
              "transition-opacity duration-200 motion-reduce:transition-none",
              open ? "opacity-100" : "opacity-0",
            ].join(" ")}
          />

          {/* Panel */}
          <div
            className={[
              // Cadre élégant (pas plein écran) : on limite aussi la hauteur pour éviter un grand vide.
              "absolute right-3 top-3 bottom-auto w-[min(82vw,320px)]",
              "bg-[#f5f5f0] shadow-[0_30px_80px_rgba(0,0,0,0.35)]",
              "ring-1 ring-black/10",
              "rounded-3xl",
              "max-h-[min(82vh,520px)] overflow-hidden",
              "transition-transform duration-200 motion-reduce:transition-none",
              open ? "translate-x-0" : "translate-x-full",
            ].join(" ")}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#6b4a2b] text-white shadow-[0_10px_22px_rgba(107,74,43,0.25)]">
                    ☰
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-neutral-900">
                      Menu
                    </div>
                    <div className="text-[11px] text-neutral-600">
                      Accès rapide aux sections
                    </div>
                  </div>
                </div>
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/5 text-neutral-900 transition hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
                  aria-label="Fermer le menu"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">
                {orderedLinks.map((l, idx) => {
                  const isActive = l.id && l.id === activeId;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => goTo(l.id)}
                      className={[
                        "group w-full text-left",
                        "flex items-center justify-between",
                        "rounded-2xl border border-black/10 bg-white px-3.5 py-2.5",
                        "text-[14px] font-semibold text-neutral-900",
                        "shadow-[0_10px_20px_rgba(0,0,0,0.06)]",
                        "transition-[transform,box-shadow,background-color] duration-200",
                        "hover:scale-[1.008] hover:bg-[#FFF7E6] hover:shadow-[0_18px_34px_rgba(0,0,0,0.12)]",
                        "active:scale-[0.99]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
                        "motion-reduce:transform-none motion-reduce:transition-none",
                        isActive
                          ? "bg-[#FFF1CC] shadow-[0_18px_34px_rgba(0,0,0,0.14)] ring-2 ring-[#FF4500]/30"
                          : "",
                        // Animation d’entrée : un par un (stagger)
                        "translate-y-0 opacity-100",
                      ].join(" ")}
                      style={{
                        transitionDelay: open ? `${Math.min(8, idx) * 45}ms` : "0ms",
                        transform: open ? "translateY(0)" : "translateY(6px)",
                        opacity: open ? 1 : 0,
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={[
                            "inline-flex h-2.5 w-2.5 rounded-full",
                            isActive ? "bg-[#FF4500]" : "bg-neutral-300",
                          ].join(" ")}
                        />
                        <span>{l.label}</span>
                      </span>
                    </button>
                  );
                })}
              </nav>

            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

