import { Suspense } from "react";
import { RequestClient } from "./requestClient";

export default function CheckoutRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center bg-[#F5F5F0] px-4 py-16">
          <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
            <div className="text-sm font-semibold text-neutral-900">Chargement…</div>
          </div>
        </div>
      }
    >
      <RequestClient />
    </Suspense>
  );
}

