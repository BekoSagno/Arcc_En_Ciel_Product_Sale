/** Transforme un texte saisi « comme dans un mail » en HTML simple (paragraphes + retours ligne). */
export function plainTextToSimpleHtml(text: string): string | null {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (!raw) return null;

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const blocks = raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const html = blocks
    .map((block) => {
      const withBreaks = escape(block).replace(/\n/g, "<br />");
      return `<p>${withBreaks}</p>`;
    })
    .join("\n");

  return html;
}
