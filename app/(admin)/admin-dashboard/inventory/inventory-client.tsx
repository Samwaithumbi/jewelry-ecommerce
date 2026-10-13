"use client"

import { useState, useMemo } from "react"
import {
  Search,
  X,
  AlertTriangle,
  Coins,
  Download,
  PackageCheck,
  Box,
} from "lucide-react"
import { getInventory } from "@/app/actions/admin/get-inventory"
import type { InventoryItem, InventorySummary } from "@/app/actions/admin/get-inventory"

const CATEGORIES = ["All", "Rings", "Necklaces", "Earrings", "Bracelets"] as const

function calculateStatus(available: number, reorderPoint: number): "Out of Stock" | "Critical" | "Low" | "Good" {
  if (available === 0) return "Out of Stock"
  if (available <= Math.ceil(reorderPoint * 0.5)) return "Critical"
  if (available <= reorderPoint) return "Low"
  return "Good"
}

function StatusBadge({ status }: { status: "Out of Stock" | "Critical" | "Low" | "Good" }) {
  switch (status) {
    case "Critical":
      return (
        <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-500 ring-1 ring-inset ring-rose-200/50">
          Critical
        </span>
      )
    case "Low":
      return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600 ring-1 ring-inset ring-amber-200/60">
          Low
        </span>
      )
    case "Out of Stock":
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 ring-1 ring-inset ring-red-200">
          Out of Stock
        </span>
      )
    case "Good":
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-200/50">
          Good
        </span>
      )
  }
}

function StockLevelBar({ available, reorderPoint }: { available: number; reorderPoint: number }) {
  const target = Math.max(reorderPoint * 2, 12)
  const percentage = Math.min(Math.round((available / target) * 100), 100)
  const barColor = available === 0 ? "bg-red-400" : available <= reorderPoint ? "bg-amber-400" : "bg-emerald-400"

  return (
    <div className="flex items-center gap-2 min-w-[70px]">
      <div className="relative h-2 w-20 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.max(percentage, available > 0 ? 8 : 0)}%` }}
        />
      </div>
    </div>
  )
}

export function InventoryClient({ initialData }: { initialData: { items: InventoryItem[]; summary: InventorySummary } }) {
  const [items, setItems] = useState<InventoryItem[]>(initialData.items)
  const [summary, setSummary] = useState<InventorySummary>(initialData.summary)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [sortKey, setSortKey] = useState<keyof InventoryItem | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const formatCurrency = (cents: number) => {
    return `KSh ${(cents / 100).toLocaleString()}`
  }

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesCategory = selectedCategory === "All" || item.productName.toLowerCase().includes(selectedCategory.toLowerCase())
        const matchesSearch = search === "" || item.sku.toLowerCase().includes(search.toLowerCase()) || item.productName.toLowerCase().includes(search.toLowerCase())
        return matchesCategory && matchesSearch
      })
      .sort((a, b) => {
        if (!sortKey) return 0
        const valA = a[sortKey]
        const valB = b[sortKey]
        if (valA === null || valA === undefined) return 1
        if (valB === null || valB === undefined) return -1
        if (valA < valB) return sortOrder === "asc" ? -1 : 1
        if (valA > valB) return sortOrder === "asc" ? 1 : -1
        return 0
      })
  }, [items, selectedCategory, search, sortKey, sortOrder])

  const handleSort = (key: keyof InventoryItem) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const handleExportCSV = () => {
    const headers = "SKU,Product,On Hand,Reserved,Available,Unit Price,Total Value,Status\n"
    const rows = items.map((i) => `"${i.sku}","${i.productName}",${i.onHand},${i.reserved},${i.available},${i.unitPriceCents},${i.totalValueCents},"${i.isOutOfStock ? 'Out of Stock' : i.isLowStock ? 'Low' : 'Good'}"`).join("\n")
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `inventory_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-slate-50/40 p-6 md:p-8 font-sans text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-slate-900">Inventory</h1>
            <p className="mt-1 text-sm text-slate-500">{summary.totalItems} SKUs tracked</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExportCSV} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer">
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Coins className="h-5 w-5" />
            </div>
            <div className="mt-5">
              <div className="text-3xl font-serif font-semibold text-slate-900">
                {summary.totalValueCents >= 100000 ? `${(summary.totalValueCents / 100000).toFixed(1)}k` : formatCurrency(summary.totalValueCents)}
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">Total Inventory Value</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="mt-5">
              <div className="text-3xl font-serif font-semibold text-slate-900">{summary.lowStockCount}</div>
              <p className="mt-1 text-xs font-medium text-slate-500">Low Stock Alerts</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
              <X className="h-5 w-5" />
            </div>
            <div className="mt-5">
              <div className="text-3xl font-serif font-semibold text-slate-900">{summary.outOfStockCount}</div>
              <p className="mt-1 text-xs font-medium text-slate-500">Out of Stock</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Box className="h-5 w-5" />
            </div>
            <div className="mt-5">
              <div className="text-3xl font-serif font-semibold text-slate-900">{summary.totalAvailable}</div>
              <p className="mt-1 text-xs font-medium text-slate-500">Total Available Units</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKUs or products..."
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition cursor-pointer ${
                    selectedCategory === cat ? "bg-slate-950 text-white shadow-xs" : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th onClick={() => handleSort("sku")} className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none">SKU</th>
                  <th onClick={() => handleSort("productName")} className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none">Product</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider select-none">On Hand</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider select-none">Reserved</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider select-none">Available</th>
                  <th onClick={() => handleSort("unitPriceCents")} className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none">Unit Price</th>
                  <th onClick={() => handleSort("totalValueCents")} className="cursor-pointer px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 select-none">Total Value</th>
                  <th className="px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider select-none">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <PackageCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No matching inventory items found in database.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition group">
                      <td className="px-6 py-4 font-mono font-medium text-slate-600 whitespace-nowrap">{item.sku}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap max-w-[220px] truncate">
                        <span className="truncate">{item.productName}</span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{item.onHand}</td>
                      <td className="px-6 py-4 text-slate-600">{item.reserved}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{item.available}</span>
                          <StockLevelBar available={item.available} reorderPoint={item.reorderPoint} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{formatCurrency(item.unitPriceCents)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(item.totalValueCents)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={calculateStatus(item.available, item.reorderPoint)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
