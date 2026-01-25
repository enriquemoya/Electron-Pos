export default function ProductLoading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="min-h-[320px] animate-pulse rounded-2xl border border-white/10 bg-base-800" />
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-6 w-24 animate-pulse rounded-full bg-base-800" />
          <div className="h-8 w-3/4 animate-pulse rounded-lg bg-base-800" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-base-800" />
        </div>
        <div className="rounded-xl border border-white/10 bg-base-800/70 p-4">
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 animate-pulse rounded bg-base-700" />
            <div className="h-6 w-24 animate-pulse rounded bg-base-700" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 animate-pulse rounded-md bg-base-800" />
          <div className="h-10 w-32 animate-pulse rounded-md bg-base-800" />
        </div>
        <div className="rounded-xl border border-white/10 bg-base-800 p-4">
          <div className="h-4 w-full animate-pulse rounded bg-base-700" />
        </div>
      </div>
    </div>
  );
}
