"use server";

import { redis } from "@/lib/redis";
import { cartKey } from "@/lib/cart";
import { getCartSessionId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function clearCart() {
    const sessionId = await getCartSessionId();
    await redis.del(cartKey(sessionId));
    revalidatePath("/");
}
