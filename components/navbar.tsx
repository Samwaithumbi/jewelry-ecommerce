"use client"

import Link from "next/link"
import { Heart, Search, User, Sparkle, ChevronDown, Menu, X } from "lucide-react"
import { CartSheet } from "@/components/cart/cart-sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"


export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const handleSearch = () => {
    setSearchOpen(!searchOpen)
    
    
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Brand Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative size-10 rounded-full bg-[#B88E2F] flex items-center justify-center text-white font-bold text-xl ">
              L
            </div>
            <span className="font-serif text-lg  font-medium-bold tracking-wider text-[#111827] md:text-2xl ">
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
          <Button variant="ghost" size="icon" className="text-[#111827] hover:text-[#B88E2F]" onClick={handleSearch}>
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="relative text-[#111827] hover:text-[#B88E2F]">
            <Link href="/wishlist">
              <Heart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B88E2F] text-[10px] text-white">
                2
              </span>
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="text-[#111827] hover:text-[#B88E2F]">
            <Link href="/account">
              <User className="h-5 w-5" />
            </Link>
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

    {searchOpen && (
  <div className="fixed z-50 bg-white mt-10 bg-black/30 backdrop-blur-sm">
    {/* Header */}
    <div className="border-b border-gray-200">
      <div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Search className="h-5 w-5 shrink-0 text-gray-500" />

        <input
          autoFocus
          type="search"
          placeholder="Search rings, necklaces, earrings..."
          className="h-full flex-1 border-0 bg-transparent text-lg text-gray-900 outline-none placeholder:text-gray-400"
        />

        <button
          type="button"
          onClick={() => setSearchOpen(false)}
          aria-label="Close search"
          className="flex size-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
      </div>
    </div>

    {/* Content */}
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      
      {/* Popular searches */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Popular searches
        </h2>

        <div className="flex flex-wrap gap-3">
          {["Rings", "Necklaces", "Earrings", "Bracelets"].map(
            (search) => (
              <button
                key={search}
                type="button"
                className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:border-[#B8860B] hover:text-[#B8860B]"
              >
                {search}
              </button>
            )
          )}
        </div>
      </section>

      {/* Search tools */}
      <section className="mt-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
          Explore
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-5 text-left transition hover:border-[#B8860B] hover:shadow-sm"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-[#F8F1E3]">
              <Search className="h-5 w-5 text-[#B8860B]" />
            </div>

            <div>
              <p className="font-semibold text-gray-900">
                Visual Search
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Find jewelry similar to a photo
              </p>
            </div>
          </button>

          <button
            type="button"
            className="group flex items-center gap-4 rounded-2xl border border-gray-200 p-5 text-left transition hover:border-[#B8860B] hover:shadow-sm"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-[#F8F1E3]">
              <Sparkle className="h-5 w-5 text-[#B8860B]" />
            </div>

            <div>
              <p className="font-semibold text-gray-900">
                AI Stylist
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Get personalized jewelry recommendations
              </p>
            </div>
          </button>
        </div>
      </section>
    </div>
  </div>
)}

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