"use server"

import { db } from "@/lib/db"
import { wishlists } from "@/drizzle/src/db/schema"
import { eq, and } from "drizzle-orm"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

export async function removeFromWishlist(wishlistId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('You must be logged in to remove items from your wishlist');
  }

  try {
    await db
      .delete(wishlists)
      .where(and(
        eq(wishlists.id, wishlistId),
        eq(wishlists.userId, session.user.id)
      ));

    revalidatePath('/wishlist');
    revalidatePath('/account/wishlist');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to remove from wishlist:', error);
    throw new Error('Failed to remove item from wishlist');
  }
}
