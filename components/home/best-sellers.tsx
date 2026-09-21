"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProductCard } from "./product-card"

const bestSellers = [
  {
    id: "1",
    name: "Eternal Rose Diamond Ring",
    category: "Rings",
    price: 4850,
    originalPrice: 5200,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
    rating: 4.9,
    reviews: 234,
    tag: "Best Seller" as const,
  },
  {
    id: "2",
    name: "Pearl Drop Earrings",
    category: "Earrings",
    price: 890,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
    rating: 4.8,
    reviews: 189,
    tag: "Best Seller" as const,
  },
  {
    id: "3",
    name: "Sapphire Pendant Necklace",
    category: "Necklaces",
    price: 1250,
    originalPrice: 1450,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop",
    rating: 4.7,
    reviews: 156,
    tag: "Best Seller" as const,
  },
  {
    id: "4",
    name: "Diamond Tennis Bracelet",
    category: "Bracelets",
    price: 3200,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop",
    rating: 4.9,
    reviews: 312,
    tag: "Best Seller" as const,
  },
]

export function BestSellers() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair-display text-gray-900">Best Sellers</h2>
          <Link 
            href="/shop?sort=bestsellers"
            className="flex items-center gap-2 text-[#B8860B] hover:text-[#9A7009] font-medium transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  )
}
