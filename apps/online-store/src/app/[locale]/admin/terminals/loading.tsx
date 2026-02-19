export default function AdminTerminalsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-5 w-64 animate-pulse rounded bg-white/10" />
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-56 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-80 animate-pulse rounded bg-white/10" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
