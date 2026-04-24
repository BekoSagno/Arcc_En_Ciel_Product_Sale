/**
 * Largeurs responsive partagées par la page produit (évite header lg:max-w-5xl vs contenu lg:max-w-6xl).
 */

/** Header + pied de page : même grille que le hero. */
export const SALES_SITE_CONTAINER =
  "mx-auto w-full max-w-md px-4 md:max-w-4xl lg:max-w-6xl lg:px-10";

/** Blocs principaux avec marge verticale (hero, flux sous le pli). */
export const SALES_PAGE_CONTENT =
  "mx-auto w-full max-w-md px-4 py-6 md:max-w-4xl lg:max-w-6xl lg:px-10";

/** Sous-sections déjà dans un conteneur paddé (sans re-padding horizontal). */
export const SALES_PAGE_INNER =
  "mx-auto w-full max-w-md md:max-w-4xl lg:max-w-6xl";

/** Cadres type FAQ / témoignages (px-1 pour le rendu graphique). */
export const SALES_SECTION_FRAME =
  "mx-auto w-full max-w-md px-1 md:max-w-4xl lg:max-w-6xl";
