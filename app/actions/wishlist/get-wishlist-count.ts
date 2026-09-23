"use server"

import { db } from "@/lib/db"
import { wishlists } from "@/drizzle/src/db/schema"
import { eq, count } from "drizzle-orm"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getWishlistCount(): Promise<number> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return 0;
  }

  try {
    const result = await db
      .select({ count: count() })
      .from(wishlists)
      .where(eq(wishlists.userId, session.user.id));

    return result[0]?.count || 0;
  } catch (error) {
    console.error('Failed to get wishlist count:', error);
    return 0;
  }
}
