import { Skeleton } from "@/components/ui/skeleton";

export default function ShopHomeLoading() {
  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section Skeleton */}
      <section className="relative min-h-[550px] sm:min-h-[640px] bg-gradient-to-b from-[#FAF9F6] to-muted/30 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-3xl w-full text-center space-y-6">
          <div className="flex justify-center">
            <Skeleton className="h-6 w-36 rounded-full" />
          </div>
          <Skeleton className="h-12 sm:h-16 w-4/5 mx-auto rounded-xl" />
          <Skeleton className="h-5 sm:h-6 w-2/3 mx-auto rounded-md" />
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Skeleton className="h-12 w-40 rounded-full" />
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>
        </div>
      </section>

      {/* Shop By Category Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-4 w-28 mx-auto rounded" />
          <Skeleton className="h-8 w-60 mx-auto rounded-lg" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3 text-center">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-5 w-24 mx-auto rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Featured / New Arrivals Skeleton */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-8 w-56 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-white p-3 space-y-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
              <div className="pt-2 flex justify-between items-center">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="size-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
