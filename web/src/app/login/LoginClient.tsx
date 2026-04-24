"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => searchParams.get("next") || "/admin",
    [searchParams]
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center bg-gradient-to-b from-[#fafaf6] to-[#f0f0ea] px-4 py-14">
      <div className="animate-ui-enter w-full max-w-[420px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.2)]">
        <div className="border-b border-neutral-100 bg-[#fff9e6] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6b4a2b]">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">
            Connexion
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-800">
            Accès réservé au back-office.
          </p>
        </div>

        <div className="px-6 py-6">
          {searchParams.get("reason") === "not-admin" ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              Ce compte n’a pas accès au back-office.
            </div>
          ) : null}

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              setLoading(true);
              try {
                const supabase = createSupabaseBrowserClient();
                const { error: signErr } = await supabase.auth.signInWithPassword({
                  email,
                  password,
                });
                if (signErr) throw signErr;
                router.replace(nextPath);
                router.refresh();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Erreur inconnue");
              } finally {
                setLoading(false);
              }
            }}
          >
            <label className="block">
              <span className="text-sm font-semibold text-neutral-900">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-500 focus:border-[#0b6b63] focus:ring-2 focus:ring-[#0b6b63]/25"
                placeholder="admin@email.com"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-900">
                Mot de passe
              </span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                className="mt-1.5 w-full rounded-xl border-2 border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-sm outline-none placeholder:text-neutral-500 focus:border-[#0b6b63] focus:ring-2 focus:ring-[#0b6b63]/25"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-900">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#0b6b63] to-[#0d847a] py-3 text-center text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-4 text-xs leading-relaxed text-neutral-800">
            <span className="font-semibold text-neutral-900">Astuce :</span> créer
            l’utilisateur dans{" "}
            <span className="font-semibold">Supabase → Authentication → Users</span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
