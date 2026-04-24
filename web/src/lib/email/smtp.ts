import "server-only";

import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export type SendEmailSmtpInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

function toInt(v: string | undefined, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function sendEmailViaSmtp(input: SendEmailSmtpInput) {
  const host = env.mailHost;
  const user = env.mailUsername;
  const pass = env.mailPassword;
  if (!host || !user || !pass) {
    throw new Error("SMTP: config incomplète (MAIL_HOST/MAIL_USERNAME/MAIL_PASSWORD)");
  }

  const port = toInt(env.mailPort, 587);
  const enc = (env.mailEncryption ?? "").toLowerCase();
  const secure = enc === "ssl" || enc === "tls" ? port === 465 : false;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const info = await transporter.sendMail({
    from: env.emailFrom,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.text ? { text: input.text } : {}),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });

  return info;
}

