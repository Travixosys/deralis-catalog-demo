export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-border"
        >
          <div className="skeleton h-40 w-full" />
          <div className="space-y-3 p-4">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
            <div className="flex items-center justify-between">
              <div className="skeleton h-5 w-16 rounded" />
              <div className="skeleton h-5 w-20 rounded-full" />
            </div>
            <div className="skeleton h-9 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
