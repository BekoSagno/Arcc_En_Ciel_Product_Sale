import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/env";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmailViaResend(input: SendEmailInput) {
  if (!env.resendApiKey) {
    throw new Error("Missing env var: RESEND_API_KEY");
  }

  const resend = new Resend(env.resendApiKey);
  const res = await resend.emails.send({
    from: env.emailFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.text ? { text: input.text } : {}),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });

  if (res.error) {
    const msg = (res.error.message || "Resend error").trim();
    // Message très courant quand la clé est incorrecte.
    if (msg.toLowerCase().includes("api key") && msg.toLowerCase().includes("invalid")) {
      throw new Error(
        `${msg} (vérifie la valeur de RESEND_API_KEY dans .env.local, puis redémarre le serveur)`
      );
    }
    throw new Error(msg);
  }

  return res.data;
}

