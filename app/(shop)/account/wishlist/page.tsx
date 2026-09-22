import { getWishlist } from "@/app/actions/wishlist/get-wishlist"
import { WishlistGrid } from "@/app/(shop)/account/wishlist/wishlist-grid"
import { removeFromWishlist } from "@/app/actions/wishlist/remove-from-wishlist"
import { Button } from "@/components/ui/button"
import { Share2, ShoppingBag } from "lucide-react"
import { revalidatePath } from "next/cache"

export default async function AccountWishlist() {
  const wishlistItems = await getWishlist()

  async function handleRemove(wishlistId: string) {
    "use server"
    await removeFromWishlist(wishlistId)
    revalidatePath("/account/wishlist")
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] mb-1">My Wishlist</h1>
          <p className="text-muted-foreground">
            {wishlistItems.length} saved {wishlistItems.length === 1 ? 'piece' : 'pieces'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-primary/20 hover:bg-primary/5"
          >
            <Share2 className="size-4 mr-2" />
            Share Wishlist
          </Button>
          <Button
            className="bg-[#111827] text-white hover:bg-[#111827]/90"
          >
            <ShoppingBag className="size-4 mr-2" />
            Add All to Cart
          </Button>
        </div>
      </div>

      {/* Gift Planning Section */}
      <div className="bg-gradient-to-r from-[#B88E2F]/10 to-[#B88E2F]/5 rounded-2xl p-6 mb-8 border border-[#B88E2F]/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-[#B88E2F] tracking-wider mb-1">GIFT PLANNING</p>
            <h2 className="text-lg font-semibold text-[#111827]">Share your wishlist with loved ones</h2>
          </div>
          <Button
            variant="outline"
            className="border-[#B88E2F] text-[#B88E2F] hover:bg-[#B88E2F] hover:text-white"
          >
            Create Gift Registry
          </Button>
        </div>
      </div>

      {/* Wishlist Grid */}
      {wishlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
          <div className="flex size-20 items-center justify-center rounded-full bg-primary/5">
            <ShoppingBag className="size-10 text-muted-foreground/50" />
          </div>
          <h2 className="text-xl font-semibold text-[#111827]">Your wishlist is empty</h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Start adding your favorite pieces to create your perfect collection.
          </p>
          <a
            href="/products"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#111827]/90 transition-colors"
          >
            Browse Products
          </a>
        </div>
      ) : (
        <WishlistGrid items={wishlistItems} onRemove={handleRemove} />
      )}
    </div>
  )
}
