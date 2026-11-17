export default function Loading() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="h-20 animate-pulse rounded-xl bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />)}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" />
      <span className="sr-only">Loading dashboard</span>
    </div>
  );
}
