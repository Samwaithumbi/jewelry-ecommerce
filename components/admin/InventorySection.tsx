"use client"

import { ExternalLink } from "lucide-react"
import Link from "next/link"
import type { InventoryItemDisplay } from "@/app/actions/admin/get-dashboard-data"

function InventoryCard({
  sku,
  name,
  stock,
  total,
}: {
  sku: string
  name: string
  stock: number
  total: number
}) {
  const pct = total > 0 ? Math.round((stock / total) * 100) : 0
  const isLow = pct <= 30

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono text-muted-foreground">{sku}</span>
        {isLow && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
            Low
          </span>
        )}
      </div>

      <p className="text-sm font-semibold leading-snug mb-3">{name}</p>

      {/* Progress */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isLow ? "bg-red-400" : "bg-[#B8860B]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-xl font-bold">{stock}</span>
        <span className="text-[11px] text-muted-foreground">of {total} units</span>
      </div>
    </div>
  )
}

interface InventorySectionProps {
  items: InventoryItemDisplay[]
  isLoading: boolean
}

export function InventorySection({ items, isLoading }: InventorySectionProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold">Inventory health</h2>
          <p className="text-[11px] text-muted-foreground">Live stock across the atelier</p>
        </div>
        <Link href="/admin-dashboard/inventory" className="flex items-center gap-1 text-[11px] text-[#B8860B] hover:underline font-medium">
          Manage catalog <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground text-sm py-8">
          Loading inventory...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-8">
          No inventory data available
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <InventoryCard key={item.sku} {...item} />
          ))}
        </div>
      )}
    </div>
  )
}
