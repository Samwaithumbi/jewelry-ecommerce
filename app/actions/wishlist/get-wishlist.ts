"use server"

import { neon } from '@neondatabase/serverless';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const sql = neon(process.env.DATABASE_URL!);

export interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  note: string | null;
  createdAt: string;
  productName: string;
  productSlug: string;
  productImage: string;
  productPrice: number;
  variantSize: string | null;
  variantSku: string | null;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return [];
  }

  try {
    const items = await sql`
      SELECT 
        w.id,
        w.product_id,
        w.variant_id,
        w.note,
        w.created_at,
        p.name as product_name,
        p.slug as product_slug,
        pi.url as product_image,
        p.base_price_cents as product_price,
        v.size as variant_size,
        v.sku as variant_sku
      FROM wishlists w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.position = 0
      LEFT JOIN product_variants v ON w.variant_id = v.id
      WHERE w.user_id = ${session.user.id}
      ORDER BY w.created_at DESC
    `;

    return items as WishlistItem[];
  } catch (error) {
    console.error('Failed to get wishlist:', error);
    return [];
  }
}
