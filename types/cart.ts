export interface CartItem {
    productId: string;
    variantId?: string; // Optional if some products don't have variants
    name: string;
    variantName?: string; // e.g., "14k Gold - Size 6"
    image: string;
    priceAtAdd: number; // Storing price at add in cents
    qty: number;
    engravingText?: string;
    engravingFont?: string;
    engravingPriceCents?: number;
}

export interface Cart {
    items: CartItem[];
    updatedAt: string;
}
