"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShoppingCart, Heart, Plus, Minus, Loader2, Type } from "lucide-react"
import { addToCart } from "@/app/actions/cart/add-to-cart"
import { CartItem } from "@/types/cart"
import { useTransition } from "react"
import { EngravingPreview } from "./engraving-preview"

interface Variant {
  id: string
  sku: string
  size: string | null
  stockQty: number
  priceAdjustCents: number | null
}

interface ProductClientProps {
  productId: string
  productName: string
  productImage: string
  basePriceCents: number
  metalPriceCents: number // metalPricePerGram * weight
  variants: Variant[]
  category: string
}

export function ProductClient({
  productId,
  productName,
  productImage,
  basePriceCents,
  metalPriceCents,
  variants,
  category,
}: ProductClientProps) {
  // Select first available variant or first variant if all out of stock
  const initialVariant = variants.find(v => v.stockQty > 0) || variants[0]
  const [selectedVariant, setSelectedVariant] = React.useState<Variant | undefined>(initialVariant)
  const [quantity, setQuantity] = React.useState(1)
  const [isPending, startTransition] = useTransition()
  
  // Engraving state
  const [engravingText, setEngravingText] = React.useState("")
  const [engravingFont, setEngravingFont] = React.useState<"script" | "block" | "classic" | "">("")
  
  const ENGRAVING_FONTS = {
    script: { name: "Script", cssFont: "'Great Vibes', cursive" },
    block: { name: "Block", cssFont: "'Oswald', sans-serif" },
    classic: { name: "Classic", cssFont: "'Playfair Display', serif" }
  }
  
  const ENGRAVING_PRICE_CENTS = 1500 // $15

  const hasSizes = variants.some(v => v.size)
  const currentVariant = selectedVariant || initialVariant
  
  // Calculate total price including engraving
  const variantAdjust = currentVariant?.priceAdjustCents || 0
  const engravingPrice = (engravingText && engravingFont) ? ENGRAVING_PRICE_CENTS : 0
  const totalPrice = (basePriceCents + metalPriceCents + variantAdjust + engravingPrice) * quantity
  
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  })

  const isOutOfStock = currentVariant && currentVariant.stockQty <= 0

  const handleAddToCart = () => {
    if (!currentVariant || isOutOfStock) return

    const cartItem: CartItem = {
      productId,
      variantId: currentVariant.id,
      name: productName,
      variantName: currentVariant.size ? `${category === "ring" ? "Size" : "Size"} ${currentVariant.size}` : undefined,
      image: productImage,
      priceAtAdd: basePriceCents + metalPriceCents + (currentVariant.priceAdjustCents || 0) + engravingPrice,
      qty: quantity,
      engravingText: engravingText || undefined,
      engravingFont: engravingFont || undefined,
      engravingPriceCents: engravingPrice || undefined,
    }

    startTransition(async () => {
      await addToCart(cartItem)
      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new Event('cart-update'))
    })
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Price */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-serif font-semibold text-[#111827]">
          {formatter.format(totalPrice / 100)}
        </span>
        {quantity > 1 && (
          <span className="text-muted-foreground pb-1">
            ({formatter.format((totalPrice / quantity) / 100)} each)
          </span>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Engraving Section - Only for rings */}
        {category === "ring" && (
          <div className="space-y-4 p-4 bg-[#FCFBF9] border border-primary/10 rounded-xl">
            <div className="flex items-center gap-2">
              <Type className="size-4 text-[#B88E2F]" />
              <label className="text-sm font-medium text-[#111827]">
                Personalize with Engraving
              </label>
            </div>
            
            {/* Text Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="engraving-text" className="text-xs">Engraving Text</Label>
                <span className={`text-xs ${engravingText.length > 20 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {engravingText.length}/20
                </span>
              </div>
              <Input
                id="engraving-text"
                placeholder="Enter text (max 20 characters)"
                value={engravingText}
                onChange={(e) => setEngravingText(e.target.value.slice(0, 20))}
                maxLength={20}
                className="border-primary/20"
              />
            </div>

            {/* Font Selector */}
            {engravingText && (
              <div className="space-y-2">
                <Label className="text-xs">Font Style</Label>
                <div className="flex gap-2">
                  {Object.entries(ENGRAVING_FONTS).map(([key, font]) => (
                    <button
                      key={key}
                      onClick={() => setEngravingFont(key as "script" | "block" | "classic")}
                      className={cn(
                        "flex-1 h-12 rounded-lg border-2 transition-all duration-200",
                        engravingFont === key
                          ? "border-[#B88E2F] bg-[#B88E2F]/10"
                          : "border-primary/20 bg-white hover:border-[#B88E2F]/50"
                      )}
                      style={{ fontFamily: font.cssFont }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {engravingText && engravingFont && (
              <EngravingPreview text={engravingText} font={engravingFont} />
            )}

            {/* Price Display */}
            {engravingPrice > 0 && (
              <div className="flex items-center justify-between text-sm pt-2 border-t border-primary/10">
                <span className="text-muted-foreground">Engraving</span>
                <span className="font-medium text-[#111827]">+${(engravingPrice / 100).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Variants Selector */}
        {hasSizes && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#111827]">
                {category === "ring" ? "Ring Size" : "Size"}
              </label>
              {category === "ring" && (
                <div id="size-guide-portal-target" /> 
                // We'll place SizeGuideDialog in page.tsx and use absolute/relative layout, 
                // or just render it next to it in page.tsx. To keep things clean, we will render
                // the Size Guide button in page.tsx next to the Client component, or pass it as a child.
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const isSelected = selectedVariant?.id === variant.id
                const isOOS = variant.stockQty <= 0

                return (
                  <button
                    key={variant.id}
                    onClick={() => {
                      if (!isOOS) {
                        setSelectedVariant(variant)
                        setQuantity(1)
                      }
                    }}
                    disabled={isOOS}
                    className={cn(
                      "min-w-[3rem] h-10 px-3 rounded-xl border flex items-center justify-center text-sm font-medium transition-all duration-200",
                      isSelected
                        ? "border-[#F59E0B] bg-[#F59E0B]/10 text-[#B88E2F]"
                        : isOOS
                        ? "border-primary/10 bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed"
                        : "border-primary/20 bg-white hover:border-[#F59E0B] hover:text-[#B88E2F]"
                    )}
                  >
                    {variant.size || variant.sku}
                  </button>
                )
              })}
            </div>
            
            {/* Stock status */}
            <div className="text-sm font-medium">
              {isOutOfStock ? (
                <span className="text-destructive">Out of Stock</span>
              ) : currentVariant && currentVariant.stockQty < 5 ? (
                <span className="text-[#F59E0B]">Only {currentVariant.stockQty} left in stock</span>
              ) : (
                <span className="text-green-600">In Stock — Ships in 3-5 business days</span>
              )}
            </div>
          </div>
        )}

        {/* Quantity & Actions */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-primary/20 rounded-full h-12 bg-white">
              <button 
                className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={isOutOfStock || quantity <= 1}
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center font-medium text-sm">
                {quantity}
              </span>
              <button 
                className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-50"
                onClick={() => setQuantity(Math.min(currentVariant?.stockQty || 1, quantity + 1))}
                disabled={isOutOfStock || (currentVariant && quantity >= currentVariant.stockQty)}
              >
                <Plus className="size-4" />
              </button>
            </div>
            
            <Button
              className="flex-1 h-12 rounded-full bg-[#111827] text-white hover:bg-[#111827]/90 shadow-sm text-base font-semibold"
              disabled={isOutOfStock || isPending}
              onClick={handleAddToCart}
            >
              {isPending ? (
                <Loader2 className="size-5 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="size-5 mr-2" />
              )}
              Add to Cart
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="size-12 rounded-full border-primary/20 bg-white text-muted-foreground hover:text-red-500 hover:border-red-200 transition-colors"
            >
              <Heart className="size-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
