"use client";

import { useState, useEffect, useTransition } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, Loader2 } from "lucide-react";
import { Cart } from "@/types/cart";
import { getCart } from "@/app/actions/cart/get-cart";
import { updateQty } from "@/app/actions/cart/update-qty";
import { removeFromCart } from "@/app/actions/cart/remove-from-cart";
import Image from "next/image";

export function CartButton({ onClick }: { onClick?: () => void }) {
    const [cartItemCount, setCartItemCount] = useState(0);

    useEffect(() => {
        const fetchCartCount = async () => {
            const cart = await getCart();
            const count = cart.items.reduce((acc, item) => acc + item.qty, 0);
            setCartItemCount(count);
        };

        fetchCartCount();

        const handleCartUpdate = () => {
            fetchCartCount();
        };

        window.addEventListener('cart-update', handleCartUpdate);
        return () => window.removeEventListener('cart-update', handleCartUpdate);
    }, []);

    return (
        <Button variant="ghost" size="icon" className="relative text-[#111827] hover:text-[#B88E2F]" onClick={onClick}>
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B88E2F] text-[10px] text-white">
                    {cartItemCount}
                </span>
            )}
        </Button>
    );
}

export function CartSheet() {
    const [cart, setCart] = useState<Cart | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const fetchCart = async () => {
        const fetchedCart = await getCart();
        setCart(fetchedCart);
        // Dispatch event to notify other components of cart changes
        window.dispatchEvent(new Event('cart-update'));
    };

    useEffect(() => {
        fetchCart();
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchCart();
        }
    }, [isOpen]);

    const handleUpdateQty = (productId: string, variantId: string | undefined, qty: number) => {
        startTransition(async () => {
            await updateQty(productId, variantId, qty);
            await fetchCart();
        });
    };

    const handleRemove = (productId: string, variantId: string | undefined) => {
        startTransition(async () => {
            await removeFromCart(productId, variantId);
            await fetchCart();
        });
    };

    const totalItems = cart?.items.reduce((acc, item) => acc + item.qty, 0) || 0;
    const subtotal = cart?.items.reduce((acc, item) => acc + (item.priceAtAdd * item.qty), 0) || 0;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <CartButton onClick={() => setIsOpen(true)} />
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Your Cart ({totalItems})</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                    {!cart || cart.items.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-2">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                            <p className="text-lg font-medium">Your cart is empty</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cart.items.map((item, i) => (
                                <div key={`${item.productId}-${item.variantId || i}`} className="flex items-center space-x-4">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
                                        {item.image && (
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col">
                                        <span className="font-medium line-clamp-1">{item.name}</span>
                                        {item.variantName && (
                                            <span className="text-sm text-muted-foreground">{item.variantName}</span>
                                        )}
                                        {item.engravingText && (
                                            <span className="text-sm text-muted-foreground">Engraving: {item.engravingText}</span>
                                        )}
                                        <div className="mt-2 flex items-center space-x-2">
                                            <div className="flex items-center space-x-1 rounded-md border p-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    disabled={isPending || item.qty <= 1}
                                                    onClick={() => handleUpdateQty(item.productId, item.variantId, item.qty - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-6 text-center text-sm">{item.qty}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    disabled={isPending}
                                                    onClick={() => handleUpdateQty(item.productId, item.variantId, item.qty + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive ml-auto"
                                                disabled={isPending}
                                                onClick={() => handleRemove(item.productId, item.variantId)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="text-right font-medium self-start">
                                        ${(item.priceAtAdd / 100).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {cart && cart.items.length > 0 && (
                    <div className="border-t pt-4 mt-auto">
                        <div className="mb-4 flex items-center justify-between font-medium text-lg">
                            <span>Subtotal</span>
                            <span>${(subtotal / 100).toFixed(2)}</span>
                        </div>
                        <Button className="w-full" size="lg" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Checkout
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
