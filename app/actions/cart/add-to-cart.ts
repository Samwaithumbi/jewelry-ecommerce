"use server";

import { redis } from "@/lib/redis";
import { cartKey } from "@/lib/cart";
import { CartItem } from "@/types/cart";
import { getCartSessionId } from "@/lib/session";
import { getCart } from "./get-cart";
import { revalidatePath } from "next/cache";

export async function addToCart(item: CartItem) {
    const sessionId = await getCartSessionId();
    const cart = await getCart(sessionId);

    const existingItemIndex = cart.items.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
    );

    if (existingItemIndex > -1) {
        cart.items[existingItemIndex].qty += item.qty;
    } else {
        cart.items.push(item);
    }

    cart.updatedAt = new Date().toISOString();

    await redis.set(cartKey(sessionId), cart, {
        ex: 60 * 60 * 24 * 7, // 7 days TTL
    });

    revalidatePath("/");
}
