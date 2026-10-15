"use server";

import { redis } from "@/lib/redis";
import { cartKey } from "@/lib/cart";
import { getCartSessionId } from "@/lib/session";
import { getCart } from "./get-cart";
import { revalidatePath } from "next/cache";

export async function removeFromCart(productId: string, variantId?: string) {
    const sessionId = await getCartSessionId();
    const cart = await getCart(sessionId);

    const norm = (val?: string | null) => (val ? val.trim() : "");
    const targetVariantId = norm(variantId);

    cart.items = cart.items.filter(
        (i) => !(i.productId === productId && norm(i.variantId) === targetVariantId)
    );

    cart.updatedAt = new Date().toISOString();

    await redis.set(cartKey(sessionId), cart, {
        ex: 60 * 60 * 24 * 7, // 7 days TTL
    });

    revalidatePath("/");
}
