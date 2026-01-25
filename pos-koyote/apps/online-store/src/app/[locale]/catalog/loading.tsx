export default function CatalogLoading() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-base-800" />
      <div className="grid gap-3 rounded-xl border border-white/10 bg-base-800/60 p-4 md:grid-cols-4">
        <div className="h-10 animate-pulse rounded-md bg-base-800" />
        <div className="h-10 animate-pulse rounded-md bg-base-800" />
        <div className="h-10 animate-pulse rounded-md bg-base-800" />
        <div className="h-10 animate-pulse rounded-md bg-base-800" />
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-white/10 bg-base-800">
            <div className="h-40 w-full animate-pulse bg-base-700" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-base-700" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-base-700" />
              <div className="h-8 w-20 animate-pulse rounded-full bg-base-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
