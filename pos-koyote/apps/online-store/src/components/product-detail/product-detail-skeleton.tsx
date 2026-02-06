export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4">
        <div className="aspect-square animate-pulse rounded-2xl border border-white/10 bg-base-800" />
        <div className="flex gap-3 overflow-hidden">
          <div className="h-16 w-16 animate-pulse rounded-xl bg-base-800" />
          <div className="h-16 w-16 animate-pulse rounded-xl bg-base-800" />
          <div className="h-16 w-16 animate-pulse rounded-xl bg-base-800" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-6 w-28 animate-pulse rounded-full bg-base-800" />
          <div className="h-10 w-4/5 animate-pulse rounded-xl bg-base-800" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-base-800" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-base-800/70 p-5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-base-700" />
            <div className="h-7 w-28 animate-pulse rounded bg-base-700" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-base-800/70 p-5">
          <div className="h-4 w-1/3 animate-pulse rounded bg-base-700" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-full animate-pulse rounded bg-base-700" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-base-700" />
            <div className="h-4 w-9/12 animate-pulse rounded bg-base-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

