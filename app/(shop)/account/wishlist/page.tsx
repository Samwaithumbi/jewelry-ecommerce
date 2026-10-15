import { getWishlist } from "@/app/actions/wishlist/get-wishlist"
import { WishlistGrid } from "@/components/wishlist/wishlist-grid"
import { removeFromWishlist } from "@/app/actions/wishlist/remove-from-wishlist"
import { AddAllToCartButton } from "@/components/wishlist/add-all-button"
import { Share2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
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
          
          <AddAllToCartButton itemCount={wishlistItems.length} />
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
