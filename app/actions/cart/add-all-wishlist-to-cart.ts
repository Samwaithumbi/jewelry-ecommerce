"use server"

import { addToCart } from "./add-to-cart"
import { CartItem } from "@/types/cart"
import { db } from "@/lib/db"
import { wishlists, products, productImages, productVariants } from "@/drizzle/src/db/schema"
import { eq, and } from "drizzle-orm"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { revalidatePath } from "next/cache"

export async function addAllWishlistToCart(): Promise<{ success: boolean; count: number }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("You must be logged in to add wishlist items to cart")
  }

  const items = await db
    .select({
      id: wishlists.id,
      productId: wishlists.productId,
      variantId: wishlists.variantId,
      productName: products.name,
      productImage: productImages.url,
      productPrice: products.basePriceCents,
      variantSize: productVariants.size,
      variantPriceAdjust: productVariants.priceAdjustCents,
    })
    .from(wishlists)
    .innerJoin(products, eq(wishlists.productId, products.id))
    .leftJoin(
      productImages,
      and(eq(products.id, productImages.productId), eq(productImages.isPrimary, true))
    )
    .leftJoin(productVariants, eq(wishlists.variantId, productVariants.id))
    .where(eq(wishlists.userId, session.user.id))

  if (items.length === 0) {
    return { success: true, count: 0 }
  }

  for (const item of items) {
    const unitPrice = item.productPrice + (item.variantPriceAdjust || 0)
    const cartItem: CartItem = {
      productId: item.productId,
      variantId: item.variantId || undefined,
      name: item.productName,
      variantName: item.variantSize ? `Size ${item.variantSize}` : undefined,
      image: item.productImage || "/placeholder-jewelry.jpg",
      priceAtAdd: unitPrice,
      qty: 1,
    }
    await addToCart(cartItem)
  }

  revalidatePath("/wishlist")
  revalidatePath("/cart")
  revalidatePath("/")

  return { success: true, count: items.length }
}
