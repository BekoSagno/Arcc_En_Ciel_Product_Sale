"use client";

import { useState } from "react";

type Props = {
  webhookUrl: string;
  isLocalhost: boolean;
};

export function DjomyWebhookCard({ webhookUrl, isLocalhost }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-neutral-900">URL du webhook Djomy</h2>
          <p className="mt-1 text-xs text-neutral-600">
            À configurer dans l’espace développeur Djomy.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(webhookUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 rounded-xl bg-[#0b6b63] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.99]"
        >
          {copied ? "Copié ✓" : "Copier"}
        </button>
      </div>
      <p className="mt-3 break-all rounded-xl bg-neutral-50 px-3 py-2 font-mono text-[11px] text-neutral-900 ring-1 ring-black/5">
        {webhookUrl}
      </p>
      {isLocalhost ? (
        <p className="mt-2 text-xs text-amber-800">
          En local, exposez votre app (ex. tunnel HTTPS) pour que Djomy puisse joindre cette URL.
        </p>
      ) : null}
    </div>
  );
}
