"use client"

import Image from "next/image"
import Link from "next/link"
import { Trash2, ShoppingCart, Heart, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WishlistItem } from "@/app/actions/wishlist/get-wishlist"
import { addToCart } from "@/app/actions/cart/add-to-cart"
import { useState, useTransition } from "react"
import { toast } from "sonner"

interface WishlistGridProps {
  items: WishlistItem[]
  onRemove: (wishlistId: string) => Promise<void>
}

export function WishlistGrid({ items, onRemove }: WishlistGridProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({})
  const [, startTransition] = useTransition()

  const handleRemove = async (wishlistId: string) => {
    setRemovingId(wishlistId)
    try {
      await onRemove(wishlistId)
      toast.success("Item removed from wishlist")
      window.dispatchEvent(new Event("wishlist-update"))
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove item from wishlist")
    } finally {
      setRemovingId(null)
    }
  }

  const handleAddToCart = (item: WishlistItem) => {
    setAddingId(item.id)
    startTransition(async () => {
      try {
        await addToCart({
          productId: item.productId,
          variantId: item.variantId || undefined,
          name: item.productName,
          variantName: item.variantSize ? `Size ${item.variantSize}` : undefined,
          image: item.productImage || "/placeholder-jewelry.jpg",
          priceAtAdd: item.productPrice,
          qty: 1,
        })
        toast.success(`Added ${item.productName} to your cart`)
        window.dispatchEvent(new Event("cart-update"))
        setAddedIds((prev) => ({ ...prev, [item.id]: true }))
        setTimeout(() => {
          setAddedIds((prev) => ({ ...prev, [item.id]: false }))
        }, 2000)
      } catch (err: any) {
        toast.error(err?.message || "Failed to add item to cart")
        console.error("Failed to add wishlist item to cart:", err)
      } finally {
        setAddingId(null)
      }
    })
  }

  return (
    <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {items.map((item) => (
        <div key={item.id} className="group relative flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md border border-primary/5">
          {/* Wishlist Heart Icon */}
          <button
            type="button"
            onClick={() => handleRemove(item.id)}
            disabled={removingId === item.id}
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-all duration-200 hover:bg-red-600 disabled:opacity-50"
            title="Remove from wishlist"
          >
            {removingId === item.id ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Heart className="size-4 fill-current" />
            )}
          </button>

          {/* Image Container */}
          <Link href={`/products/${item.productSlug}`} className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F8F7F5] flex items-center justify-center">
            {item.productImage ? (
              <Image
                src={item.productImage}
                alt={item.productName}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
              <p className="text-xs text-[#B88E2F] italic line-clamp-2">&ldquo;{item.note}&rdquo;</p>
            )}

            {/* Price & Action */}
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="font-bold text-[15px] text-[#111827]">
                KSh {(item.productPrice /100).toLocaleString("en-KE", {  })}
              </span>
              <Button
                type="button"
                size="sm"
                disabled={addingId === item.id}
                onClick={() => handleAddToCart(item)}
                className={`h-8 px-3 transition-colors ${
                  addedIds[item.id]
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-[#111827] text-white hover:bg-[#111827]/90"
                }`}
              >
                {addingId === item.id ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : addedIds[item.id] ? (
                  <Check className="size-3.5 mr-1.5" />
                ) : (
                  <ShoppingCart className="size-3.5 mr-1.5" />
                )}
                {addedIds[item.id] ? "Added!" : "Add to Cart"}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
