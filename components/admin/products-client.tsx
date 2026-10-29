"use client"

import * as React from "react"
import Link from "next/link"
import { Search, Plus, X, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductTableActions } from "@/components/products/product-table-actions"

export interface ProductItem {
  id: string
  name: string
  slug: string
  description?: string | null
  shortDesc?: string | null
  metalType: string
  metalPurity: string
  basePriceCents: number
  weightGrams?: string | number | null
  category: string
  active: boolean
  featured?: boolean | null
  image: string
  createdAt?: string | Date | null
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "ring", label: "Rings" },
  { value: "necklace", label: "Necklaces" },
  { value: "bracelet", label: "Bracelets" },
  { value: "earring", label: "Earrings" },
  { value: "pendant", label: "Pendants" },
  { value: "bangle", label: "Bangles" },
  { value: "set", label: "Sets" },
]

export function ProductsClient({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("all")
  const [selectedProductIds, setSelectedProductIds] = React.useState<Set<string>>(new Set())

  // Filter products by search query and category
  const filteredProducts = React.useMemo(() => {
    return initialProducts.filter((product) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchesName = product.name?.toLowerCase().includes(query)
        const matchesCategory = product.category?.toLowerCase().includes(query)
        const matchesMetal = product.metalType?.toLowerCase().replace("_", " ").includes(query)
        const matchesPurity = product.metalPurity?.toLowerCase().includes(query)
        const matchesSlug = product.slug?.toLowerCase().includes(query)

        if (!matchesName && !matchesCategory && !matchesMetal && !matchesPurity && !matchesSlug) {
          return false
        }
      }

      // Category filter (handles singular and plural mapping)
      if (selectedCategory !== "all") {
        const targetCategory = selectedCategory.toLowerCase()
        const productCategory = product.category?.toLowerCase()
        const match =
          productCategory === targetCategory ||
          productCategory === targetCategory.replace(/s$/, "") ||
          `${productCategory}s` === targetCategory
        if (!match) return false
      }

      return true
    })
  }, [initialProducts, searchQuery, selectedCategory])

  // Row selection handlers
  const handleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)))
    }
  }

  const handleSelectRow = (id: string) => {
    const next = new Set(selectedProductIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedProductIds(next)
  }

  const formatMetal = (metal: string, purity?: string) => {
    const cleanMetal = metal?.replace("_", " ") || "Gold"
    return purity ? `${purity} ${cleanMetal}` : cleanMetal
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 tracking-tight font-semibold">
            Product Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {initialProducts.length} total pieces in your atelier catalog
          </p>
        </div>
        <Link href="/admin-dashboard/products/new">
          <Button className="bg-[#1A1A2E] hover:bg-[#1A1A2E]/85 text-white rounded-lg px-4 h-10 shadow-sm flex items-center gap-2 text-xs font-medium transition">
            <Plus className="w-4 h-4" /> Add Product
          </Button>
        </Link>
      </div>

      {/* Search bar, Category selector, and Live count */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
        {/* Same row container: Search and Category Filter */}
        <div className="flex flex-row items-center gap-3 flex-1 min-w-0 max-w-2xl">
          {/* Search bar */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-9 h-10 text-xs rounded-xl border-stone-200 bg-stone-50/60 focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-[140px] sm:w-[170px] shrink-0">
            <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val || "all")}>
              <SelectTrigger className="w-full h-10 text-xs rounded-xl border-stone-200 bg-stone-50/60 focus:bg-white focus:border-amber-600">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Live Count */}
        <div className="text-xs text-stone-500 whitespace-nowrap self-end md:self-center shrink-0">
          Showing <span className="font-semibold text-stone-900">{filteredProducts.length}</span> of{" "}
          <span className="font-semibold text-stone-900">{initialProducts.length}</span> products
        </div>
      </div>

      {/* Presentable Table Card with zero collision */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/80 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                <th className="w-12 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      selectedProductIds.size === filteredProducts.length
                    }
                    onChange={handleSelectAll}
                    aria-label="Select all products"
                    className="size-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3.5 min-w-[280px]">Product</th>
                <th className="px-4 py-3.5 w-32">Category</th>
                <th className="px-4 py-3.5 w-40">Metal/Stone</th>
                <th className="px-4 py-3.5 w-36">Price</th>
                <th className="px-4 py-3.5 w-28">Status</th>
                <th className="px-4 py-3.5 w-20 text-right pr-6"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-stone-100 text-xs text-stone-700">
              {filteredProducts.map((product) => {
                const isSelected = selectedProductIds.has(product.id)
                return (
                  <tr
                    key={product.id}
                    className={`transition-colors hover:bg-amber-50/30 ${
                      isSelected ? "bg-amber-50/50" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="w-12 px-4 py-3.5 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="size-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                      />
                    </td>

                    {/* Product Image & Details */}
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-3.5">
                        <div className="relative size-12 shrink-0 rounded-xl overflow-hidden bg-stone-100 border border-stone-200/80 shadow-xs">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin-dashboard/products/${product.id}/edit`}
                            className="font-medium text-stone-900 hover:text-amber-800 transition line-clamp-1 text-sm block"
                            title={product.name}
                          >
                            {product.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-400">
                            <span className="truncate">{product.slug}</span>
                            {product.weightGrams && (
                              <>
                                <span>•</span>
                                <span>{product.weightGrams}g</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <Badge
                        variant="secondary"
                        className="capitalize bg-stone-100 text-stone-700 hover:bg-stone-200/70 border-0 rounded-md px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        {product.category}
                      </Badge>
                    </td>

                    {/* Metal / Stone */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <span className="capitalize font-medium text-stone-800 text-xs">
                        {formatMetal(product.metalType, product.metalPurity)}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <span className="font-semibold text-stone-900 text-[13px] tabular-nums">
                        KSh {(product.basePriceCents / 100).toLocaleString("en-KE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          product.active
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
                            : "bg-stone-100 text-stone-600 ring-1 ring-stone-200"
                        }`}
                      >
                        {product.active ? "Active" : "Draft"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 align-middle text-right pr-6 whitespace-nowrap">
                      <ProductTableActions id={product.id} />
                    </td>
                  </tr>
                )
              })}

              {/* Empty state */}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-stone-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-10 h-10 text-stone-300 stroke-[1.5]" />
                      <p className="text-sm font-medium text-stone-700">No products found</p>
                      <p className="text-xs text-stone-400 max-w-sm">
                        {searchQuery || selectedCategory !== "all"
                          ? "No items match your active search or category selection."
                          : "Your catalog is empty. Click 'Add Product' above to create your first jewelry piece."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
