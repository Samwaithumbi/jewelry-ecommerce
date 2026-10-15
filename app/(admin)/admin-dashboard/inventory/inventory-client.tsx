"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  X,
  AlertTriangle,
  Coins,
  Download,
  PackageCheck,
  Box,
  Plus,
  Loader2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from "lucide-react"
import type { InventoryItem, InventorySummary } from "@/app/actions/admin/get-inventory"
import { restockInventory } from "@/app/actions/admin/restock-inventory"

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

  // Restock modal state
  const [selectedRestockItem, setSelectedRestockItem] = useState<InventoryItem | null>(null)
  const [restockQty, setRestockQty] = useState<number>(10)
  const [restockReason, setRestockReason] = useState<string>("")
  const [isSubmittingRestock, setIsSubmittingRestock] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null)

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

  const handleOpenRestock = (item: InventoryItem) => {
    setSelectedRestockItem(item)
    setRestockQty(item.reorderQuantity > 0 ? item.reorderQuantity : 10)
    setRestockReason("")
  }

  const handleCloseRestock = () => {
    if (isSubmittingRestock) return
    setSelectedRestockItem(null)
  }

  const handleConfirmRestock = async () => {
    if (!selectedRestockItem || restockQty <= 0) return

    setIsSubmittingRestock(true)
    try {
      const result = await restockInventory({
        variantId: selectedRestockItem.variantId,
        quantity: restockQty,
        locationId: selectedRestockItem.locationId,
        reason: restockReason.trim() || undefined,
      })

      if (result.success && result.data) {
        setItems(result.data.items)
        setSummary(result.data.summary)
        setToastMessage({ text: result.message || `Successfully restocked ${restockQty} units!` })
        setSelectedRestockItem(null)
      } else {
        setToastMessage({ text: result.error || "Failed to restock item.", isError: true })
      }
    } catch {
      setToastMessage({ text: "An unexpected error occurred while restocking.", isError: true })
    } finally {
      setIsSubmittingRestock(false)
      setTimeout(() => {
        setToastMessage(null)
      }, 4000)
    }
  }

  const handleExportCSV = () => {
    const headers = "SKU,Product,On Hand,Reserved,Available,Unit Price (KSh),Total Value (KSh),Status\n"
    const rows = items.map((i) => `"${i.sku}","${i.productName}",${i.onHand},${i.reserved},${i.available},${(i.unitPriceCents / 100).toFixed(2)},${(i.totalValueCents / 100).toFixed(2)},"${i.isOutOfStock ? 'Out of Stock' : i.isLowStock ? 'Low' : 'Good'}"`).join("\n")
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
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 shadow-lg border text-sm font-medium transition-all animate-in fade-in slide-in-from-top-2 ${
              toastMessage.isError
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {toastMessage.isError ? (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-slate-900">Inventory</h1>
            <p className="mt-1 text-sm text-slate-500">{summary.totalItems} SKUs tracked in catalog</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin-dashboard/products/new"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </Link>
            {items.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Coins className="h-5 w-5" />
            </div>
            <div className="mt-5">
              <div className="text-3xl font-serif font-semibold text-slate-900">
                {summary.totalValueKSh >= 1000 ? `KSh ${(summary.totalValueKSh / 1000).toFixed(0)}k` : `KSh ${summary.totalValueKSh.toFixed(0)}`}
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

        {/* Inventory Table Container */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
          {items.length === 0 ? (
            /* Empty state when no products or inventory exist */
            <div className="py-20 px-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 shadow-inner">
                <Box className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-serif font-semibold text-slate-900">No products or inventory found</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                Your catalog currently has no products. When you create products with inventory tracking, their SKUs and stock levels will automatically appear here.
              </p>
              <div className="mt-6">
                <Link
                  href="/admin-dashboard/products/new"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="h-4 w-4" />
                  Add First Product
                </Link>
              </div>
            </div>
          ) : (
            <>
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
                      <th className="px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider select-none">Total Value</th>
                      <th className="px-6 py-3.5 font-semibold text-slate-400 uppercase tracking-wider select-none">Status</th>
                      <th className="px-6 py-3.5 text-right font-semibold text-slate-400 uppercase tracking-wider select-none">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-400">
                          <PackageCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          No matching inventory items found for filter.
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
                          <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(item.unitPriceCents)}</td>
                          <td className="px-6 py-4 font-semibold text-slate-900">{formatCurrency(item.totalValueCents)}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={calculateStatus(item.available, item.reorderPoint)} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleOpenRestock(item)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-900 hover:text-white hover:border-slate-900 transition cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5 text-amber-500" />
                              Restock
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Restock Modal */}
      {selectedRestockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                  <TrendingUp className="h-3 w-3" />
                  Inventory Restock
                </span>
                <h3 className="mt-2 text-xl font-serif font-semibold text-slate-900">
                  {selectedRestockItem.productName}
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">SKU: {selectedRestockItem.sku}</p>
              </div>
              <button
                onClick={handleCloseRestock}
                disabled={isSubmittingRestock}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Current Stock Metrics */}
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3.5 text-center">
              <div>
                <p className="text-[11px] text-slate-500">Current On Hand</p>
                <p className="mt-0.5 text-base font-semibold text-slate-900">{selectedRestockItem.onHand}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Reserved</p>
                <p className="mt-0.5 text-base font-semibold text-slate-600">{selectedRestockItem.reserved}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-500">Available</p>
                <p className="mt-0.5 text-base font-semibold text-emerald-600">{selectedRestockItem.available}</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quantity to Add
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    Units
                  </span>
                </div>

                {/* Quick Add Presets */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] text-slate-400">Quick add:</span>
                  {[5, 10, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRestockQty(preset)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                        restockQty === preset
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                  {selectedRestockItem.reorderQuantity > 0 && (
                    <button
                      type="button"
                      onClick={() => setRestockQty(selectedRestockItem.reorderQuantity)}
                      className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                    >
                      Reorder ({selectedRestockItem.reorderQuantity})
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Restock Reason / Note <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  placeholder="e.g. Supplier PO-4819, Inventory recount"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/10 transition"
                />
              </div>

              {/* Summary Projection */}
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-3 flex items-center justify-between text-xs">
                <span className="text-amber-900 font-medium">New On-Hand Total:</span>
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  {selectedRestockItem.onHand}
                  <ArrowRight className="h-3 w-3 text-amber-600" />
                  <span className="text-sm text-emerald-700">
                    {selectedRestockItem.onHand + (Number(restockQty) || 0)} units
                  </span>
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handleCloseRestock}
                disabled={isSubmittingRestock}
                className="rounded-full px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                disabled={isSubmittingRestock || restockQty <= 0}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingRestock ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Updating stock...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 text-amber-400" />
                    Confirm Restock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
