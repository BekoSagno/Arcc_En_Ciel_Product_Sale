export default function Loading() {
  return (
    <div className="flex flex-1 flex-col bg-[#F5F5F0] pb-28">
      <div className="sticky top-0 z-30 border-b border-black/10 bg-[#F5F5F0]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="h-11 w-40 animate-pulse rounded-2xl bg-black/10" />
          <div className="h-9 w-9 animate-pulse rounded-lg bg-black/10" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-[16/9] w-full animate-pulse rounded-3xl bg-black/10" />
            <div className="mx-auto h-8 w-3/4 animate-pulse rounded-lg bg-black/10" />
            <div className="mx-auto h-6 w-1/2 animate-pulse rounded-lg bg-black/10" />
          </div>
          <div className="hidden space-y-3 lg:block">
            <div className="h-24 animate-pulse rounded-2xl bg-black/10" />
            <div className="h-24 animate-pulse rounded-2xl bg-black/10" />
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="h-48 animate-pulse rounded-3xl bg-black/10" />
          <div className="h-48 animate-pulse rounded-3xl bg-black/10" />
          <div className="h-48 animate-pulse rounded-3xl bg-black/10" />
        </div>
      </div>
    </div>
  );
}

