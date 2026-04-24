"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type Step = { text: string };

type Props = {
  steps?: Step[];
  productType?: "electronic" | "physical" | null;
};

/** Grand cadre Canva : double trait + griffes (guillemets) intégrés au PNG. */
const FRAME_SRC = "/canva/3.webp";

const STAR_SRC = [
  "/canva/9.webp",
  "/canva/10.webp",
  "/canva/6.webp",
  "/canva/5.webp",
] as const;

/**
 * Sources alignées sur les fichiers réels dans /public/canva :
 * - highlight-yellow : jaune vif (surlignage type 1)
 * - 12.png : trait horizontal rose / magenta (mot « Acheter »)
 * - 7.png : trait corail / saumon (mot « Remplissez », comme la maquette)
 * - 4.png : tache bleue (segment « instantanément un email contenant »)
 */
const BRUSH = {
  warm: "/canva/highlight-yellow.webp",
  pink: "/canva/12.webp",
  orange: "/canva/7.webp",
  blue: "/canva/4.webp",
} as const;

type BrushKey = keyof typeof BRUSH;

type Segment =
  | { kind: "text"; value: string }
  | { kind: "mark"; brush: BrushKey; blob?: boolean; value: string };

type StepModel = {
  segments: Segment[];
  /** Décalage quinconce (une seule chaîne par carte) */
  cellClass: string;
};

/**
 * Surlignages : PNG pinceau (`Mark`) sous les passages importants, à l’intérieur du petit cadre.
 */
const CANON_STEPS: StepModel[] = [
  {
    cellClass: "z-10",
    segments: [
      { kind: "text", value: "Lisez attentivement la " },
      { kind: "mark", brush: "warm", value: "description et les" },
      { kind: "text", value: " caractéristiques de l’offre." },
    ],
  },
  {
    cellClass: "z-10",
    segments: [
      { kind: "text", value: "Si l’offre répond à vos besoins, cliquez sur le bouton " },
      { kind: "mark", brush: "pink", value: "« Acheter »" },
    ],
  },
  {
    // 2e ligne : léger chevauchement pour compacter visuellement
    cellClass: "z-10 -mt-2 sm:-mt-3",
    segments: [
      { kind: "mark", brush: "orange", value: "Remplissez" },
      {
        kind: "text",
        value:
          " le formulaire de paiement et sélectionnez ensuite votre mode de paiement.",
      },
    ],
  },
  {
    // 2e ligne : léger chevauchement pour compacter visuellement
    cellClass: "z-10 -mt-2 sm:-mt-3",
    segments: [
      {
        kind: "text",
        value: "Une fois le paiement effectué, vous recevrez ",
      },
      {
        kind: "mark",
        brush: "blue",
        blob: true,
        value: "instantanément un email contenant",
      },
      {
        kind: "text",
        value: " votre reçu ainsi que votre produit.",
      },
    ],
  },
];

const CANON_STEPS_PHYSICAL: StepModel[] = [
  {
    cellClass: "z-10",
    segments: [
      { kind: "text", value: "Lisez attentivement la " },
      { kind: "mark", brush: "warm", value: "description et les" },
      { kind: "text", value: " caractéristiques du produit." },
    ],
  },
  {
    cellClass: "z-10",
    segments: [
      { kind: "text", value: "Cliquez sur le bouton " },
      { kind: "mark", brush: "pink", value: "« Demander »" },
      { kind: "text", value: " pour commencer la commande." },
    ],
  },
  {
    // 2e ligne : léger chevauchement pour compacter visuellement
    cellClass: "z-10 -mt-2 sm:-mt-3",
    segments: [
      { kind: "mark", brush: "orange", value: "Remplissez" },
      {
        kind: "text",
        value:
          " vos informations (nom, téléphone, adresse) et envoyez la demande.",
      },
    ],
  },
  {
    // 2e ligne : léger chevauchement pour compacter visuellement
    cellClass: "z-10 -mt-2 sm:-mt-3",
    segments: [
      { kind: "text", value: "L’admin vous " },
      { kind: "mark", brush: "blue", blob: true, value: "recontacte rapidement" },
      { kind: "text", value: " pour confirmer la livraison. Aucun paiement en ligne." },
    ],
  },
];

const pClass =
  [
    "m-0 block w-full min-w-0 max-w-full text-center",
    "text-[11px] font-semibold leading-snug sm:text-[12px]",
    "text-black antialiased [text-shadow:none]",
    "break-words [overflow-wrap:anywhere] [word-break:break-word]",
    "hyphens-auto",
  ].join(" ");

/** Même échelle typographique que `pClass`, pour le HTML riche des étapes BDD. */
const richStepClass =
  [
    "w-full min-w-0 max-w-full text-center",
    "text-[11px] font-semibold leading-snug sm:text-[12px]",
    "text-black antialiased [text-shadow:none]",
    "break-words [overflow-wrap:anywhere] [word-break:break-word]",
    "hyphens-auto",
    "sales-rich-html how-it-works-rich",
  ].join(" ");

function Mark({
  brush,
  blob,
  children,
}: {
  brush: BrushKey;
  blob?: boolean;
  children: ReactNode;
}) {
  const src = BRUSH[brush];
  return (
    <span className="relative inline-block max-w-full align-baseline [box-decoration-break:clone]">
      <span
        aria-hidden
        className={[
          "pointer-events-none absolute z-0 flex max-w-full items-center justify-center",
          blob
            ? "left-1/2 top-1/2 w-[min(100%,8.75rem)] -translate-x-1/2 -translate-y-1/2 sm:w-[min(100%,9.5rem)]"
            : "left-1/2 top-[52%] w-[min(100%,5rem)] -translate-x-1/2 -translate-y-1/2 sm:w-[min(100%,5.5rem)]",
        ].join(" ")}
      >
        <Image
          src={src}
          alt=""
          width={blob ? 168 : 96}
          height={blob ? 112 : 28}
          className={[
            "max-w-full object-contain",
            blob ? "max-h-[6rem] sm:max-h-[7rem]" : "max-h-4 sm:max-h-5",
          ].join(" ")}
          style={{ width: "auto", height: "auto" }}
        />
      </span>
      <span className="relative z-10 inline min-w-0 max-w-full break-words font-semibold [overflow-wrap:anywhere] [word-break:break-word]">
        {children}
      </span>
    </span>
  );
}

function segmentsToParagraph(segments: Segment[]) {
  return (
    <p lang="fr" className={pClass}>
      {segments.map((seg, i) => {
        if (seg.kind === "text") return <span key={i}>{seg.value}</span>;
        return (
          <Mark key={i} brush={seg.brush} blob={seg.blob}>
            {seg.value}
          </Mark>
        );
      })}
    </p>
  );
}

type StepCardProps = {
  stepIndex: number;
  cellClass: string;
  starSrc: (typeof STAR_SRC)[number];
  body: ReactNode;
};

/**
 * Même logique que le schéma rouge « Image 3 » :
 *
 *   ┌──────────────────────────────────────┐  ← CADRE 1 = seulement `3.png` (traits + griffes)
 *   │  griffe haut-gauche (dans le PNG)    │
 *   │       ★ étoile (dans le cadre 1)      │
 *   │    ┌────────────────────────────┐    │  ← CADRE 2 = bordure noire, **à l’intérieur**
 *   │    │  texte + surlignages       │    │     du cadre 1 (jamais au-dehors des traits)
 *   │    └────────────────────────────┘    │
 *   └──────────────────────────────────────┘
 *
 * Un seul calque absolu = « tout ce qui est dedans » : étoile puis cadre texte, sans wrapper inutile.
 */
function StepCard({ stepIndex, cellClass, starSrc, body }: StepCardProps) {
  return (
    <div
      className={[
        // Sur desktop, on veut 4 cartes côte à côte → on réduit la largeur max.
        "relative mx-auto w-full min-w-0 max-w-[min(100%,248px)] sm:max-w-[min(100%,288px)] md:max-w-[min(100%,230px)] lg:max-w-[min(100%,250px)]",
        cellClass,
      ].join(" ")}
    >
      <div className="relative aspect-square w-full overflow-hidden">
        {/* CADRE 1 — image 3 : c’est le cadre griffe entier */}
        <Image
          src={FRAME_SRC}
          alt=""
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 22vw, 300px"
          className="z-0 object-contain object-center select-none"
          quality={70}
        />
        {/* Tout ce qui suit vit DANS le cadre 1 ; le cadre 2 (texte) est imbriqué ici seulement */}
        <div
          className={[
            "absolute z-10 box-border flex min-h-0 min-w-0 flex-col overflow-hidden",
            /* Insets un peu plus larges : le cadre texte reste clairement à l’intérieur du trait PNG */
            // Plus de place pour le texte + aucun scroll interne
            "inset-[20%_18%_22%_18%]",
          ].join(" ")}
        >
          {/* Étoile en coin, léger chevauchement du trait (sous la griffe PNG, au-dessus du texte) */}
          <div className="flex h-9 shrink-0 items-start justify-start pl-0 pt-0 sm:h-10">
            <div className="relative">
            <Image
              src={starSrc}
              alt={`Étape ${stepIndex + 1}`}
              width={40}
              height={40}
              className="h-9 w-9 -translate-x-0.5 -translate-y-0.5 object-contain sm:h-10 sm:w-10 sm:-translate-x-1 sm:-translate-y-1"
              quality={70}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-[45%] top-[42%] -translate-x-1/2 -translate-y-1/2 text-[12px] font-black text-black sm:text-[13px]"
              style={{
                textShadow:
                  "1px 0 #fff, -1px 0 #fff, 0 1px #fff, 0 -1px #fff, 1px 1px #fff, -1px 1px #fff, 1px -1px #fff, -1px -1px #fff",
              }}
            >
              {stepIndex + 1}
            </span>
            </div>
          </div>
          {/* CADRE 2 — texte centré dans le cadre quand la hauteur le permet */}
          <div className="mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-sm border-2 border-black bg-white">
            {/* Pas de scroll : on compacte la typo + on laisse le texte se rendre en entier */}
            <div className="flex min-h-full min-w-0 flex-1 flex-col justify-center px-2 py-2 sm:px-2.5 sm:py-2.5">
              <div className="min-w-0 max-w-full [&>*]:min-w-0">{body}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Maquette canon (pinceaux Canva) par défaut. Si `steps` contient exactement 4 blocs
 * HTML non vides (validés côté page), on les affiche à la place, en conservant la grille
 * et les décalages `cellClass` de la maquette.
 */
export function HowItWorksGrid({ steps, productType }: Props) {
  const gridClass =
    // Mobile/tablette : grille 2×2 compacte.
    "mt-4 grid w-full grid-cols-2 gap-x-1 gap-y-0 px-0 sm:mt-5 sm:gap-x-2 sm:gap-y-1 md:mx-auto md:max-w-3xl";

  const stageClass =
    // Desktop : superposition façon maquette (puzzle 2×2, légèrement chevauché).
    "relative mx-auto hidden w-full max-w-5xl lg:block lg:h-[520px]";

  const stagePos = [
    // 1 (haut gauche)
    "absolute left-0 top-0 z-20 w-[250px] xl:w-[280px]",
    // 2 (haut droite)
    "absolute right-0 top-2 z-20 w-[250px] xl:w-[280px]",
    // 3 (bas gauche) — remonte pour chevaucher légèrement
    "absolute left-14 top-[250px] z-30 w-[250px] xl:w-[280px]",
    // 4 (bas droite) — remonte pour chevaucher légèrement
    "absolute right-10 top-[250px] z-30 w-[250px] xl:w-[280px]",
  ] as const;

  const stageGuide =
    // Guide discret derrière : ligne horizontale + petit coude (approx) via gradients.
    "pointer-events-none absolute inset-0 z-10 hidden lg:block";

  if (steps && steps.length === 4) {
    return (
      <div className="relative">
        {/* Desktop : superposition */}
        <div className={stageClass}>
          <div
            aria-hidden
            className={stageGuide}
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.00) 60%), linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.10) 46%, rgba(0,0,0,0.00) 46%)",
              backgroundPosition: "70px 155px, 50% 155px",
              backgroundSize: "calc(100% - 140px) 2px, 2px 220px",
              backgroundRepeat: "no-repeat",
            }}
          />
          {steps.map((step, i) => (
            <div key={i} className={stagePos[i] ?? ""}>
              <StepCard
                stepIndex={i}
                cellClass={CANON_STEPS[i]!.cellClass}
                starSrc={STAR_SRC[i]!}
                body={
                  <div
                    lang="fr"
                    className={richStepClass}
                    dangerouslySetInnerHTML={{ __html: step.text }}
                  />
                }
              />
            </div>
          ))}
        </div>

        {/* Mobile/Tablet : grille */}
        <div className="lg:hidden">
          <div className={gridClass}>
            {steps.map((step, i) => (
              <StepCard
                key={i}
                stepIndex={i}
                cellClass={CANON_STEPS[i]!.cellClass}
                starSrc={STAR_SRC[i]!}
                body={
                  <div
                    lang="fr"
                    className={richStepClass}
                    dangerouslySetInnerHTML={{ __html: step.text }}
                  />
                }
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const canon = (() => {
    const t = productType === "physical" ? "physical" : "electronic";
    return t === "physical" ? CANON_STEPS_PHYSICAL : CANON_STEPS;
  })();

  return (
    <div className="relative">
      {/* Desktop : superposition */}
      <div className={stageClass}>
        <div
          aria-hidden
          className={stageGuide}
          style={{
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.10) 60%, rgba(0,0,0,0.00) 60%), linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.10) 46%, rgba(0,0,0,0.00) 46%)",
            backgroundPosition: "70px 155px, 50% 155px",
            backgroundSize: "calc(100% - 140px) 2px, 2px 220px",
            backgroundRepeat: "no-repeat",
          }}
        />
        {canon.map((model, i) => (
          <div key={i} className={stagePos[i] ?? ""}>
            <StepCard
              stepIndex={i}
              cellClass={model.cellClass}
              starSrc={STAR_SRC[i]!}
              body={segmentsToParagraph(model.segments)}
            />
          </div>
        ))}
      </div>

      {/* Mobile/Tablet : grille */}
      <div className="lg:hidden">
        <div className={gridClass}>
          {canon.map((model, i) => (
            <StepCard
              key={i}
              stepIndex={i}
              cellClass={model.cellClass}
              starSrc={STAR_SRC[i]!}
              body={segmentsToParagraph(model.segments)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
