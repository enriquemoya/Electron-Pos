export function FeaturedSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex h-64 animate-pulse flex-col gap-4 rounded-xl border border-white/10 bg-base-800/60 p-4"
        >
          <div className="h-32 rounded-lg bg-base-900/70" />
          <div className="h-4 w-3/4 rounded bg-base-900/70" />
          <div className="h-3 w-1/2 rounded bg-base-900/70" />
          <div className="mt-auto h-4 w-1/3 rounded bg-base-900/70" />
        </div>
      ))}
    </div>
  );
}
