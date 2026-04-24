import { env } from "@/lib/env";
import { getDjomyWebhookUrl } from "@/lib/djomy-webhook";
import { DjomyWebhookCard } from "@/components/admin/DjomyWebhookCard";

export default function AdminIntegrationsPage() {
  return (
    <div className="min-w-0">
      <header className="rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
          Paramètres techniques
        </div>
        <div className="mt-1 text-2xl font-extrabold tracking-tight text-black">
          Intégrations
        </div>
      </header>

      <section className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
        <div className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
          Paiement
        </div>
        <div className="mt-1 text-lg font-extrabold text-black">Webhook Djomy</div>
        <div className="mt-4">
          <DjomyWebhookCard
            webhookUrl={getDjomyWebhookUrl()}
            isLocalhost={env.siteUrl.includes("localhost")}
          />
        </div>
      </section>
    </div>
  );
}

