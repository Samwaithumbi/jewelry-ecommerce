"use client"

import Link from "next/link"
import { Heart, Star } from "lucide-react"
import { useState } from "react"

interface ProductCardProps {
  id: string
  name: string
  category: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  reviews: number
  tag?: "Best Seller" | "New Arrival"
}

export function ProductCard({
  id,
  name,
  category,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  tag,
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)

  return (
    <Link href={`/shop/${id}`} className="group block">
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Tag */}
        {tag && (
          <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-medium text-gray-900 shadow-sm">
            {tag}
          </div>
        )}
        
        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsWishlisted(!isWishlisted)
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`}
          />
        </button>
      </div>
      
      {/* Product Info */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500">{category}</p>
        <h3 className="font-medium text-gray-900 group-hover:text-[#B8860B] transition-colors">
          {name}
        </h3>
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating) ? "fill-[#B8860B] text-[#B8860B]" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">({reviews})</span>
        </div>
        
        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">${price.toLocaleString()}</span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">${originalPrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
