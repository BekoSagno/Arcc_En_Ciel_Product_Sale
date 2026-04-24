"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="rounded-xl bg-black px-4 py-2.5 text-sm font-extrabold text-white shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(0,0,0,0.22)] active:scale-[0.99]"
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.href = "/login";
      }}
    >
      Déconnexion
    </button>
  );
}

