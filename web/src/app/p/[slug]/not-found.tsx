export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-[#F5F5F0] px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 text-center shadow-[0_10px_25px_rgba(0,0,0,0.08)]">
        <div className="text-xl font-extrabold">Produit introuvable</div>
        <div className="mt-2 text-sm text-neutral-800">
          Cette page n’existe pas (ou n’est plus publiée).
        </div>
      </div>
    </div>
  );
}

