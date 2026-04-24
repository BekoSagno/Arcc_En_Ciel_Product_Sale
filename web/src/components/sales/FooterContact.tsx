"use client";

type Props = {
  email: string;
  phone?: string | null;
  addressLines?: string[] | null;
  socials?: Partial<{
    facebook: string;
    instagram: string;
    linkedin: string;
    tiktok: string;
    youtube: string;
    x: string;
    whatsapp: string;
  }> | null;
  siteName: string;
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
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 transition hover:bg-neutral-200"
    >
      {children}
    </a>
  );
}

export function FooterSocialIcons({
  phone,
  socials,
}: {
  phone?: string | null;
  socials?: Props["socials"];
}) {
  const waHref =
    socials?.whatsapp && socials.whatsapp.trim()
      ? socials.whatsapp.trim()
      : phone
        ? `https://wa.me/${phone.replace(/[^\d]/g, "")}`
        : null;

  const has =
    !!socials?.facebook ||
    !!socials?.instagram ||
    !!socials?.linkedin ||
    !!socials?.tiktok ||
    !!socials?.youtube ||
    !!socials?.x ||
    !!waHref;

  if (!has) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
      {socials?.facebook ? (
        <IconLink href={socials.facebook} label="Facebook">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M13.5 22v-8h2.7l.4-3H13.5V9.1c0-.9.3-1.6 1.7-1.6h1.6V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.2V11H7.8v3h2.4v8h3.3Z"
            />
          </svg>
        </IconLink>
      ) : null}
      {socials?.instagram ? (
        <IconLink href={socials.instagram} label="Instagram">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.8-2.3a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z"
            />
          </svg>
        </IconLink>
      ) : null}
      {socials?.linkedin ? (
        <IconLink href={socials.linkedin} label="LinkedIn">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6.5 6.9A2.4 2.4 0 1 1 6.5 2a2.4 2.4 0 0 1 0 4.9ZM4.7 22V9H8.3v13H4.7Zm5.9-13h3.4v1.8h.1c.5-1 1.8-2.1 3.8-2.1 4 0 4.7 2.6 4.7 6V22h-3.6v-5.7c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V22h-3.6V9Z"
            />
          </svg>
        </IconLink>
      ) : null}
      {socials?.tiktok ? (
        <IconLink href={socials.tiktok} label="TikTok">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M16.6 3c.6 2.7 2.3 4.3 4.4 4.6V11c-1.6 0-3.1-.5-4.4-1.4v5.7c0 3.5-2.8 6.7-6.8 6.7-3.1 0-5.8-2.1-6.5-5.1-1-4.4 2.4-8.5 6.9-8.5.4 0 .8 0 1.2.1v3.8c-.4-.2-.8-.3-1.2-.3-2.1 0-3.7 1.7-3.4 3.8.2 1.4 1.4 2.6 2.8 2.8 2.1.3 3.8-1.4 3.8-3.4V3h3.2Z"
            />
          </svg>
        </IconLink>
      ) : null}
      {socials?.youtube ? (
        <IconLink href={socials.youtube} label="YouTube">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.7 12 4.7 12 4.7s-5.7 0-7.5.4A3 3 0 0 0 2.4 7.2 31.7 31.7 0 0 0 2 12a31.7 31.7 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.4 7.5.4 7.5.4s5.7 0 7.5-.4a3 3 0 0 0 2.1-2.1A31.7 31.7 0 0 0 22 12a31.7 31.7 0 0 0-.4-4.8ZM10.2 15.4V8.6L15.9 12l-5.7 3.4Z"
            />
          </svg>
        </IconLink>
      ) : null}
      {socials?.x ? (
        <IconLink href={socials.x} label="X">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.4L6.2 22H3l7.3-8.4L1 2h6.4l4.4 5.8L18.9 2Zm-1.1 18h1.7L5.8 3.9H4l13.8 16.1Z"
            />
          </svg>
        </IconLink>
      ) : null}
      {waHref ? (
        <IconLink href={waHref} label="WhatsApp">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M20.1 3.9A10 10 0 0 0 3.4 17.5L2 22l4.7-1.3A10 10 0 0 0 22 12a10 10 0 0 0-1.9-8.1ZM12 20a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.8.8-2.7-.2-.3A8 8 0 1 1 12 20Zm4.5-6.2c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.7.8c-.2.2-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.4 7.4 0 0 1-1.3-1.6c-.1-.2 0-.3.1-.4l.4-.5c.1-.1.2-.3.3-.4.1-.2.1-.3 0-.5l-.8-1.9c-.2-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.4s1 2.8 1.1 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.4-.6 1.6-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.4-.3Z"
            />
          </svg>
        </IconLink>
      ) : null}
    </div>
  );
}

export function FooterContact({ email, phone, addressLines, siteName }: Omit<Props, "socials">) {
  const mailtoHref = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    `Contact — ${siteName}`
  )}`;

  const telHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : null;

  return (
    <div className="mt-5 space-y-4">
      <a
        href={mailtoHref}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[#6b4a2b] px-4 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(107,74,43,0.25)] transition hover:brightness-105 focus-visible:outline focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
      >
        Nous écrire par e-mail
      </a>

      <div className="space-y-1.5 text-sm text-neutral-800">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 md:justify-start">
          <span className="font-extrabold text-neutral-900">Email</span>
          <span className="text-neutral-400">·</span>
          <a
            href={mailtoHref}
            className="font-semibold underline decoration-neutral-300 underline-offset-2 hover:text-neutral-950"
          >
            {email}
          </a>
        </div>
        {telHref ? (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 md:justify-start">
            <span className="font-extrabold text-neutral-900">Tel</span>
            <span className="text-neutral-400">·</span>
            <a
              href={telHref}
              className="font-semibold underline decoration-neutral-300 underline-offset-2 hover:text-neutral-950"
            >
              {phone}
            </a>
          </div>
        ) : null}
        {addressLines?.length ? (
          <div className="text-center text-neutral-700 md:text-left">
            {addressLines.map((l, i) => (
              <div key={l + i}>{l}</div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
