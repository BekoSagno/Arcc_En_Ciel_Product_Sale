import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

/** Session valide + (si ADMIN_EMAIL est défini) e-mail autorisé, comme sur `/admin`. */
export async function getAdminSessionUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  if (
    env.adminEmail &&
    user.email?.toLowerCase() !== env.adminEmail.toLowerCase()
  ) {
    return null;
  }
  return user;
}
