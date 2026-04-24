import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
// pdf2json : le bundle ESM expose `default` (Turbopack), les `.d.ts` déclarent une classe nommée.
import PDFParser from "pdf2json";
import { env } from "@/lib/env";
import { getAdminSessionUser } from "@/lib/auth/require-admin";
import { sanitizeRichHtml } from "@/lib/sanitize-rich-html";

export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_TEXT_CHARS = 40_000;
const GEMINI_TIMEOUT_MS = 25_000;

function clampText(s: string, max: number) {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max);
}

async function fileToText(file: File): Promise<string> {
  if (!file.size) return "";
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Fichier trop volumineux (max 8 Mo).");
  }

  const name = file.name?.toLowerCase() ?? "";
  const type = (file.type || "").toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());

  // TXT / autres textes simples
  if (type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return bytes.toString("utf-8");
  }

  // PDF — pdf2json (Node pur, pas de worker pdf.js / pas de Turbopack worker)
  if (type === "application/pdf" || name.endsWith(".pdf")) {
    const pdfParser = new PDFParser(null, true);
    const text = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (errData) => {
        const err =
          errData instanceof Error
            ? errData
            : errData && typeof errData === "object" && "parserError" in errData
              ? (errData as { parserError: unknown }).parserError
              : errData;
        reject(err instanceof Error ? err : new Error(String(err ?? "Erreur lecture PDF")));
      });
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent() ?? "");
      });
      pdfParser.parseBuffer(bytes);
    });
    return text;
  }

  // DOCX
  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const res = await mammoth.extractRawText({ buffer: bytes });
    return res.value || "";
  }

  // Fallback : on tente UTF-8 (au mieux)
  return bytes.toString("utf-8");
}

// (helper supprimé) l'image est injectée inline directement plus bas.

const DraftSchema = z.object({
  description_html: z.string().default(""),
  features: z
    .array(z.object({ title: z.string(), text: z.string(), image_url: z.string().optional() }))
    .default([]),
  use_cases: z.array(z.object({ title: z.string(), text: z.string() })).default([]),
  how_it_works: z.array(z.object({ text: z.string() })).default([]),
  faqs: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  testimonials: z
    .array(
      z.object({
        name: z.string(),
        rating: z.number().min(1).max(5).default(5),
        text: z.string(),
        date: z.string().optional(),
      })
    )
    .default([]),
});

export async function POST(request: Request) {
  const user = await getAdminSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Non autorisé" }, { status: 401 });
  }
  if (!env.geminiApiKey) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY manquant" },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "FormData invalide" }, { status: 400 });
  }

  const file = form.get("file");
  const idea = String(form.get("idea") ?? "");
  const category = String(form.get("category") ?? "");
  const currency = String(form.get("currency") ?? "GNF");

  let extracted = "";
  let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;
  let fileMeta:
    | { kind: "none" }
    | { kind: "image"; name: string; type: string; size: number }
    | { kind: "doc"; name: string; type: string; size: number }
    | { kind: "pdf"; name: string; type: string; size: number } = { kind: "none" };
  try {
    if (file && file instanceof File) {
      if ((file.type || "").toLowerCase().startsWith("image/")) {
        const bytes = Buffer.from(await file.arrayBuffer());
        imagePart = {
          inlineData: { data: bytes.toString("base64"), mimeType: file.type || "image/jpeg" },
        };
        fileMeta = { kind: "image", name: file.name, type: file.type, size: file.size };
      } else {
        extracted = await fileToText(file);
        const isPdf =
          (file.type || "").toLowerCase() === "application/pdf" ||
          file.name?.toLowerCase().endsWith(".pdf");
        fileMeta = {
          kind: isPdf ? "pdf" : "doc",
          name: file.name,
          type: file.type,
          size: file.size,
        };
      }
    }
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Lecture du fichier impossible",
        debug: { fileMeta },
      },
      { status: 400 }
    );
  }

  const ctx = clampText(
    [
      category ? `Catégorie: ${category}` : "",
      `Devise: ${currency}`,
      idea.trim() ? `Idée / consignes:\n${idea.trim()}` : "",
      extracted.trim() ? `Contenu extrait du document:\n${extracted.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    MAX_TEXT_CHARS
  );

  if (!ctx.trim()) {
    return NextResponse.json(
      { ok: false, error: "Ajoute un fichier ou une description/idéee.", debug: { fileMeta } },
      { status: 400 }
    );
  }

  const genAI = new GoogleGenerativeAI(env.geminiApiKey);
  const model = genAI.getGenerativeModel({
    model: env.geminiChatModel || "models/gemini-flash-latest",
    generationConfig: {
      temperature: 0.55,
      maxOutputTokens: 2048,
      // Force Gemini à renvoyer du JSON strict quand supporté.
      responseMimeType: "application/json",
    },
  });

  const prompt = [
    "Tu es un assistant copywriter pour une page de vente en français.",
    "Ta mission: proposer un brouillon cohérent pour remplir automatiquement une fiche produit informatique.",
    "",
    "Contraintes:",
    "- Réponds STRICTEMENT en JSON valide (pas de markdown, pas de texte autour).",
    "- Les champs `*_html` doivent contenir du HTML simple: <p>, <ul>, <ol>, <li>, <strong>, <em>, <a href>.",
    "- Ne mets pas d'images (image_url) sauf si explicitement dans le contenu fourni.",
    "- Reste fidèle aux informations données. Si une info manque, propose quelque chose de plausible mais neutre.",
    "- Pas de promesses illégales/risquées. Style clair et vendeur (Guinée / Afrique francophone ok).",
    "",
    "Schéma JSON attendu:",
    JSON.stringify(
      {
        description_html: "<p>...</p>",
        features: [{ title: "…", text: "<p>…</p>", image_url: "" }],
        use_cases: [{ title: "…", text: "<p>…</p>" }],
        how_it_works: [{ text: "<p>…</p>" }],
        faqs: [{ question: "…", answer: "<p>…</p>" }],
        testimonials: [{ name: "…", rating: 5, text: "<p>…</p>", date: "YYYY-MM-DD" }],
      },
      null,
      2
    ),
    "",
    "Contenu:",
    ctx,
  ].join("\n");

  let raw: string;
  try {
    const run = async () =>
      model.generateContent(
        imagePart
          ? [
              {
                text:
                  prompt +
                  "\n\nIMPORTANT: Le document fourni est une image. Décris et exploite le contenu visible dans l'image pour remplir le JSON.",
              },
              imagePart,
            ]
          : prompt
      );
    const res = await Promise.race([
      run(),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("Timeout IA (25s).")), GEMINI_TIMEOUT_MS)
      ),
    ]);
    raw = res.response.text();
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Erreur IA",
        debug: { fileMeta, model: env.geminiChatModel || "models/gemini-flash-latest" },
      },
      { status: 500 }
    );
  }

  // Extra robust: tente d'extraire un JSON si le modèle ajoute du bruit
  const jsonText = (() => {
    const t = raw.trim();
    // Si le modèle entoure le JSON par des fences
    const fenced = t.match(/```json\s*([\s\S]*?)```/i) || t.match(/```\s*([\s\S]*?)```/);
    if (fenced?.[1]) return fenced[1].trim();
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) return t.slice(start, end + 1);
    return t;
  })();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Réponse IA invalide (JSON).",
        debug: {
          fileMeta,
          model: env.geminiChatModel || "models/gemini-flash-latest",
          snippet: String(raw ?? "").slice(0, 900),
        },
      },
      { status: 500 }
    );
  }

  const safe = DraftSchema.safeParse(parsed);
  if (!safe.success) {
    return NextResponse.json(
      { ok: false, error: "Réponse IA invalide (schéma)." },
      { status: 500 }
    );
  }

  // Sanitize HTML pour éviter surprises côté admin/public
  const out = {
    description_html: sanitizeRichHtml(safe.data.description_html ?? ""),
    features: safe.data.features.map((f) => ({
      title: String(f.title ?? "").trim(),
      text: sanitizeRichHtml(String(f.text ?? "")),
      ...(f.image_url ? { image_url: String(f.image_url) } : {}),
    })),
    use_cases: safe.data.use_cases.map((u) => ({
      title: String(u.title ?? "").trim(),
      text: sanitizeRichHtml(String(u.text ?? "")),
    })),
    how_it_works: safe.data.how_it_works.map((s) => ({
      text: sanitizeRichHtml(String(s.text ?? "")),
    })),
    faqs: safe.data.faqs.map((f) => ({
      question: String(f.question ?? "").trim(),
      answer: sanitizeRichHtml(String(f.answer ?? "")),
    })),
    testimonials: safe.data.testimonials.map((t) => ({
      name: String(t.name ?? "").trim() || "Client",
      rating: Number.isFinite(Number(t.rating)) ? Number(t.rating) : 5,
      text: sanitizeRichHtml(String(t.text ?? "")),
      ...(t.date ? { date: String(t.date) } : {}),
    })),
  };

  return NextResponse.json({ ok: true, draft: out });
}

