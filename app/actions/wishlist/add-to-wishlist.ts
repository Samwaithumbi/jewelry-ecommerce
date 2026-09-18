"use server"

import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

const sql = neon(process.env.DATABASE_URL!);

export async function addToWishlist(productId: string, variantId?: string, note?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('You must be logged in to add items to your wishlist');
  }

  try {
    // Check if item already exists in wishlist
    const existing = await sql`
      SELECT id FROM wishlists 
      WHERE user_id = ${session.user.id} 
      AND product_id = ${productId}
      AND (variant_id = ${variantId || null} OR (variant_id IS NULL AND ${variantId || null} IS NULL))
    `;

    if (existing.length > 0) {
      return { success: true, message: 'Item already in wishlist' };
    }

    // Add to wishlist
    await sql`
      INSERT INTO wishlists (id, user_id, product_id, variant_id, note)
      VALUES (${randomUUID()}, ${session.user.id}, ${productId}, ${variantId || null}, ${note || null})
    `;

    revalidatePath('/account/wishlist');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to add to wishlist:', error);
    throw new Error('Failed to add item to wishlist');
  }
}
