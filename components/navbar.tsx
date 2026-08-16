"use client"

import Link from "next/link"
import { Heart, Search, User, Sparkle, ChevronDown, Menu, X } from "lucide-react"
import { CartSheet } from "@/components/cart/cart-sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative size-10 rounded-full bg-[#B88E2F] flex items-center justify-center text-white font-bold text-xl">
              L
            </div>
            <span className="font-serif text-xl font-bold tracking-wider text-[#111827] hidden sm:block">
              LUMINA JEWELS
            </span>
          </Link>
        </div>

        {/* Primary Navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          <div className="relative group">
            <button className="flex items-center text-sm font-medium text-[#111827] transition-colors hover:text-[#B88E2F]">
              Shop
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-2">
                <Link href="/products" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  All Products
                </Link>
                <Link href="/products?category=necklaces" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Necklaces
                </Link>
                <Link href="/products?category=rings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Rings
                </Link>
                <Link href="/products?category=earrings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Earrings
                </Link>
                <Link href="/products?category=bracelets" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Bracelets
                </Link>
              </div>
            </div>
          </div>

          <div className="relative group">
            <button className="flex items-center text-sm font-medium text-[#111827] transition-colors hover:text-[#B88E2F]">
              Collections
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="py-2">
                <Link href="/collections/best-sellers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Best Sellers
                </Link>
                <Link href="/collections/new-arrivals" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  New Arrivals
                </Link>
                <Link href="/collections/limited-edition" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Limited Edition
                </Link>
                <Link href="/collections/wedding" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Wedding Collection
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/custom-jewelry"
            className="text-sm font-medium text-[#111827] transition-colors hover:text-[#B88E2F]"
          >
            Custom Jewelry
          </Link>

          <Link
            href="/ai-stylist"
            className="flex items-center text-sm font-medium text-[#111827] transition-colors hover:text-[#B88E2F]"
          >
            AI Stylist
            <Sparkle className="ml-1 h-4 w-4 text-[#B88E2F]" />
          </Link>
        </nav>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-[#111827] hover:text-[#B88E2F]">
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="relative text-[#111827] hover:text-[#B88E2F]">
            <Heart className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B88E2F] text-[10px] text-white">
              2
            </span>
          </Button>

          <Button variant="ghost" size="icon" className="text-[#111827] hover:text-[#B88E2F]">
            <User className="h-5 w-5" />
          </Button>

          <CartSheet />

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-[#111827] hover:text-[#B88E2F]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white py-4">
          <nav className="container flex flex-col gap-4">
            <Link href="/products" className="text-sm font-medium text-[#111827] hover:text-[#B88E2F]">
              Shop
            </Link>
            <Link href="/collections" className="text-sm font-medium text-[#111827] hover:text-[#B88E2F]">
              Collections
            </Link>
            <Link href="/custom-jewelry" className="text-sm font-medium text-[#111827] hover:text-[#B88E2F]">
              Custom Jewelry
            </Link>
            <Link href="/ai-stylist" className="flex items-center text-sm font-medium text-[#111827] hover:text-[#B88E2F]">
              AI Stylist
              <Sparkle className="ml-1 h-4 w-4 text-[#B88E2F]" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}