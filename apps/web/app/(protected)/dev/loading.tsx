import { Skeleton } from "@workspace/ui/components/skeleton"

export default function DevLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Status stat pills */}
      <div className="flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-full" />
        ))}
      </div>

      {/* Developer card grid (Ninja Board placeholder) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5"
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            {/* Status badge */}
            <Skeleton className="h-6 w-20 rounded-md" />

            {/* Current task */}
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3.5 w-full" />
            </div>

            {/* Assigned ticket */}
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
