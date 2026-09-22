"use server"

import { db } from "@/lib/db"
import { wishlists, products, productImages, productVariants } from "@/drizzle/src/db/schema"
import { eq, desc } from "drizzle-orm"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  note: string | null;
  createdAt: Date;
  productName: string;
  productSlug: string;
  productImage: string | null;
  productPrice: number;
  variantSize: string | null;
  variantSku: string | null;
  category: string;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  try {
    const items = await db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        variantId: wishlists.variantId,
        note: wishlists.note,
        createdAt: wishlists.createdAt,
        productName: products.name,
        productSlug: products.slug,
        productImage: productImages.url,
        productPrice: products.basePriceCents,
        variantSize: productVariants.size,
        variantSku: productVariants.sku,
        category: products.category,
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .leftJoin(productImages, eq(products.id, productImages.productId))
      .leftJoin(productVariants, eq(wishlists.variantId, productVariants.id))
      .where(eq(wishlists.userId, session.user.id))
      .orderBy(desc(wishlists.createdAt));

    return items as WishlistItem[];
  } catch (error) {
    console.error('Failed to get wishlist:', error);
    return [];
  }
}
