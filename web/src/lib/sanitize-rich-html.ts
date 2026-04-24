import sanitizeHtml from "sanitize-html";

const RICH_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "ul",
    "ol",
    "li",
    "a",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    span: ["class"],
    p: ["class"],
    li: ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
      target: "_blank",
    }),
  },
};

/** HTML issu de l’éditeur (caractéristiques / cas d’usage) : balises limitées, pas de script. */
export function sanitizeRichHtml(dirty: string): string {
  const s = String(dirty ?? "").trim();
  if (!s) return "";
  return sanitizeHtml(s, RICH_OPTIONS).trim();
}

/** Titre de bloc : texte brut uniquement. */
export function sanitizePlainOneLine(raw: string): string {
  return sanitizeHtml(String(raw ?? ""), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}

export function isRichHtmlEmpty(sanitized: string): boolean {
  const textOnly = sanitizeHtml(sanitized, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\u00a0/g, " ")
    .trim();
  return textOnly.length === 0;
}
