import "server-only";

import { env } from "@/lib/env";
import { sendEmailViaResend } from "@/lib/email/resend";
import { sendEmailViaSmtp } from "@/lib/email/smtp";
import { createSaleDownloadToken } from "@/lib/delivery-token";

export type DeliveryEmailInput = {
  to: string;
  customerName?: string | null;
  productTitle?: string | null;
  saleId: string;
  slug?: string | null;
};

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendDeliveryEmail(input: DeliveryEmailInput) {
  const siteName = env.siteName;
  const baseUrl = env.siteUrl.replace(/\/$/, "");
  const title = input.productTitle?.trim() || "votre produit";
  const customerFirstName = (() => {
    const raw = input.customerName?.trim() || "";
    if (!raw) return null;
    const first = raw.split(/\s+/).filter(Boolean)[0] || "";
    return first ? escapeHtml(first) : null;
  })();
  const hello = customerFirstName ? `Bonjour ${customerFirstName},` : "Bonjour,";

  const followUrl = `${baseUrl}/success?slug=${encodeURIComponent(
    input.slug ?? ""
  )}&sale_id=${encodeURIComponent(input.saleId)}`;

  let downloadUrl: string | null = null;
  try {
    const token = createSaleDownloadToken(input.saleId, env.deliveryLinkTtlSeconds);
    downloadUrl = `${baseUrl}/api/download/deliver?t=${encodeURIComponent(token)}`;
  } catch {
    /* secret / config manquant : uniquement la page de confirmation */
  }

  const subject = `Votre achat est confirmé — ${title}`;
  const linkDays = Math.max(1, Math.round(env.deliveryLinkTtlSeconds / 86400));
  const linkDaysFr = `${linkDays} jour${linkDays > 1 ? "s" : ""}`;
  const orderRef = input.saleId.slice(0, 8).toUpperCase();
  // Palette lumineuse (turquoise + orange) inspirée du design checkout.
  const brand = "#00b7a8";
  const brandDeep = "#007f77";
  const brandSoft = "#e9fbf8";
  const accent = "#ff7a18";
  const accentSoft = "#fff3e9";
  const surface = "#ffffff";
  const bg = "#f7fffd";
  const ink = "#0b1220";
  const muted = "#546173";
  const border = "#dfe7ee";

  const downloadBlock =
    downloadUrl != null
      ? `
        <div style="margin: 18px 0 0;">
          <a href="${downloadUrl}" style="display:inline-block;padding:14px 18px;border-radius:16px;background:linear-gradient(90deg, ${brand} 0%, ${accent} 100%);color:#ffffff;font-weight:900;text-decoration:none;letter-spacing:.2px;box-shadow:0 12px 26px rgba(0,183,168,.22);">
            Télécharger mon fichier
          </a>
          <div style="margin: 10px 0 0; font-size: 12px; color:${muted};">
            Lien sécurisé valable environ <strong>${linkDaysFr}</strong>. Si le bouton ne fonctionne pas, utilisez la page de confirmation.
          </div>
        </div>`
      : `
        <div style="margin: 18px 0 0; padding: 12px 14px; border-radius: 14px; border:1px solid ${border}; background:#fff7ed; color:#7c2d12; font-size: 13px;">
          Le lien de téléchargement automatique n’est pas disponible pour le moment.
          Utilisez la page de confirmation ci-dessous ou contactez-nous.
        </div>`;

  const html = `
    <div style="margin:0;padding:0;background:${bg};">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Votre commande est confirmée. Accès immédiat au produit + lien de téléchargement.
      </div>

      <div style="max-width: 640px; margin: 0 auto; padding: 28px 14px;">
        <!-- Bandeau lumineux -->
        <div style="border-radius: 22px; overflow:hidden; border:1px solid ${border}; background:linear-gradient(135deg, ${brandSoft} 0%, ${accentSoft} 55%, #ffffff 100%);">
          <div style="padding: 18px 18px 0;">
            <div style="font-weight: 900; letter-spacing: .9px; color:${brandDeep}; font-size: 12px; text-transform: uppercase;">
              ${escapeHtml(siteName)}
            </div>
            <div style="margin-top: 10px; font-size: 24px; font-weight: 950; color:${ink};">
              Votre achat est confirmé
            </div>
            <div style="margin-top: 8px; font-size: 14px; color:${muted};">
              Merci pour votre confiance. Votre accès est prêt — téléchargez votre produit en un clic.
            </div>
          </div>
          <div style="padding: 14px 18px 18px;">
            <div style="display:inline-flex;gap:10px;align-items:center;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.85);border:1px solid ${border};">
              <div style="width:10px;height:10px;border-radius:999px;background:${brand};box-shadow:0 0 0 4px rgba(0,183,168,.15);"></div>
              <div style="font-size:12px;color:${muted};">
                Référence : <span style="font-weight:900;color:${ink};font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${escapeHtml(
                  orderRef
                )}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 14px; background:${surface}; border:1px solid ${border}; border-radius: 22px; overflow:hidden; box-shadow:0 18px 40px rgba(10, 40, 60, .08);">
          <div style="padding: 18px;">
            <div style="font-size: 14px; color:${ink}; margin:0 0 12px;">
              ${hello}
            </div>

            <!-- Carte produit -->
            <div style="padding: 14px; border-radius: 18px; border:1px solid ${border}; background:linear-gradient(180deg, #ffffff 0%, #fbfffe 100%);">
              <div style="font-size: 12px; color:${muted}; text-transform: uppercase; letter-spacing: .8px; font-weight: 950;">
                Produit
              </div>
              <div style="margin-top: 6px; font-size: 18px; font-weight: 950; color:${ink};">
                ${escapeHtml(title)}
              </div>
              <div style="margin-top: 8px; display:flex; gap:8px; flex-wrap:wrap;">
                <span style="display:inline-block;padding:7px 10px;border-radius:999px;background:${brandSoft};border:1px solid rgba(0,183,168,.18);color:${brandDeep};font-size:12px;font-weight:900;">
                  Accès immédiat
                </span>
                <span style="display:inline-block;padding:7px 10px;border-radius:999px;background:${accentSoft};border:1px solid rgba(255,122,24,.22);color:#7a2f00;font-size:12px;font-weight:900;">
                  Téléchargement sécurisé
                </span>
              </div>
            </div>

            ${downloadBlock}

            <!-- Lien secondaire -->
            <div style="margin-top: 16px; padding: 12px 14px; border-radius: 18px; border:1px dashed rgba(84,97,115,.35); background:#ffffff;">
              <div style="font-size: 12px; color:${muted};">
                Alternative :
                <a href="${followUrl}" style="color:${brandDeep}; font-weight:950; text-decoration:none;">
                  ouvrir la page de confirmation
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 14px; padding: 0 6px; color:${muted}; font-size: 12px; line-height: 1.6;">
          <div>
            Une question ? Répondez à cet e-mail ou écrivez-nous :
            <a href="mailto:${escapeHtml(env.contactEmail)}" style="color:${brandDeep}; font-weight:950; text-decoration:none;">
              ${escapeHtml(env.contactEmail)}
            </a>
          </div>
          <div style="margin-top: 8px;">
            Si vous n’êtes pas à l’origine de cet achat, contactez-nous immédiatement.
          </div>
          <div style="margin-top: 10px; color:#9ca3af;">
            © ${new Date().getFullYear()} ${escapeHtml(siteName)} — Tous droits réservés.
          </div>
        </div>
      </div>
    </div>
  `.trim();

  const text = `${input.customerName?.trim() ? `Bonjour ${input.customerName.trim()},` : "Bonjour,"}

Merci pour votre achat sur ${siteName}. Votre commande est confirmée.

Produit : ${title}
Référence : ${orderRef}
${downloadUrl ? `Téléchargement : ${downloadUrl}\n` : ""}
Confirmation : ${followUrl}

Support : ${env.contactEmail}
`;

  const useSmtp = (env.mailMailer ?? "").toLowerCase() === "smtp";
  if (useSmtp) {
    return sendEmailViaSmtp({
      to: input.to,
      subject,
      html,
      text,
      replyTo: env.contactEmail,
    });
  }

  return sendEmailViaResend({
    to: input.to,
    subject,
    html,
    text,
    replyTo: env.contactEmail,
  });
}

