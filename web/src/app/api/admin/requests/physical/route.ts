import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionUser } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "in_progress", "done", "cancelled"]),
});

export async function PATCH(request: Request) {
  const user = await getAdminSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
  }
  if (!env.supabaseServiceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY manquant" },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Payload invalide" }, { status: 400 });
  }

  const { id, status } = parsed.data;
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("physical_requests")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

