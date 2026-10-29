"use server";

import { redis } from "@/lib/redis";
import { cartKey } from "@/lib/cart";
import { getCartSessionId } from "@/lib/session";
import { getCart } from "./get-cart";
import { revalidatePath } from "next/cache";

export async function updateQty(productId: string, variantId: string | undefined, qty: number) {
    const rawQty = Number(qty);
    if (!Number.isInteger(rawQty)) {
        throw new Error("Quantity must be a valid integer");
    }
    const validatedQty = Math.min(100, rawQty);

    const sessionId = await getCartSessionId();
    const cart = await getCart(sessionId);

    const norm = (val?: string | null) => (val ? val.trim() : "");
    const targetVariantId = norm(variantId);

    const existingItemIndex = cart.items.findIndex(
        (i) => i.productId === productId && norm(i.variantId) === targetVariantId
    );

    if (existingItemIndex > -1) {
        if (validatedQty <= 0) {
            cart.items = cart.items.filter((_, index) => index !== existingItemIndex);
        } else {
            cart.items[existingItemIndex].qty = validatedQty;
        }
    }

    cart.updatedAt = new Date().toISOString();

    await redis.set(cartKey(sessionId), cart, {
        ex: 60 * 60 * 24 * 7, // 7 days TTL
    });

    revalidatePath("/");
}
