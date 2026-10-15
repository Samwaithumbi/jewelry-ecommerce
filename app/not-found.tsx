import Link from "next/link"
import { Gem, ArrowRight, Home, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        {/* Decorative Gem Icon */}
        <div className="relative mb-6">
          <div className="size-20 rounded-3xl bg-gradient-to-br from-[#B88E2F]/20 via-[#B88E2F]/10 to-transparent flex items-center justify-center border border-[#B88E2F]/30 shadow-xs">
            <Gem className="size-10 text-[#B88E2F]" />
          </div>
          <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[#B88E2F] text-white">
            <Sparkles className="size-3" />
          </span>
        </div>

        <span className="text-xs font-semibold tracking-widest text-[#B88E2F] uppercase mb-2">
          404 — Piece Not Found
        </span>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#111827] tracking-tight mb-3">
          Like a Rare Gemstone, This Page Cannot Be Found
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          The jewelry piece or page you are looking for might have been moved, renamed, or is no longer part of our collection.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Link href="/products" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-[#111827] hover:bg-[#111827]/90 text-white rounded-full px-7 py-2.5 text-xs font-semibold shadow-xs">
              Explore Collection
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto border-gray-300 hover:bg-white text-gray-700 rounded-full px-6 py-2.5 text-xs font-semibold">
              <Home className="mr-1.5 size-3.5" />
              Return Home
            </Button>
          </Link>
        </div>

        {/* Quick Category Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-200/60 w-full">
          <p className="text-xs text-muted-foreground mb-3 font-medium">Popular Categories</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: "Rings", href: "/products?category=ring" },
              { name: "Necklaces", href: "/products?category=necklace" },
              { name: "Earrings", href: "/products?category=earring" },
              { name: "Bracelets", href: "/products?category=bracelet" },
            ].map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="text-xs font-medium text-gray-600 hover:text-[#B88E2F] bg-white border border-gray-200 rounded-full px-3.5 py-1.5 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
