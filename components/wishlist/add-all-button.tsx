"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Loader2, Check } from "lucide-react"
import { addAllWishlistToCart } from "@/app/actions/cart/add-all-wishlist-to-cart"

interface AddAllToCartButtonProps {
  itemCount: number
}

export function AddAllToCartButton({ itemCount }: AddAllToCartButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [isSuccess, setIsSuccess] = useState(false)

  const handleAddAll = () => {
    if (itemCount === 0 || isPending) return

    startTransition(async () => {
      try {
        const res = await addAllWishlistToCart()
        if (res.success) {
          window.dispatchEvent(new Event("cart-update"))
          setIsSuccess(true)
          setTimeout(() => setIsSuccess(false), 2500)
        }
      } catch (err) {
        console.error("Failed to add all to cart:", err)
      }
    })
  }

  return (
    <Button
      type="button"
      disabled={itemCount === 0 || isPending}
      onClick={handleAddAll}
      className={`rounded-full transition-all duration-200 px-5 shadow-sm font-medium ${
        isSuccess
          ? "bg-green-600 hover:bg-green-700 text-white"
          : "bg-[#111827] text-white hover:bg-[#111827]/90"
      }`}
    >
      {isPending ? (
        <Loader2 className="size-4 mr-2 animate-spin" />
      ) : isSuccess ? (
        <Check className="size-4 mr-2" />
      ) : (
        <ShoppingBag className="size-4 mr-2" />
      )}
      {isPending ? "Adding All..." : isSuccess ? "Added to Cart!" : "Add All to Cart"}
    </Button>
  )
}
