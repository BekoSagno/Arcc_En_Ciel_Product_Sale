import { SignOutButton } from "@/components/admin/SignOutButton";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#F5F5F0]">
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
          <aside className="animate-ui-enter flex flex-col rounded-3xl border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                  Back-office
                </div>
                <div className="mt-1 truncate text-lg font-extrabold tracking-tight text-black">
                  Arc en Ciel
                </div>
              </div>
            </div>

            <AdminNav />

            <div className="mt-auto pt-4">
              <SignOutButton />
            </div>
          </aside>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

