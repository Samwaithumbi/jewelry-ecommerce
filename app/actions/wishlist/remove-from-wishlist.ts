"use server"

import { neon } from '@neondatabase/serverless';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { revalidatePath } from 'next/cache';

const sql = neon(process.env.DATABASE_URL!);

export async function removeFromWishlist(wishlistId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('You must be logged in to remove items from your wishlist');
  }

  try {
    await sql`
      DELETE FROM wishlists 
      WHERE id = ${wishlistId} 
      AND user_id = ${session.user.id}
    `;

    revalidatePath('/account/wishlist');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Failed to remove from wishlist:', error);
    throw new Error('Failed to remove item from wishlist');
  }
}
