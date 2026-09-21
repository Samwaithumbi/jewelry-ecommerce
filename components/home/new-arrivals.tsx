"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProductCard } from "./product-card"

const newArrivals = [
  {
    id: "5",
    name: "Vintage Emerald Ring",
    category: "Rings",
    price: 2890,
    image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop",
    rating: 4.6,
    reviews: 45,
    tag: "New Arrival" as const,
  },
  {
    id: "6",
    name: "Gold Chain Bracelet",
    category: "Bracelets",
    price: 650,
    image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=800&auto=format&fit=crop",
    rating: 4.5,
    reviews: 32,
    tag: "New Arrival" as const,
  },
  {
    id: "7",
    name: "Diamond Stud Earrings",
    category: "Earrings",
    price: 1580,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=800&auto=format&fit=crop",
    rating: 4.8,
    reviews: 67,
    tag: "New Arrival" as const,
  },
  {
    id: "8",
    name: "Pearl Choker Necklace",
    category: "Necklaces",
    price: 980,
    image: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?q=80&w=800&auto=format&fit=crop",
    rating: 4.7,
    reviews: 54,
    tag: "New Arrival" as const,
  },
]

export function NewArrivals() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair-display text-gray-900">New Arrivals</h2>
          <Link 
            href="/shop?sort=newest"
            className="flex items-center gap-2 text-[#B8860B] hover:text-[#9A7009] font-medium transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  )
}
