import { Skeleton } from "@/components/ui/skeleton"

export default function ProductsLoading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Header Skeleton */}
        <div className="w-full flex flex-col gap-6 md:flex-row md:items-end justify-between py-8 border-b border-primary/5 mb-8">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-[320px] rounded-full" />
            <Skeleton className="h-11 w-32 rounded-full hidden md:flex" />
            <Skeleton className="h-11 w-32 rounded-full hidden md:flex" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Filter Sidebar Skeleton */}
          <div className="hidden lg:block sticky top-8 z-10 w-full max-w-[260px]">
            <div className="w-full max-w-[260px] flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm h-fit border border-primary/5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col gap-4">
                  <Skeleton className="h-5 w-24" />
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-[18px] rounded" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Products Grid Skeleton */}
          <div className="flex-1 w-full flex flex-col">
            {/* Toolbar Skeleton */}
            <div className="flex w-full items-center justify-between gap-4 py-3 mb-6">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex flex-1 items-center justify-end gap-3">
                <Skeleton className="h-10 w-[150px] rounded-full" />
                <div className="flex items-center gap-1">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="size-8 rounded-full" />
                </div>
              </div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                <div key={i} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm border border-primary/5">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <div className="flex flex-1 flex-col gap-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="size-6 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-full" />
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((j) => (
                          <Skeleton key={j} className="size-3.5 rounded-full" />
                        ))}
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="mt-16 flex items-center justify-center w-full">
              <div className="flex items-center gap-1">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="size-10 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
