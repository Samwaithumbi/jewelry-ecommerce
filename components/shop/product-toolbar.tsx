"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { LayoutGrid, List, Search, Sparkles, ScanLine } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProductToolbar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSortChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams)
    params.set("sort", value)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex w-full items-center justify-between gap-4 py-3 mb-6 bg-transparent z-20">
      <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
        <LayoutGrid className="size-4" />
        <span>Filters applied</span>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        {/* Sort */}
        <Select defaultValue={searchParams.get("sort") || "popular"} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[150px] rounded-full bg-white h-10 border-primary/10 shadow-sm font-medium">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-primary/10 shadow-sm">
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

export function ShopHeader() {
  return (
    <div className="w-full flex flex-col gap-6 md:flex-row md:items-end justify-between py-8 border-b border-primary/5 mb-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground font-medium uppercase tracking-wider">
          <span className="hover:text-primary cursor-pointer transition-colors">Home</span>
          <span>/</span>
          <span className="text-primary">All Jewelry</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight font-serif text-[#111827]">All Jewelry</h1>
        <p className="text-muted-foreground">8 pieces</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search jewelry..." 
            className="w-full pl-11 rounded-full bg-white border-primary/10 h-11 shadow-sm focus-visible:ring-[#F59E0B]" 
          />
        </div>

        {/* Action Buttons */}
        <Button variant="outline" className="hidden md:flex rounded-full gap-2 bg-[#FCFBF9] border-[#F59E0B]/30 text-[#B88E2F] hover:bg-[#F59E0B]/10 hover:text-[#B88E2F] h-11 px-5 shadow-sm">
          <ScanLine className="size-4" />
          <span className="font-semibold">Visual</span>
        </Button>
        <Button className="hidden md:flex rounded-full gap-2 bg-[#111827] text-white hover:bg-[#111827]/90 h-11 px-5 shadow-sm">
          <Sparkles className="size-4 text-[#F59E0B]" />
          <span className="font-semibold">AI Search</span>
        </Button>
      </div>
    </div>
  )
}
