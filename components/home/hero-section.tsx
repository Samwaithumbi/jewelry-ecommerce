"use client"

import { useState, useEffect } from "react"
import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=2070&auto=format&fit=crop",
]

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 1*60*1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative w-full h-[85vh] sm:h-[90vh] min-h-[500px] sm:min-h-[600px] overflow-hidden bg-black">
      {/* Background Images with smooth cross-fade */}
      {BACKGROUND_IMAGES.map((img, index) => (
        <div
          key={img}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform ${
            index === currentSlide
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105 pointer-events-none"
          }`}
          style={{ backgroundImage: `url('${img}')` }}
        />
      ))}

      {/* Luxury Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30 z-10" />

      {/* Content (Static) */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-2xl">
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 bg-[#B8860B] text-white px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-POWERED JEWELRY DISCOVERY</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair-display text-white leading-tight mb-4 sm:mb-6">
              Jewelry Crafted for Life&apos;s Most Meaningful Moments
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 font-light leading-relaxed">
              Every piece tells a story. Discover our curated collection of certified, ethically sourced fine jewelry.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
               
                size="lg"
                className="bg-[#B8860B] hover:bg-[#9A7009] text-white px-8 py-6 rounded-full text-base font-medium"
              >
                <Link href="/products" className="flex items-center">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2.5">
        {BACKGROUND_IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? "w-8 h-2.5 bg-[#B8860B]"
                : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
