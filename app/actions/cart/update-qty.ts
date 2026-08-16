"use server";

import { redis } from "@/lib/redis";
import { cartKey } from "@/lib/cart";
import { getCartSessionId } from "@/lib/session";
import { getCart } from "./get-cart";
import { revalidatePath } from "next/cache";

export async function updateQty(productId: string, variantId: string | undefined, qty: number) {
    const sessionId = await getCartSessionId();
    const cart = await getCart(sessionId);

    const existingItemIndex = cart.items.findIndex(
        (i) => i.productId === productId && i.variantId === variantId
    );

    if (existingItemIndex > -1) {
        if (qty <= 0) {
            cart.items = cart.items.filter((_, index) => index !== existingItemIndex);
        } else {
            cart.items[existingItemIndex].qty = qty;
        }
    }

    cart.updatedAt = new Date().toISOString();

    await redis.set(cartKey(sessionId), cart, {
        ex: 60 * 60 * 24 * 7, // 7 days TTL
    });

    revalidatePath("/");
}
