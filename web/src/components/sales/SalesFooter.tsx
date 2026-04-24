import Link from "next/link";
import { SALES_SITE_CONTAINER } from "@/lib/sales-layout";
import { FooterContact, FooterSocialIcons } from "./FooterContact";

export const SALES_PRESENTATION_LINK = { id: "about", label: "Présentation" } as const;

export const SALES_PAGE_FOOTER_LINKS: { id: string; label: string }[] = [
  { id: "features", label: "Caractéristiques" },
  { id: "use-cases", label: "Cas d’usage" },
  { id: "how", label: "Comment ça marche ?" },
  { id: "social-proof", label: "Témoignages" },
  { id: "faq", label: "FAQ" },
];

type Props = {
  siteName?: string;
  tagline?: string;
  blurb?: string;
  contactEmail: string;
  contactPhone?: string | null;
  contactAddressLines?: string[] | null;
  socialLinks?: Partial<{
    facebook: string;
    instagram: string;
    linkedin: string;
    tiktok: string;
    youtube: string;
    x: string;
    whatsapp: string;
  }> | null;
  /** Affiche le lien d’ancre « Présentation » seulement si la section existe sur la page. */
  includePresentation?: boolean;
};

export function SalesFooter({
  siteName = "Arc en Ciel",
  tagline = "Produits digitaux",
  blurb,
  contactEmail,
  contactPhone,
  contactAddressLines,
  socialLinks,
  includePresentation = false,
}: Props) {
  const year = new Date().getFullYear();
  const quickLinks = [
    ...(includePresentation ? [SALES_PRESENTATION_LINK] : []),
    ...SALES_PAGE_FOOTER_LINKS,
  ];

  return (
    <footer
      id="footer"
      className="mt-12 scroll-mt-28 border-t border-neutral-200/90 bg-[#F0F0EB] pt-10 pb-10"
      aria-labelledby="footer-brand"
    >
      <div className={SALES_SITE_CONTAINER}>
        <div className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] ring-1 ring-neutral-200/80">
          <div className="grid gap-6 md:grid-cols-[1.1fr_1.2fr_1fr] md:items-start">
            <div className="text-center md:text-left">
              <p
                id="footer-brand"
                className="text-lg font-extrabold tracking-tight text-neutral-900"
              >
                {siteName}
              </p>
              <p className="mt-1 text-sm text-neutral-600">{tagline}</p>
              {blurb ? (
                <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                  {blurb}
                </p>
              ) : null}

              {/* Icônes réseaux sociaux sous la description (colonne entreprise) */}
              <div className="mt-4 flex justify-center md:justify-start">
                <FooterSocialIcons phone={contactPhone} socials={socialLinks} />
              </div>
            </div>

            <nav
              aria-label="Liens rapides"
              className="md:border-l md:border-neutral-100 md:pl-6"
            >
              <p className="text-center text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500 md:text-left">
                Liens rapides
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-2">
                {quickLinks.map((l) => (
                  <li key={l.id}>
                    <a
                      href={`#${l.id}`}
                      className="inline-flex w-full items-center justify-center rounded-full bg-neutral-100 px-3 py-2 text-[13px] font-semibold text-neutral-800 transition hover:bg-neutral-200"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="md:border-l md:border-neutral-100 md:pl-6">
              <p className="text-center text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500 md:text-left">
                Contact
              </p>
              <div className="mx-auto max-w-sm md:mx-0 md:max-w-none">
                <FooterContact
                  email={contactEmail}
                  phone={contactPhone}
                  addressLines={contactAddressLines}
                  siteName={siteName}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-100 pt-5 text-center md:flex md:items-center md:justify-between md:text-left">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
                Légal
              </p>
              <Link
                href="/cgv"
                className="mt-2 inline-flex text-sm font-semibold text-[#6b4a2b] underline decoration-[#6b4a2b]/30 underline-offset-2 hover:decoration-[#6b4a2b]"
              >
                Conditions générales de vente (CGV)
              </Link>
            </div>
            <p className="mt-3 text-[11px] text-neutral-500 md:mt-0">
              © {year} {siteName}. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
