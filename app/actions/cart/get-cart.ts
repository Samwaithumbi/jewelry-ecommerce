"use server";

import { redis } from "@/lib/redis";
import { cartKey } from "@/lib/cart";
import { Cart } from "@/types/cart";
import { getCartSessionId } from "@/lib/session";

export async function getCart(sessionId?: string): Promise<Cart> {
    const id = sessionId || await getCartSessionId();
    const cart = await redis.get<Cart>(cartKey(id));

    if (!cart) {
        return {
            items: [],
            updatedAt: new Date().toISOString(),
        };
    }

    return cart;
}