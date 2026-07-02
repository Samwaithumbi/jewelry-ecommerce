import Image from "next/image"
import Link from "next/link"
import { Heart, Plus, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    basePriceCents: number
    category: string
    metalType?: string | null
    ratingAvg?: number | string | null
    reviewCount?: number | null
    featured?: boolean | null
    images?: { url: string; altText: string | null }[]
    badge?: "Best Seller" | "New Arrival" | "Limited Edition" | null
    originalPriceCents?: number | null
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const price = product.basePriceCents / 100
  const originalPrice = product.originalPriceCents ? product.originalPriceCents / 100 : null
  const imageUrl = product.images?.[0]?.url || "/placeholder-jewelry.jpg" // Using an external placeholder if needed, but we should probably just use a div block

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md border border-primary/5">
      {/* Badges */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
        {product.badge === "Best Seller" && (
          <Badge className="bg-[#B88E2F] text-white hover:bg-[#B88E2F]/90 border-transparent font-medium shadow-sm">Best Seller</Badge>
        )}
        {product.badge === "New Arrival" && (
          <Badge className="bg-[#111827] text-white hover:bg-[#111827]/90 border-transparent font-medium shadow-sm">New Arrival</Badge>
        )}
        {product.badge === "Limited Edition" && (
          <Badge className="bg-[#B88E2F] text-white hover:bg-[#B88E2F]/90 border-transparent font-medium shadow-sm">Limited Edition</Badge>
        )}
      </div>

      {/* Wishlist Button */}
      <button className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-[#111827] transition-colors hover:bg-white hover:text-red-500 shadow-sm border border-primary/10">
        <Heart className="size-4" />
      </button>

      {/* Image Container */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F8F7F5] flex items-center justify-center">
        {/* Placeholder if no image, otherwise Next Image */}
        {product.images?.length ? (
          <Image
            src={imageUrl}
            alt={product.images?.[0]?.altText || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-3/4 h-3/4 rounded-full bg-[#E5E5E5] animate-pulse opacity-50" />
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground capitalize font-medium tracking-wide">{product.category}</span>
          <button className="flex size-6 items-center justify-center rounded-full border border-primary/20 text-[#B88E2F] transition-colors hover:bg-[#B88E2F]/10">
            <Plus className="size-3.5" />
          </button>
        </div>

        {product.metalType && (
          <span className="text-xs text-muted-foreground capitalize">{product.metalType.replace('_', ' ')}</span>
        )}

        <Link href={`/products/${product.slug}`} className="font-semibold text-sm hover:text-[#B88E2F] transition-colors line-clamp-1 leading-tight text-[#111827]">
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-0.5 text-xs">
          <div className="flex text-[#F59E0B]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "size-3.5",
                  (Number(product.ratingAvg) || 0) >= star ? "fill-current" : "fill-transparent text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground">
            ({product.reviewCount || 0})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className="font-bold text-[15px] text-[#111827]">
            ${price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </span>
          {originalPrice && (
            <span className="text-xs text-muted-foreground line-through font-medium">
              ${originalPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
