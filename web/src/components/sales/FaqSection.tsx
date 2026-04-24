import type { FaqItem } from "@/types/sales-page";
import { Reveal } from "@/components/ui/Reveal";
import { SALES_SECTION_FRAME } from "@/lib/sales-layout";

/** Affichés uniquement si le produit n’a pas encore de FAQ en base (aperçu / démo). */
const FAQ_EXEMPLES: FaqItem[] = [
  {
    question: "Que vais-je recevoir exactement après l’achat ?",
    answer:
      "Vous recevez un accès au produit numérique (fichier, lien sécurisé ou instructions) par e-mail dès la validation du paiement. Conservez ce message : il sert de preuve d’achat et de guide d’accès.",
  },
  {
    question: "Le paiement en ligne est-il sécurisé ?",
    answer:
      "Oui. Le règlement passe par notre prestataire de paiement : vos données bancaires ne sont pas stockées sur notre site. Vous êtes redirigé vers une page de paiement chiffrée (HTTPS).",
  },
  {
    question: "Puis-je être remboursé ?",
    answer:
      "Pour un produit numérique téléchargeable ou livré immédiatement, le droit de rétractation peut être limité dès livraison, conformément à la réglementation applicable. En cas de problème technique avéré de notre côté, contactez-nous : nous cherchons une solution équitable au cas par cas.",
  },
  {
    question: "Qu’entendez-vous par « livraison immédiate » ?",
    answer:
      "Dès que le paiement est accepté, vous obtenez l’accès au contenu (lien ou fichier) sans délai d’expédition physique. Vérifiez vos spams si vous ne voyez pas l’e-mail dans les minutes qui suivent.",
  },
  {
    question: "Je n’ai pas reçu l’e-mail, que faire ?",
    answer:
      "Vérifiez le dossier courrier indésirable et l’adresse e-mail saisie à la commande. Si rien n’apparaît après 15 minutes, écrivez-nous en indiquant la date d’achat et l’e-mail utilisé : nous vous renverrons le lien ou le fichier.",
  },
  {
    question: "Puis-je utiliser le produit sur plusieurs appareils ?",
    answer:
      "Sauf mention contraire sur la fiche produit, l’achat est destiné à un usage personnel. Pour un usage professionnel ou multi-postes, contactez-nous pour une licence adaptée.",
  },
];

/** Bandeaux questions : Vert → Marron → Jaune → Orange (cycle) */
const QUESTION_BAR_BG: [string, string, string, string] = [
  "bg-[#92FE9D]", // vert
  "bg-[#B88718]", // marron / doré
  "bg-[#FFD84D]", // jaune
  "bg-[#FF8A00]", // orange
];

function barClassForIndex(idx: number, item: FaqItem): string {
  const key = item.color?.toLowerCase().trim();
  if (key === "vert" || key === "green") return QUESTION_BAR_BG[0];
  if (key === "marron" || key === "brown") return QUESTION_BAR_BG[1];
  if (key === "jaune" || key === "yellow") return QUESTION_BAR_BG[2];
  if (key === "orange") return QUESTION_BAR_BG[3];
  return QUESTION_BAR_BG[idx % 4]!;
}

/** JSON Supabase / admin : accepte les objets bruts. */
function parseFaqRow(raw: unknown): FaqItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const question = String(o.question ?? "").trim();
  const answer = String(o.answer ?? "").trim();
  if (!question || !answer) return null;
  const color =
    o.color != null && String(o.color).trim()
      ? String(o.color).trim()
      : undefined;
  return color ? { question, answer, color } : { question, answer };
}

/**
 * Placeholder laissé par l’admin par défaut : ne doit pas masquer les FAQ d’exemple.
 */
function isStubFaq(f: FaqItem): boolean {
  const q = f.question.toLowerCase().replace(/\s+/g, " ").trim();
  const a = f.answer.toLowerCase().replace(/\s+/g, " ").trim();
  const stubQ =
    q === "question ?" ||
    q === "question?" ||
    q === "votre question" ||
    q === "votre question ?";
  const stubA =
    a === "réponse." ||
    a === "réponse" ||
    a === "reponse." ||
    a === "reponse" ||
    a === "answer." ||
    a === "answer";
  return stubQ && stubA;
}

type Props = {
  faqs: FaqItem[];
  maxItems?: number;
};

export function FaqSection({ faqs, maxItems = 12 }: Props) {
  const fromDb = (faqs ?? [])
    .map(parseFaqRow)
    .filter((f): f is FaqItem => f != null)
    .filter((f) => !isStubFaq(f));

  const usingExemples = fromDb.length === 0;
  const items = (usingExemples ? FAQ_EXEMPLES : fromDb).slice(0, maxItems);

  return (
    <section id="faq" className="mt-6 scroll-mt-28">
      <div className={SALES_SECTION_FRAME}>
        <div className="relative mx-auto rounded-[28px] border-[5px] border-black bg-white px-6 py-4 shadow-[8px_12px_0_#000]">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[11px] rounded-[20px]"
            style={{ boxShadow: "inset 0 0 0 3px #C9A227" }}
          />
          <h2
            className="relative text-center text-3xl leading-none sm:text-4xl"
            style={{
              fontFamily: "var(--font-hand), cursive",
              color: "#E8381A",
              textShadow:
                "2px 0 #000, -2px 0 #000, 0 2px #000, 0 -2px #000, 0 6px 0 rgba(255,214,80,0.95)",
            }}
          >
            FAQ
          </h2>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {usingExemples ? (
          <p className="mb-1 rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-900/90 ring-1 ring-amber-200/80">
            Exemples pour prévisualiser la FAQ — remplacez-les par vos textes dans
            l’admin produit.
          </p>
        ) : null}
        {items.map((f, idx) => (
          <Reveal key={idx} delayMs={idx * 55}>
            <details className="group overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
              <summary
                className={[
                  "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-extrabold text-black",
                  "outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2",
                  "[&::-webkit-details-marker]:hidden",
                  barClassForIndex(idx, f),
                ].join(" ")}
              >
                <span className="min-w-0 flex-1 text-pretty">{f.question}</span>
                <span
                  className="shrink-0 text-base leading-none text-neutral-800 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden
                >
                  ▾
                </span>
              </summary>
              <div
                className="sales-rich-html border-t border-black/5 bg-neutral-50/90 px-4 pt-3 pb-4 text-sm leading-relaxed text-neutral-800"
                dangerouslySetInnerHTML={{ __html: String(f.answer ?? "") }}
              />
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
