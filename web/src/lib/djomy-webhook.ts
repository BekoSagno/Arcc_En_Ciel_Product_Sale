import { env } from "@/lib/env";

/** Base publique pour le webhook : ngrok en dev si renseignée, sinon le site. */
export function getWebhookPublicBaseUrl() {
  return (env.webhookPublicBaseUrl ?? env.siteUrl).replace(/\/$/, "");
}

/** URL complète à enregistrer chez Djomy (POST JSON). */
export function getDjomyWebhookUrl() {
  return `${getWebhookPublicBaseUrl()}/api/webhooks/djomy`;
}

export function isDjomySandboxBase() {
  return (env.djomyApiBase ?? "").includes("sandbox");
}
