import { Skeleton } from "@/components/ui/skeleton"

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-4 w-12" />
          <span className="text-gray-300">/</span>
          <Skeleton className="h-4 w-16" />
          <span className="text-gray-300">/</span>
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Product Details 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-start">
          {/* Left Column: Image Gallery Skeleton */}
          <div className="flex flex-col gap-4">
            {/* Main Image Box */}
            <div className="relative aspect-square w-full rounded-3xl bg-white p-4 shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center">
              <Skeleton className="size-full rounded-2xl" />
            </div>

            {/* Thumbnail Strip */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-white p-2 border border-gray-100 shadow-2xs">
                  <Skeleton className="size-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Product Info & Actions Skeleton */}
          <div className="flex flex-col gap-6 lg:pl-4">
            {/* Category & Badge */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>

            {/* Title & Metal info */}
            <div className="space-y-2">
              <Skeleton className="h-9 w-4/5 rounded-lg" />
              <Skeleton className="h-4 w-1/3 rounded-md" />
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-2">
              <Skeleton className="h-10 w-48 rounded-xl" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-200/60 my-2" />

            {/* Variant / Size Options */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex flex-wrap gap-2.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="size-11 rounded-xl" />
                ))}
              </div>
            </div>

            {/* Quantity & CTA Buttons */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                {/* Quantity selector */}
                <Skeleton className="h-13 w-32 rounded-full" />
                {/* Add to Cart button */}
                <Skeleton className="h-13 flex-1 rounded-full" />
                {/* Wishlist button */}
                <Skeleton className="size-13 rounded-full shrink-0" />
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-200/60">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center text-center p-3 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-2">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2.5 w-12" />
                </div>
              ))}
            </div>

            {/* Description Paragraphs */}
            <div className="space-y-2.5 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>

        {/* Related Products Skeleton */}
        <div className="mt-20 pt-12 border-t border-gray-200/60">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col space-y-3 rounded-2xl bg-white p-3 border border-gray-100 shadow-2xs">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
