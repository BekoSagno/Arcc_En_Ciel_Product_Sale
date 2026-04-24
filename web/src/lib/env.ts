export function mustGetEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

/** Retire les guillemets si la valeur `.env` est du type `"foo@bar.com"`. */
function trimQuoted(value: string): string {
  const t = value.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/**
 * Expéditeur Resend : `EMAIL_FROM` prioritaire, sinon `MAIL_FROM_NAME` + `MAIL_FROM_ADDRESS`.
 * Format attendu par Resend : `Nom <email@domaine.com>` ou `email@domaine.com`.
 */
function resolveResendFrom(): string {
  const explicit = process.env.EMAIL_FROM;
  if (explicit?.trim()) return trimQuoted(explicit);

  const addr = process.env.MAIL_FROM_ADDRESS?.trim();
  const name = process.env.MAIL_FROM_NAME?.trim();
  if (addr) {
    const a = trimQuoted(addr);
    if (name) return `${trimQuoted(name)} <${a}>`;
    return a;
  }

  return "Vente <noreply@example.com>";
}

function trimBaseUrl(v: string | undefined) {
  const t = v?.trim().replace(/\/$/, "");
  return t || undefined;
}

export const env = {
  supabaseUrl: mustGetEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: mustGetEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  adminEmail: process.env.ADMIN_EMAIL,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /**
   * En dev : URL HTTPS ngrok (ex. https://abc.ngrok-free.app) sans slash final.
   * Utilisée pour l’URL du webhook affichée et à coller chez Djomy.
   */
  webhookPublicBaseUrl:
    trimBaseUrl(process.env.NEXT_PUBLIC_WEBHOOK_PUBLIC_BASE_URL) ??
    trimBaseUrl(process.env.WEBHOOK_PUBLIC_BASE_URL) ??
    trimBaseUrl(process.env.NGROK_URL),
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "Arc en Ciel",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@example.com",

  djomyApiBase: process.env.DJOMY_API_BASE ?? "https://sandbox.djomy.africa",
  djomyClientId: process.env.DJOMY_CLIENT_ID,
  djomyClientSecret: process.env.DJOMY_CLIENT_SECRET,
  djomyWebhookSecret: process.env.DJOMY_WEBHOOK_SECRET,
  /**
   * Par défaut on vérifie la signature des webhooks.
   * Mettre DJOMY_WEBHOOK_VERIFY=0 en dev pour diagnostiquer sans bloquer.
   */
  djomyWebhookVerify: process.env.DJOMY_WEBHOOK_VERIFY !== "0",

  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: resolveResendFrom(),
  mailMailer: process.env.MAIL_MAILER?.trim() || undefined,
  mailHost: process.env.MAIL_HOST?.trim() || undefined,
  mailPort: process.env.MAIL_PORT?.trim() || undefined,
  mailUsername: process.env.MAIL_USERNAME?.trim() || undefined,
  mailPassword: process.env.MAIL_PASSWORD?.trim() || undefined,
  mailEncryption: process.env.MAIL_ENCRYPTION?.trim() || undefined,

  /**
   * Secret dédié aux jetons de téléchargement (HMAC).
   * En production, définir explicitement DELIVERY_DOWNLOAD_SECRET (32+ caractères aléatoires).
   */
  deliveryDownloadSecret: process.env.DELIVERY_DOWNLOAD_SECRET?.trim(),
  /** Durée de validité du lien « Télécharger » dans l’e-mail (secondes). */
  deliveryLinkTtlSeconds: (() => {
    const n = Number(process.env.DELIVERY_LINK_TTL_SECONDS);
    return Number.isFinite(n) && n >= 300 ? Math.floor(n) : 7 * 24 * 3600;
  })(),
  /** Durée de vie de l’URL signée Supabase Storage après clic (secondes). */
  deliveryStorageSignedUrlSeconds: (() => {
    const n = Number(process.env.DELIVERY_STORAGE_SIGNED_URL_SECONDS);
    return Number.isFinite(n) && n >= 60 ? Math.floor(n) : 180;
  })(),

  /** Clé API Gemini (Google Generative AI) pour l'auto-remplissage IA admin. */
  geminiApiKey: process.env.GEMINI_API_KEY?.trim(),
  /** Modèle chat Gemini (ex: models/gemini-flash-latest) */
  geminiChatModel: process.env.GEMINI_CHAT_MODEL?.trim(),
  /** Modèle embedding Gemini (optionnel) */
  geminiEmbedModel: process.env.GEMINI_EMBED_MODEL?.trim(),
};

