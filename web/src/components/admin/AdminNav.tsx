"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Tableau de bord", match: (p: string) => p === "/admin" },
  {
    href: "/admin/products",
    label: "Produits",
    match: (p: string) => p.startsWith("/admin/products"),
  },
  {
    href: "/admin/sales",
    label: "Ventes",
    match: (p: string) => p.startsWith("/admin/sales"),
  },
  {
    href: "/admin/requests",
    label: "Demandes",
    match: (p: string) => p.startsWith("/admin/requests"),
  },
  {
    href: "/admin/integrations",
    label: "Intégrations",
    match: (p: string) => p.startsWith("/admin/integrations"),
  },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-4 grid gap-2">
      {items.map(({ href, label, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={[
              "rounded-2xl border px-3 py-3 text-sm font-extrabold transition-all duration-300 ease-out",
              "hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]",
              active
                ? "border-[#0b6b63]/25 bg-[#e9fbf8] text-black shadow-sm"
                : "border-black/10 bg-white text-black shadow-sm hover:bg-neutral-50",
            ].join(" ")}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
