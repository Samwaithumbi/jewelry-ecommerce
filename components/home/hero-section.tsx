"use client"

import { Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative w-full h-[90vh] min-h-[600px] overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10" />
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=2070&auto=format&fit=crop')",
        }}
      />
      
      {/* Content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-2xl">
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 bg-[#B8860B] text-white px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>AI-POWERED JEWELRY DISCOVERY</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair-display text-white leading-tight mb-6">
              Jewelry Crafted for Life's Most Meaningful Moments
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-200 mb-8 font-light leading-relaxed">
              Every piece tells a story. Discover our curated collection of certified, ethically sourced fine jewelry.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-[#B8860B] hover:bg-[#9A7009] text-white px-8 py-6 rounded-full text-base font-medium"
              >
                <Link href="/products" className="flex items-center">
                  Shop Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 px-8 py-6 rounded-full text-base font-medium backdrop-blur-sm"
                size="lg"
              >
                <Sparkles className="mr-2 w-5 h-5" />
                Book AI Stylist
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Carousel Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        <div className="w-3 h-3 rounded-full bg-[#B8860B]" />
        <div className="w-3 h-3 rounded-full bg-white/40" />
        <div className="w-3 h-3 rounded-full bg-white/40" />
      </div>
    </section>
  )
}
