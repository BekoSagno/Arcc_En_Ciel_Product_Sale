import { plainTextToSimpleHtml } from "@/lib/plain-text-to-html";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";

/**
 * Contenu chargé depuis la BDD : si ce n’est pas du HTML, on reprend l’ancien comportement (paragraphes + retours ligne).
 */
export function legacyTextToRichEditorHtml(raw: string): string {
  const t = String(raw ?? "").trim();
  if (!t) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(t)) {
    const safe = sanitizeRichHtml(t);
    return safe || "<p></p>";
  }
  return plainTextToSimpleHtml(t) ?? "<p></p>";
}
