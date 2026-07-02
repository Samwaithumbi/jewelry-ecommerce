"use client"

import * as React from "react"
import { useQueryState, parseAsArrayOf, parseAsBoolean, parseAsString } from "nuqs"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "ring", label: "Rings" },
  { id: "necklace", label: "Necklaces" },
  { id: "earring", label: "Earrings" },
  { id: "bracelet", label: "Bracelets" },
  { id: "pendant", label: "Pendants" },
  { id: "set", label: "Sets" },
]

const METAL_TYPES = [
  { id: "gold", label: "Gold" },
  { id: "white_gold", label: "White Gold" },
  { id: "rose_gold", label: "Rose Gold" },
  { id: "platinum", label: "Platinum" },
  { id: "silver", label: "Sterling Silver" },
]

const STONE_TYPES = [
  { id: "diamond", label: "Diamond" },
  { id: "sapphire", label: "Sapphire" },
  { id: "emerald", label: "Emerald" },
  { id: "ruby", label: "Ruby" },
  { id: "pearl", label: "Pearl" },
  { id: "moissanite", label: "Moissanite" },
  { id: "opal", label: "Opal" },
  { id: "amethyst", label: "Amethyst" },
]

const SIZES = [
  { id: "4", label: "Size 4" },
  { id: "5", label: "Size 5" },
  { id: "6", label: "Size 6" },
  { id: "7", label: "Size 7" },
  { id: "8", label: "Size 8" },
  { id: "9", label: "Size 9" },
  { id: "10", label: "Size 10" },
]

// nuqs option: shallow:false forces Next.js router navigation
// so the server component re-renders without a full page reload
const NUQS_OPTIONS = { shallow: false } as const

export interface FilterCounts {
  categories: Record<string, number>
  metalTypes: Record<string, number>
  stoneTypes: Record<string, number>
  total: number
}

interface ProductFiltersProps {
  counts?: FilterCounts
}

export function ProductFilters({ counts }: ProductFiltersProps) {
  const [openSections, setOpenSections] = React.useState({
    category: true,
    metalType: true,
    stoneType: true,
    priceRange: true,
    certification: true,
    size: true,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // shallow:false makes nuqs use router.push/replace instead of
  // history.pushState, so Next.js server components re-render immediately
  const [category, setCategory] = useQueryState(
    'category',
    parseAsString.withDefault('').withOptions(NUQS_OPTIONS)
  )
  const [metalTypes, setMetalTypes] = useQueryState(
    'metal',
    parseAsArrayOf(parseAsString).withDefault([]).withOptions(NUQS_OPTIONS)
  )
  const [stoneTypes, setStoneTypes] = useQueryState(
    'stone',
    parseAsArrayOf(parseAsString).withDefault([]).withOptions(NUQS_OPTIONS)
  )
  const [maxPrice, setMaxPrice] = useQueryState(
    'max',
    parseAsString.withDefault('10000').withOptions(NUQS_OPTIONS)
  )
  const [hasCert, setHasCert] = useQueryState(
    'cert',
    parseAsBoolean.withDefault(false).withOptions(NUQS_OPTIONS)
  )
  const [size, setSize] = useQueryState(
    'size',
    parseAsString.withDefault('').withOptions(NUQS_OPTIONS)
  )

  const handleMetalToggle = (metalId: string) => {
    if (metalTypes.includes(metalId)) {
      setMetalTypes(metalTypes.filter(m => m !== metalId))
    } else {
      setMetalTypes([...metalTypes, metalId])
    }
  }

  const handleStoneToggle = (stoneId: string) => {
    if (stoneTypes.includes(stoneId)) {
      setStoneTypes(stoneTypes.filter(s => s !== stoneId))
    } else {
      setStoneTypes([...stoneTypes, stoneId])
    }
  }

  return (
    <div className="w-full max-w-[260px] flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm h-fit shrink-0 border border-primary/5">
      {/* Category */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => toggleSection('category')}
          className="flex items-center justify-between font-semibold text-[15px] hover:text-[#B88E2F] transition-colors"
        >
          Category
          {openSections.category ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {openSections.category && (
          <div className="flex flex-col gap-3">
            {CATEGORIES.map((item) => {
              const count = item.id === 'all' ? counts?.total : counts?.categories[item.id]
              return (
                <div key={item.id} className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`category-${item.id}`}
                      checked={category === item.id || (item.id === 'all' && !category)}
                      onCheckedChange={() => setCategory(item.id === 'all' ? '' : item.id)}
                      className={cn("size-[18px] border-primary/20 data-[state=checked]:bg-[#F59E0B] data-[state=checked]:border-[#F59E0B]")}
                    />
                    <Label
                      htmlFor={`category-${item.id}`}
                      className={cn("text-sm cursor-pointer transition-colors hover:text-[#111827]", category === item.id || (item.id === "all" && !category) ? "font-semibold text-[#111827]" : "font-normal text-muted-foreground")}
                    >
                      {item.label}
                    </Label>
                  </div>
                  {count !== undefined && (
                    <span className="text-[13px] text-muted-foreground">({count})</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Separator className="bg-primary/5" />

      {/* Metal Type */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => toggleSection('metalType')}
          className="flex items-center justify-between font-semibold text-[15px] hover:text-[#B88E2F] transition-colors"
        >
          Metal Type
          {openSections.metalType ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {openSections.metalType && (
          <div className="flex flex-col gap-3">
            {METAL_TYPES.map((item) => {
              const count = counts?.metalTypes[item.id]
              return (
                <div key={item.id} className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`metal-${item.id}`}
                      checked={metalTypes.includes(item.id)}
                      onCheckedChange={() => handleMetalToggle(item.id)}
                      className={cn("size-[18px] border-primary/20 data-[state=checked]:bg-[#F59E0B] data-[state=checked]:border-[#F59E0B]")}
                    />
                    <Label
                      htmlFor={`metal-${item.id}`}
                      className={cn("text-sm cursor-pointer transition-colors hover:text-[#111827]", metalTypes.includes(item.id) ? "font-semibold text-[#111827]" : "font-normal text-muted-foreground")}
                    >
                      {item.label}
                    </Label>
                  </div>
                  {count !== undefined && (
                    <span className="text-[13px] text-muted-foreground">({count})</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Separator className="bg-primary/5" />

      {/* Stone Type */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => toggleSection('stoneType')}
          className="flex items-center justify-between font-semibold text-[15px] hover:text-[#B88E2F] transition-colors"
        >
          Stone Type
          {openSections.stoneType ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {openSections.stoneType && (
          <div className="flex flex-col gap-3">
            {STONE_TYPES.map((item) => {
              const count = counts?.stoneTypes[item.id]
              return (
                <div key={item.id} className="flex items-center justify-between space-x-2">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`stone-${item.id}`}
                      checked={stoneTypes.includes(item.id)}
                      onCheckedChange={() => handleStoneToggle(item.id)}
                      className={cn("size-[18px] border-primary/20 data-[state=checked]:bg-[#F59E0B] data-[state=checked]:border-[#F59E0B]")}
                    />
                    <Label
                      htmlFor={`stone-${item.id}`}
                      className={cn("text-sm cursor-pointer transition-colors hover:text-[#111827]", stoneTypes.includes(item.id) ? "font-semibold text-[#111827]" : "font-normal text-muted-foreground")}
                    >
                      {item.label}
                    </Label>
                  </div>
                  {count !== undefined && (
                    <span className="text-[13px] text-muted-foreground">({count})</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Separator className="bg-primary/5" />

      {/* Price Range */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => toggleSection('priceRange')}
          className="flex items-center justify-between font-semibold text-[15px] hover:text-[#B88E2F] transition-colors"
        >
          Price Range
          {openSections.priceRange ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {openSections.priceRange && (
          <div className="flex flex-col gap-5 pt-2">
            <Slider
              value={[parseInt(maxPrice)]}
              onValueChange={(vals: number | readonly number[]) => setMaxPrice((Array.isArray(vals) ? vals[0] : vals).toString())}
              max={10000}
              step={100}
              className="w-full"
            />
            <div className="flex items-center justify-between text-[13px] font-medium text-muted-foreground">
              <span>$0</span>
              <span>${parseInt(maxPrice).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-primary/5" />

      {/* Certification Toggle */}
      <div className="flex items-center space-x-3 bg-[#FCFBF9] p-3 rounded-xl border border-[#F59E0B]/20">
        <Checkbox
          id="has-cert"
          checked={hasCert}
          onCheckedChange={(checked) => setHasCert(checked === true)}
          className="size-5 data-[state=checked]:bg-[#F59E0B] data-[state=checked]:border-[#F59E0B] border-[#F59E0B]/50"
        />
        <Label htmlFor="has-cert" className="font-semibold text-sm cursor-pointer">Has Certification</Label>
      </div>

      <Separator className="bg-primary/5" />

      {/* Size Available */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => toggleSection('size')}
          className="flex items-center justify-between font-semibold text-[15px] hover:text-[#B88E2F] transition-colors"
        >
          Size Available
          {openSections.size ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </button>
        {openSections.size && (
          <Select value={size} onValueChange={(val) => setSize(val)}>
            <SelectTrigger className="w-full rounded-xl bg-white border-primary/10 h-10">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="">All Sizes</SelectItem>
              {SIZES.map((item) => (
                <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
