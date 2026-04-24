import { isRichHtmlEmpty, sanitizeRichHtml } from "@/lib/sanitize-rich-html";

export type HowItWorksResolvedStep = { text: string };

/**
 * Retourne 4 étapes HTML sanitisées si et seulement si les 4 sont non vides après sanitize.
 * Sinon `undefined` → la page affiche la maquette canon (pinceaux Canva).
 */
export function resolveHowItWorksSteps(
  raw: unknown
): HowItWorksResolvedStep[] | undefined {
  if (!Array.isArray(raw) || raw.length < 4) return undefined;
  const out: HowItWorksResolvedStep[] = [];
  for (const item of raw.slice(0, 4)) {
    if (!item || typeof item !== "object") return undefined;
    const t = String((item as { text?: unknown }).text ?? "");
    const san = sanitizeRichHtml(t);
    if (isRichHtmlEmpty(san)) return undefined;
    out.push({ text: san });
  }
  return out;
}
