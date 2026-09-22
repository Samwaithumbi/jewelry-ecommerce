"use client"

import Image from "next/image"
import Link from "next/link"
import { Trash2, ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WishlistItem } from "@/app/actions/wishlist/get-wishlist"

interface WishlistGridProps {
  items: WishlistItem[]
  onRemove: (wishlistId: string) => Promise<void>
}

export function WishlistGrid({ items, onRemove }: WishlistGridProps) {
  const handleRemove = async (wishlistId: string) => {
    await onRemove(wishlistId)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <div key={item.id} className="group relative flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md border border-primary/5">
          {/* Wishlist Heart Icon */}
          <button
            onClick={() => handleRemove(item.id)}
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-all duration-200 hover:bg-red-600"
            title="Remove from wishlist"
          >
            <Heart className="size-4 fill-current" />
          </button>

          {/* Image Container */}
          <Link href={`/products/${item.productSlug}`} className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F8F7F5] flex items-center justify-center">
            {item.productImage ? (
              <Image
                src={item.productImage}
                alt={item.productName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="size-12 text-[#B88E2F]/30" />
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-1.5 pt-2">
            <span className="text-xs text-muted-foreground capitalize font-medium tracking-wide">{item.category}</span>

            <Link href={`/products/${item.productSlug}`} className="font-semibold text-sm hover:text-[#B88E2F] transition-colors line-clamp-1 leading-tight text-[#111827]">
              {item.productName}
            </Link>

            {item.variantSize && (
              <span className="text-xs text-muted-foreground capitalize">Size: {item.variantSize}</span>
            )}

            {item.note && (
              <p className="text-xs text-[#B88E2F] italic line-clamp-2">"{item.note}"</p>
            )}

            {/* Price */}
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="font-bold text-[15px] text-[#111827]">
                ${(item.productPrice / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              <Button
                size="sm"
                className="h-8 px-3 bg-[#111827] text-white hover:bg-[#111827]/90"
              >
                <ShoppingCart className="size-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
