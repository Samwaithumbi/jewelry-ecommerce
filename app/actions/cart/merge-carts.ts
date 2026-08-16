"use server";

import { redis } from "@/lib/redis";
import { cartKey } from "@/lib/cart";
import { getCart } from "./get-cart";

export async function mergeCarts(guestSessionId: string, userId: string) {
    if (!guestSessionId || !userId) return;

    const guestCart = await getCart(guestSessionId);
    if (!guestCart.items.length) {
        // Nothing to merge
        return;
    }

    const userCart = await getCart(userId);

    // Merge items
    guestCart.items.forEach((guestItem) => {
        const existingItemIndex = userCart.items.findIndex(
            (i) => i.productId === guestItem.productId && i.variantId === guestItem.variantId
        );

        if (existingItemIndex > -1) {
            // Keep the higher quantity
            userCart.items[existingItemIndex].qty = Math.max(
                userCart.items[existingItemIndex].qty,
                guestItem.qty
            );
        } else {
            userCart.items.push(guestItem);
        }
    });

    userCart.updatedAt = new Date().toISOString();

    // Save merged cart
    await redis.set(cartKey(userId), userCart, {
        ex: 60 * 60 * 24 * 7,
    });

    // Delete guest cart
    await redis.del(cartKey(guestSessionId));
}
