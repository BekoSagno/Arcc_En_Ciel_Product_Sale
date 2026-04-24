import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { sendEmailViaResend } from "@/lib/email/resend";
import { sendEmailViaSmtp } from "@/lib/email/smtp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BodySchema = z.object({
  slug: z.string().trim().min(1),
  email: z.string().trim().email(),
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  address: z.string().trim().min(1),
  note: z.string().trim().max(2000).optional().default(""),
});

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Informations invalides." },
      { status: 400 }
    );
  }

  const { slug, email, name, phone, address, note } = parsed.data;

  if (!env.supabaseServiceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, slug, title, product_type, is_published")
    .eq("slug", slug)
    .maybeSingle();

  if (pErr) return NextResponse.json({ ok: false, error: pErr.message }, { status: 500 });
  if (!product || product.is_published !== true) {
    return NextResponse.json(
      { ok: false, error: "Produit introuvable (ou non publié)." },
      { status: 404 }
    );
  }
  if ((product.product_type ?? "electronic") !== "physical") {
    return NextResponse.json(
      { ok: false, error: "Ce produit n’accepte pas les demandes de livraison." },
      { status: 400 }
    );
  }

  const { data: inserted, error: insErr } = await supabase
    .from("physical_requests")
    .insert({
      product_id: product.id,
      slug: product.slug,
      customer_email: email,
      customer_name: name,
      customer_phone: phone,
      customer_address: address,
      customer_note: note || null,
      status: "new",
    })
    .select("id")
    .maybeSingle();

  if (insErr) {
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
  }

  const reqId = inserted?.id;
  if (!reqId) {
    return NextResponse.json({ ok: false, error: "Insertion impossible." }, { status: 500 });
  }

  // Notif admin (si possible)
  const adminTo = env.adminEmail || env.contactEmail;
  if (adminTo) {
    const ref = reqId.slice(0, 8).toUpperCase();
    const title = product.title?.trim() || slug;
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
        <h2 style="margin:0 0 10px;">Nouvelle demande — produit physique</h2>
        <div style="margin:0 0 10px;color:#111;">
          <b>Référence</b> : <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${escapeHtml(
            ref
          )}</span>
        </div>
        <div style="margin:0 0 6px;"><b>Produit</b> : ${escapeHtml(title)}</div>
        <div style="margin:0 0 6px;"><b>Slug</b> : ${escapeHtml(slug)}</div>
        <hr style="margin:14px 0;border:none;border-top:1px solid #e5e7eb;" />
        <div style="margin:0 0 6px;"><b>Client</b> : ${escapeHtml(name)}</div>
        <div style="margin:0 0 6px;"><b>Email</b> : ${escapeHtml(email)}</div>
        <div style="margin:0 0 6px;"><b>Téléphone</b> : ${escapeHtml(phone)}</div>
        <div style="margin:0 0 6px;"><b>Adresse</b> : ${escapeHtml(address)}</div>
        ${
          note
            ? `<div style="margin:10px 0 0;"><b>Note</b> :<br/>${escapeHtml(note).replaceAll(
                "\n",
                "<br/>"
              )}</div>`
            : ""
        }
      </div>
    `.trim();

    const subject = `Demande livraison (${ref}) — ${title}`;
    const useSmtp = (env.mailMailer ?? "").toLowerCase() === "smtp";
    try {
      if (useSmtp) {
        await sendEmailViaSmtp({
          to: adminTo,
          subject,
          html,
          replyTo: email,
        });
      } else if (env.resendApiKey) {
        await sendEmailViaResend({
          to: adminTo,
          subject,
          html,
          replyTo: email,
        });
      }
    } catch {
      // non bloquant
    }
  }

  return NextResponse.json({ ok: true, id: reqId });
}

