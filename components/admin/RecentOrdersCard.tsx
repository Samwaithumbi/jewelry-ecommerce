"use client"

import { MoreHorizontal, ExternalLink } from "lucide-react"
import Link from "next/link"
import { statusStyle } from "./constants"
import { Skeleton } from "@/components/ui/skeleton"
import type { OrderDisplay } from "@/app/actions/admin/get-orders"

interface RecentOrdersCardProps {
  orders: OrderDisplay[]
  isLoading: boolean
}


export function RecentOrdersCard({ orders, isLoading }: RecentOrdersCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <h2 className="text-sm font-semibold">Recent orders</h2>
          <p className="text-[11px] text-muted-foreground">Updated just now</p>
        </div>
        <Link href="/admin-dashboard/orders" className="flex items-center gap-1 text-[11px] text-[#B8860B] hover:underline font-medium">
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border bg-muted/30">
                {["Order", "Customer", "Item", "Total", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className={`border-b border-border ${i % 2 === 0 ? "" : "bg-muted/5"}`}
                >
                  <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-16 bg-muted/80" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-24 bg-muted/80" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-36 bg-muted/80" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-16 bg-muted/80" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-5 w-20 rounded-full bg-muted/80" /></td>
                  <td className="px-5 py-3.5"><Skeleton className="h-4 w-4 rounded bg-muted/80" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No recent orders found
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-y border-border bg-muted/30">
                {["Order", "Customer", "Item", "Total", "Status", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr
                  key={order.id}
                  className={`border-b border-border hover:bg-muted/20 transition ${
                    i % 2 === 0 ? "" : "bg-muted/5"
                  }`}
                >
                  <td className="px-5 py-3 font-mono text-muted-foreground">{order.displayId.startsWith('#') ? order.displayId : `#${order.displayId}`}</td>
                  <td className="px-5 py-3 font-medium whitespace-nowrap">{order.customer}</td>
                  <td className="px-5 py-3 text-muted-foreground">{order.item}</td>
                  <td className="px-5 py-3 font-semibold whitespace-nowrap">{order.total}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        statusStyle[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin-dashboard/orders/${order.id}`}>
                     <button className="text-muted-foreground hover:text-foreground transition">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    </Link>
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

