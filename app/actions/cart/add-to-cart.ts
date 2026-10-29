"use server";

import { redis } from "@/lib/redis";
import { cartKey } from "@/lib/cart";
import { CartItem } from "@/types/cart";
import { getCartSessionId } from "@/lib/session";
import { getCart } from "./get-cart";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { productVariants } from "@/drizzle/src/db/schema";
import { eq, asc } from "drizzle-orm";

export async function addToCart(item: CartItem) {
    const quantity = Number(item.qty);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        throw new Error("Invalid quantity. Quantity must be an integer between 1 and 100.");
    }
    item.qty = quantity;

    const sessionId = await getCartSessionId();
    const cart = await getCart(sessionId);

    // Auto-resolve primary/default variant if none was provided (e.g. from Wishlist or quick-add)
    if (!item.variantId && item.productId) {
        try {
            const defaultVariant = await db.query.productVariants.findFirst({
                where: eq(productVariants.productId, item.productId),
                orderBy: [asc(productVariants.size), asc(productVariants.sku)],
            });
            if (defaultVariant) {
                item.variantId = defaultVariant.id;
                if (!item.variantName && defaultVariant.size) {
                    item.variantName = `Size ${defaultVariant.size}`;
                }
            }
        } catch (dbErr) {
            console.warn("Failed to resolve default variant in addToCart:", dbErr);
        }
    }

    // Normalize empty strings/nulls/undefined for consistent matching
    const norm = (val?: string | null) => (val ? val.trim() : "");
    const targetVariantId = norm(item.variantId);
    const targetEngravingText = norm(item.engravingText);
    const targetEngravingFont = norm(item.engravingFont);

    const existingItemIndex = cart.items.findIndex((i) => {
        const isSameProduct = i.productId === item.productId;
        const isSameEngraving =
            norm(i.engravingText) === targetEngravingText &&
            norm(i.engravingFont) === targetEngravingFont;

        if (!isSameProduct || !isSameEngraving) return false;

        const existingVariantId = norm(i.variantId);

        // Exact match on variantId
        if (existingVariantId === targetVariantId) return true;

        // If one of them has no variantId (e.g., added prior without variant), merge with the resolved variant
        if (!existingVariantId || !targetVariantId) return true;

        return false;
    });

    if (existingItemIndex > -1) {
        cart.items[existingItemIndex].qty += item.qty;
        // Upgrade legacy item in cart with the resolved variant info if it lacked one
        if (!cart.items[existingItemIndex].variantId && item.variantId) {
            cart.items[existingItemIndex].variantId = item.variantId;
            if (item.variantName) {
                cart.items[existingItemIndex].variantName = item.variantName;
            }
        }
    } else {
        cart.items.push({
            ...item,
            variantId: item.variantId || undefined,
            engravingText: item.engravingText || undefined,
            engravingFont: item.engravingFont || undefined,
        });
    }

    cart.updatedAt = new Date().toISOString();

    await redis.set(cartKey(sessionId), cart, {
        ex: 60 * 60 * 24 * 7, // 7 days TTL
    });

    revalidatePath("/");
}
