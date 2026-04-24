import Link from "next/link";

export const metadata = {
  title: "CGV — Conditions générales de vente",
  description:
    "Conditions générales de vente des produits numériques proposés sur ce site.",
};

export default function CgvPage() {
  const site = process.env.NEXT_PUBLIC_SITE_NAME ?? "Arc en Ciel";

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      <header className="border-b border-neutral-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="text-sm font-bold text-[#6b4a2b] underline-offset-2 hover:underline"
          >
            ← Retour à l’accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 pb-16">
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
          Conditions générales de vente (CGV)
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {site} — Produits digitaux. Document type à adapter avec votre conseil
          juridique avant mise en production.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-800">
          <section>
            <h2 className="text-base font-bold text-neutral-900">1. Objet</h2>
            <p className="mt-2">
              Les présentes CGV régissent la vente de contenus numériques
              proposés sur le site exploité sous la marque {site}. Toute commande
              implique l’acceptation sans réserve des présentes conditions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-neutral-900">2. Prix et paiement</h2>
            <p className="mt-2">
              Les prix sont indiqués en monnaie affichée sur la page produit, toutes
              taxes comprises si applicable. Le paiement est réalisé via un
              prestataire sécurisé. La commande est validée après confirmation du
              paiement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-neutral-900">
              3. Livraison et accès
            </h2>
            <p className="mt-2">
              Le produit est livré par voie dématérialisée (téléchargement, lien ou
              e-mail) après validation du paiement. Il vous appartient de conserver
              l’accès et les preuves d’achat.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-neutral-900">
              4. Droit de rétractation
            </h2>
            <p className="mt-2">
              Pour les contenus numériques fournis immédiatement après achat et
              dont l’exécution a commencé avec votre accord, le droit de
              rétractation peut ne pas s’appliquer conformément à la réglementation
              en vigueur. En cas de dysfonctionnement avéré imputable au vendeur,
              contactez le service client pour un traitement au cas par cas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-neutral-900">
              5. Responsabilité et garanties
            </h2>
            <p className="mt-2">
              Les produits sont fournis « en l’état » dans les limites prévues par
              la loi. La responsabilité du vendeur ne saurait être engagée en cas
              d’usage non conforme ou d’indisponibilité temporaire des réseaux.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-neutral-900">
              6. Données personnelles
            </h2>
            <p className="mt-2">
              Les données collectées servent au traitement des commandes et au
              suivi client. Vous disposez de droits d’accès, de rectification et de
              suppression dans les conditions légales ; les demandes peuvent être
              adressées à l’adresse de contact indiquée sur le site.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-neutral-900">
              7. Litiges et droit applicable
            </h2>
            <p className="mt-2">
              En cas de litige, une solution amiable sera recherchée avant toute
              action. À défaut, les tribunaux compétents et le droit applicable
              seront ceux prévus par la législation applicable à votre situation
              (à préciser avec votre conseil).
            </p>
          </section>
        </div>

        <p className="mt-10 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-950 ring-1 ring-amber-200/80">
          <strong>Note :</strong> ce texte est un modèle informatif. Faites-le
          valider par un professionnel du droit avant toute utilisation commerciale
          définitive.
        </p>
      </main>
    </div>
  );
}
