"use client"

import Link from "next/link"
import { Heart, User, Sparkle, ChevronDown, Menu, X, Search } from "lucide-react"
import { CartSheet } from "@/components/cart/cart-sheet"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { getWishlistCount } from "@/app/actions/wishlist/get-wishlist-count"
import { SearchBar } from "@/components/search/search-bar"

interface NavbarProps {
  user?:{
    name?:string | null
    email?:string | null
    image?:string | null
  } | null
}


export function  Navbar({user}:NavbarProps) {
  const pathname = usePathname()
  const isProductsPage = pathname ? pathname.startsWith("/products") : false
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)

  useEffect(() => {
    const updateCount = () => {
      getWishlistCount().then(setWishlistCount)
    }

    updateCount()
    window.addEventListener("wishlist-update", updateCount)

    return () => {
      window.removeEventListener("wishlist-update", updateCount)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between gap-2 sm:gap-4">
        {/* Logo and Brand Name */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="relative size-7 rounded-full bg-[#B88E2F] flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-xs">
              L
            </div>
            <span className="font-serif text-base sm:text-lg md:text-2xl font-bold tracking-wider text-[#111827] truncate">
              LUMINA
            </span>
          </Link>
        </div>

        {/* Primary Navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 shrink-0">
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
                <Link href="/products?category=necklace" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Necklaces
                </Link>
                <Link href="/products?category=ring" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Rings
                </Link>
                <Link href="/products?category=earring" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
                  Earrings
                </Link>
                <Link href="/products?category=bracelet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-[#B88E2F]">
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

          
        </nav>

        {/* Global Live SearchBar - Desktop: Always Open */}
        <div className="hidden md:block flex-1 max-w-sm lg:max-w-md xl:max-w-lg mx-2 lg:mx-4">
          <SearchBar />
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile Search Toggle (hidden when already open on products pages) */}
          {!isProductsPage && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[#111827] hover:text-[#B88E2F]"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          <Button variant="ghost" size="icon" className="relative text-[#111827] hover:text-[#B88E2F]">
            <Link href="/account/wishlist">
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#B88E2F] text-[10px] text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </Button>
           

           {user?.image? (
            <Button variant="ghost" size="icon" className="text-[#111827] hover:text-[#B88E2F]">
            <Link href="/account">
              <img src={user.image} alt="" className="rounded-full object-cover w-8 h-8"/>
            </Link>
          </Button>
           ):(
            <Button variant="ghost" size="icon" className="text-[#111827] hover:text-[#B88E2F]">
            <Link href="/account">
              <User className="h-5 w-5" />
            </Link>
          </Button>
           
          )}

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

      {/* Mobile Search Bar - Always Open on Products & Product Detail Pages, or when toggled */}
      {(mobileSearchOpen || isProductsPage) && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur px-4 py-2.5 shadow-xs animate-in slide-in-from-top-1 duration-150">
          <SearchBar onSelectResult={() => setMobileSearchOpen(false)} />
        </div>
      )}


    
    {/* Mobile Menu */}
    {mobileMenuOpen && (
      <>
        {/* Backdrop: tapping outside closes the menu */}
        <button
          type="button"
          aria-label="Close mobile menu"
          className="fixed inset-0 top-16 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Menu panel */}
        <div className="absolute left-0 right-0 top-full z-50 border-t bg-white py-5 shadow-xl lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="container mx-auto px-6 flex flex-col gap-3">
            <div className="pt-1 pb-2">
              <SearchBar onSelectResult={() => setMobileMenuOpen(false)} />
            </div>
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-[#111827] hover:text-[#B88E2F] py-2 border-b border-gray-100"
            >
              Shop All Jewelry
            </Link>
            <div className="grid grid-cols-2 gap-2 pl-2 pb-2 border-b border-gray-100">
              <Link
                href="/products?category=ring"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-gray-600 hover:text-[#B88E2F] py-1"
              >
                Rings
              </Link>
              <Link
                href="/products?category=necklace"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-gray-600 hover:text-[#B88E2F] py-1"
              >
                Necklaces
              </Link>
              <Link
                href="/products?category=earring"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-gray-600 hover:text-[#B88E2F] py-1"
              >
                Earrings
              </Link>
              <Link
                href="/products?category=bracelet"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-gray-600 hover:text-[#B88E2F] py-1"
              >
                Bracelets
              </Link>
            </div>

            <Link
              href="/collections/best-sellers"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-[#111827] hover:text-[#B88E2F] py-2 border-b border-gray-100"
            >
              Collections
            </Link>

            <Link
              href="/custom-jewelry"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-semibold text-[#111827] hover:text-[#B88E2F] py-2 border-b border-gray-100"
            >
              Custom Jewelry
            </Link>

            <Link
              href="/ai-stylist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center text-base font-semibold text-[#111827] hover:text-[#B88E2F] py-2"
            >
              AI Stylist
              <Sparkle className="ml-1.5 h-4 w-4 text-[#B88E2F]" />
            </Link>
          </nav>
        </div>
      </>
    )}

   </header>
  )
}