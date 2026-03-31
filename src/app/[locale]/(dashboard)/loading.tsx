export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-32 bg-neutral-100 rounded-lg mt-2" />
        </div>
        <div className="h-10 w-28 bg-neutral-200 rounded-xl" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-5">
            <div className="h-4 w-24 bg-neutral-100 rounded" />
            <div className="h-8 w-32 bg-neutral-200 rounded mt-3" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-neutral-50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
