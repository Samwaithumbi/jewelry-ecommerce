"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { LayoutGrid, List, Sparkles, ScanLine, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ProductFilters, type FilterCounts } from "@/components/shop/product-filters"

interface ProductToolbarProps {
  totalCount?: number
  filterCounts?: FilterCounts
}

export function ProductToolbar({ totalCount, filterCounts }: ProductToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSortChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", value)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex w-full items-center justify-between gap-3 sm:gap-4 py-3 mb-6 bg-transparent z-20 flex-wrap sm:flex-nowrap">
    
      <div className="flex items-center gap-2 sm:gap-3 ">
        {/* Mobile Filters Sheet Trigger */}
        <div className="lg:hidden ml-0">
          <Sheet>
            <SheetTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full bg-white h-10 px-3.5 border-primary/10 shadow-sm font-medium text-xs text-[#111827] hover:border-[#B88E2F]/50 flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="size-3.5 text-[#B88E2F]" />
                    <span>Filters</span>
                  </Button>
                }
              />
            <SheetContent side="left" className="data-[side=left]:w-3/4 data-[side=left]:sm:w-[450px]">
              <SheetHeader className="p-4 border-b border-primary/10">
                <SheetTitle className="text-base font-serif font-semibold text-[#111827] flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-[#B88E2F]" />
                  Filter Jewelry
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4">
                <ProductFilters counts={filterCounts} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Sort */}
        <Select defaultValue={searchParams.get("sort") || "popular"} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px] sm:w-[170px] rounded-full bg-white h-10 border-primary/10 shadow-sm font-medium text-xs sm:text-sm hover:border-[#B88E2F]/50 transition-colors">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="rounded-xl shadow-lg border-primary/10">
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="hidden sm:flex items-center gap-1 bg-white p-1 rounded-full border border-primary/10 shadow-sm">
          <Button variant="ghost" size="icon" className="size-8 rounded-full bg-[#111827] text-white hover:bg-[#111827]/90 hover:text-white shadow-sm">
            <LayoutGrid className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8 rounded-full text-muted-foreground hover:text-foreground transition-colors">
            <List className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ShopHeaderProps {
  totalCount?: number
  currentCategory?: string
  searchQuery?: string
}

export function ShopHeader({ totalCount = 0, currentCategory, searchQuery }: ShopHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const categoryTitles: Record<string, string> = {
    ring: "Fine Rings",
    necklace: "Necklaces & Pendants",
    bracelet: "Bracelets & Bangles",
    earring: "Earrings",
    pendant: "Pendants",
    bangle: "Bangles",
    set: "Jewelry Sets",
  }

  const title = currentCategory
    ? categoryTitles[currentCategory] || `${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}`
    : searchQuery
    ? `Results for "${searchQuery}"`
    : "All Fine Jewelry"

  return (
    <div className="w-full flex flex-col gap-6 md:flex-row md:items-end justify-between py-8 border-b border-primary/10 mb-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-muted-foreground font-medium uppercase tracking-wider">
          <a href="/" className="hover:text-[#B88E2F] transition-colors">Home</a>
          <span>/</span>
          <a href="/products" className="hover:text-[#B88E2F] transition-colors">Shop</a>
          {currentCategory && (
            <>
              <span>/</span>
              <span className="text-[#B88E2F] capitalize">{currentCategory}</span>
            </>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight font-serif text-[#111827] capitalize">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          {totalCount} {totalCount === 1 ? "handcrafted piece" : "handcrafted pieces"}
        </p>
      </div>


    </div>
  )
}
