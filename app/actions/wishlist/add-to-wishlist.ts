"use server"

import { db } from "@/lib/db"
import { wishlists, productVariants } from "@/drizzle/src/db/schema"
import { eq, and, or, isNull, asc } from "drizzle-orm"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function addToWishlist(productId: string, variantId?: string, note?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      success: false,
      message: 'You must be logged in to add items to your wishlist',
    }
  }

  try {
    let targetVariantId = variantId;

    // If variantId is not specified (e.g. added from product card), resolve default active variant
    if (!targetVariantId) {
      const defaultVariant = await db.query.productVariants.findFirst({
        where: eq(productVariants.productId, productId),
        orderBy: [asc(productVariants.size), asc(productVariants.sku)],
      });
      if (defaultVariant) {
        targetVariantId = defaultVariant.id;
      }
    }

    // Check if item already exists in wishlist
    const existing = await db
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, session.user.id),
          eq(wishlists.productId, productId),
          targetVariantId
            ? or(eq(wishlists.variantId, targetVariantId), isNull(wishlists.variantId))
            : isNull(wishlists.variantId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // If existing item was null variant, upgrade to the concrete variant
      if (targetVariantId) {
        await db
          .update(wishlists)
          .set({ variantId: targetVariantId })
          .where(eq(wishlists.id, existing[0].id));
      }
      return { success: true, message: 'Item already in wishlist' };
    }

    // Add to wishlist
    await db.insert(wishlists).values({
      userId: session.user.id,
      productId,
      variantId: targetVariantId || null,
      note: note || null,
    });

    revalidatePath('/account/wishlist');
    revalidatePath('/wishlist');
    revalidatePath('/');

    return { success: true, message: 'Added to wishlist' };
  } catch (error) {
    console.error('Failed to add to wishlist:', error);
    throw new Error('Failed to add item to wishlist');
  }
}
