/** Conversion légère pour pré-remplir un textarea à partir d'un HTML simple. */
export function simpleHtmlToPlainText(html: string | null | undefined): string {
  const raw = String(html ?? "").trim();
  if (!raw) return "";

  // <br> => saut de ligne, </p> => double saut (paragraphes)
  const withBreaks = raw
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<\s*p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "");

  const unescaped = withBreaks
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  return unescaped.replace(/\n{3,}/g, "\n\n").trim();
}

