"use server"

import { db } from "@/lib/db"
import { wishlists } from "@/drizzle/src/db/schema"
import { eq, and, or, isNull } from "drizzle-orm"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function addToWishlist(productId: string, variantId?: string, note?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('You must be logged in to add items to your wishlist');
  }

  try {
    // Check if item already exists in wishlist
    const existing = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, session.user.id),
          eq(wishlists.productId, productId),
          variantId
            ? eq(wishlists.variantId, variantId)
            : isNull(wishlists.variantId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return { success: true, message: 'Item already in wishlist' };
    }

    // Add to wishlist
    await db.insert(wishlists).values({
      userId: session.user.id,
      productId,
      variantId: variantId || null,
      note: note || null,
    });

    revalidatePath('/account/wishlist');
    revalidatePath('/wishlist');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to add to wishlist:', error);
    throw new Error('Failed to add item to wishlist');
  }
}
