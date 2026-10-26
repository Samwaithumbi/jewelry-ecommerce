"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Star } from "lucide-react"
import { useState, useTransition } from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { addToWishlist } from "@/app/actions/wishlist/add-to-wishlist"
import { toast } from "sonner"

interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    basePriceCents: number
    category: string
    metalType?: string | null
    metalPurity?: string | null
    ratingAvg?: number | string | null
    reviewCount?: number | null
    featured?: boolean | null
    images?: { url: string; altText: string | null }[]
    badge?: "Best Seller" | "New Arrival" | "Limited Edition" | null
    originalPriceCents?: number | null
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const price = product.basePriceCents / 100
  const originalPrice = product.originalPriceCents ? product.originalPriceCents / 100 : null
  const primaryImage = product.images?.[0]?.url || "/placeholder-jewelry.jpg"
  const secondaryImage = product.images?.[1]?.url

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      try {
        const res = await addToWishlist(product.id)
        if (!res.success) {
          toast.error(res.message || 'Please log in to add items to your wishlist')
          if (res.message?.includes('logged in')) {
            router.push('/sign_in?callbackUrl=/products')
          }
          return
        }
        setIsWishlisted(!isWishlisted)
        toast.success(res.message || 'Added to wishlist')
        window.dispatchEvent(new Event("wishlist-update"))
      } catch (error: any) {
        toast.error(error?.message || 'Failed to update wishlist')
      }
    })
  }

  return (
    <div className="group relative flex flex-col h-full rounded-2xl bg-white p-3.5 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-primary/10">
      {/* Badges */}
      <div className="absolute left-5 top-5 z-20 flex flex-col gap-1.5 pointer-events-none">
        {product.badge === "Best Seller" && (
          <Badge className="bg-[#B88E2F] text-white hover:bg-[#B88E2F] border-transparent font-medium text-[11px] px-2.5 py-0.5 shadow-sm">
            Best Seller
          </Badge>
        )}
        {product.badge === "New Arrival" && (
          <Badge className="bg-[#111827] text-white hover:bg-[#111827] border-transparent font-medium text-[11px] px-2.5 py-0.5 shadow-sm">
            New
          </Badge>
        )}
        {product.badge === "Limited Edition" && (
          <Badge className="bg-amber-600 text-white hover:bg-amber-600 border-transparent font-medium text-[11px] px-2.5 py-0.5 shadow-sm">
            Limited
          </Badge>
        )}
      </div>

      {/* Wishlist Button */}
      <button 
        onClick={handleWishlist}
        disabled={isPending}
        aria-label="Add to wishlist"
        className={cn(
          "absolute right-5 top-5 z-20 flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 shadow-md border",
          isWishlisted 
            ? "bg-red-500 text-white border-red-500 scale-105" 
            : "bg-white/90 text-[#111827] border-primary/15 hover:bg-white hover:text-red-500 hover:scale-110"
        )}
      >
        <Heart className={cn("size-4 transition-all duration-200", isWishlisted && "fill-current")} />
      </button>

      {/* Image Container */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F8F7F5] flex items-center justify-center block">
        {product.images?.length ? (
          <>
            <Image
              src={primaryImage}
              alt={product.images?.[0]?.altText || product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={cn(
                "object-cover transition-all duration-700 ease-out group-hover:scale-105",
                secondaryImage && "group-hover:opacity-0"
              )}
            />
            {secondaryImage && (
              <Image
                src={secondaryImage}
                alt={product.images?.[1]?.altText || `${product.name} alternate view`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-all duration-700 ease-out scale-105 opacity-0 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="w-3/4 h-3/4 rounded-full bg-[#E5E5E5] animate-pulse opacity-50" />
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1.5 pt-3 px-1">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          <span>{product.category}</span>
          {product.metalType && (
            <span className="capitalize font-medium text-[#B88E2F]">
              {product.metalPurity ? `${product.metalPurity} ` : ""}{product.metalType.replace('_', ' ')}
            </span>
          )}
        </div>

        <Link 
          href={`/products/${product.slug}`} 
          className="font-serif font-medium text-[15px] sm:text-base text-[#111827] hover:text-[#B88E2F] transition-colors line-clamp-1 leading-snug"
        >
          {product.name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 text-xs">
          <div className="flex text-[#F59E0B]">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "size-3.5",
                  (Number(product.ratingAvg) || 5) >= star ? "fill-current" : "fill-transparent text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground text-[11px] font-medium">
            ({product.reviewCount || 0})
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-baseline justify-between pt-3 border-t border-primary/5">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-base sm:text-lg text-[#111827]">
              KSh {price.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            {originalPrice && (
              <span className="text-xs text-muted-foreground line-through font-medium">
                KSh {originalPrice.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-[#B88E2F] opacity-0 group-hover:opacity-100 transition-opacity">
            View Details &rarr;
          </span>
        </div>
      </div>
    </div>
  )
}
