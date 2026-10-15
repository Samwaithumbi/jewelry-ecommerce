import { Skeleton } from "@/components/ui/skeleton";

export default function AccountWishlistLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-44 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-white overflow-hidden shadow-sm flex flex-col"
          >
            {/* Image Placeholder */}
            <div className="relative aspect-square w-full bg-muted/40">
              <Skeleton className="h-full w-full rounded-none" />
              <div className="absolute top-3 right-3">
                <Skeleton className="size-8 rounded-full" />
              </div>
            </div>

            {/* Content Placeholder */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/3 rounded" />
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
                <Skeleton className="h-9 flex-1 rounded-full" />
                <Skeleton className="size-9 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
