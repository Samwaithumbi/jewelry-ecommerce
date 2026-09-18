import { getWishlist, WishlistItem } from '@/app/actions/wishlist/get-wishlist';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { WishlistGrid } from '@/app/(shop)/account/wishlist/wishlist-grid';
import { removeFromWishlist } from '@/app/actions/wishlist/remove-from-wishlist';
import { revalidatePath } from 'next/cache';

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/account/wishlist');
  }

  const wishlistItems = await getWishlist();

  async function handleRemove(wishlistId: string) {
    'use server';
    await removeFromWishlist(wishlistId);
    revalidatePath('/account/wishlist');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-[#111827] mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">
          {wishlistItems.length === 0 
            ? 'Your wishlist is empty' 
            : `${wishlistItems.length} item${wishlistItems.length !== 1 ? 's' : ''} saved`}
        </p>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center size-24 bg-[#FCFBF9] rounded-full mb-6">
            <svg className="size-12 text-[#B88E2F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#111827] mb-2">No items in your wishlist</h2>
          <p className="text-muted-foreground mb-6">Save your favorite pieces to view them later</p>
          <a
            href="/products"
            className="inline-flex items-center justify-center h-12 px-8 bg-[#111827] text-white rounded-full hover:bg-[#111827]/90 transition-colors font-medium"
          >
            Browse Products
          </a>
        </div>
      ) : (
        <WishlistGrid items={wishlistItems} onRemove={handleRemove} />
      )}
    </div>
  );
}
