"use client"

import Image from "next/image"
import Link from "next/link"
import { Trash2, ShoppingCart, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <Card key={item.id} className="border-primary/10 overflow-hidden">
          <CardContent className="p-4">
            <div className="relative aspect-square mb-4 rounded-lg overflow-hidden bg-[#F8F7F5]">
              <Link href={`/products/${item.productSlug}`}>
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="size-12 text-[#B88E2F]/30" />
                  </div>
                )}
              </Link>
              
              <button
                onClick={() => handleRemove(item.id)}
                className="absolute top-2 right-2 size-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-white transition-colors shadow-sm"
                title="Remove from wishlist"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Link href={`/products/${item.productSlug}`}>
                <h3 className="font-semibold text-sm text-[#111827] hover:text-[#B88E2F] transition-colors line-clamp-2">
                  {item.productName}
                </h3>
              </Link>

              {item.variantSize && (
                <p className="text-xs text-muted-foreground">Size: {item.variantSize}</p>
              )}

              {item.note && (
                <p className="text-xs text-[#B88E2F] italic line-clamp-2">"{item.note}"</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <p className="font-bold text-[#111827]">
                  ${(item.productPrice / 100).toFixed(2)}
                </p>
                <Button
                  size="sm"
                  className="h-8 px-3 bg-[#111827] text-white hover:bg-[#111827]/90"
                >
                  <ShoppingCart className="size-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
