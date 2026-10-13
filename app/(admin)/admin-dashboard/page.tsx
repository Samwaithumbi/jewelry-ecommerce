"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Bell,Plus,Search,Filter,
  Download,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
  ExternalLink,
  RefreshCw,
} from "lucide-react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getOrderItems, type OrderDisplay } from "@/app/actions/admin/get-orders"
import {
  getRevenueData,
  getCategoryData,
  getAIInsights,
  getInventoryHealth,
  type RevenueDataPoint,
  type CategoryDataPoint,
  type InsightData,
  type InventoryItemDisplay,
} from "@/app/actions/admin/get-dashboard-data"

/* ── helpers ──────────────────────────────────────────────────────────────── */
const fmt = (n: number) =>
  n >= 1000 ? `KSh ${(n / 1000).toFixed(0)}k` : `KSh ${n}`

const statusStyle: Record<string, string> = {
  Fulfilled:  "bg-emerald-100 text-emerald-700",
  Processing: "bg-blue-100   text-blue-700",
  Shipped:    "bg-cyan-100   text-cyan-700",
  Atelier:    "bg-purple-100 text-purple-700",
  Refunded:   "bg-red-100    text-red-700",
}

/* ── sub-components ──────────────────────────────────────────────────────── */

interface DashboardHeaderProps {
  lastUpdated: Date | null
  onRefresh: () => void
  isRefreshing: boolean
}

function DashboardHeader({ lastUpdated, onRefresh, isRefreshing }: DashboardHeaderProps) {
  const now = new Date()
 
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
      {/* Left */}
      <div>
        <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          Dashboard Overview
        </p>
        <p className="flex items-center gap-2 text-sm">
          {now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">
              • Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-muted transition disabled:opacity-50"
          title="Refresh dashboard data"
        >
          <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        {/* Search */}
        <div className="relative hidden sm:flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
          <input
            id="dashboard-search"
            type="text"
            placeholder="Search orders, SKUs, clients…"
            className="h-8 w-64 rounded-md border border-border bg-muted/40 pl-8 pr-3 text-xs outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 transition"
          />
        </div>

        {/* Bell */}
        <button
          id="dashboard-notifications"
          className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-muted transition"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#B8860B]" />
        </button>

        {/* CTA */}
        <Link href="/admin-dashboard/products/new">
            <button
          id="dashboard-new-product"
          className="flex items-center gap-1.5 rounded-md bg-[#1A1A2E] px-3 h-8 text-xs font-medium text-white hover:bg-[#1A1A2E]/80 transition"
        >
          <Plus className="h-3.5 w-3.5" />
          New product
        </button> 
        </Link>
       
      </div>
    </div>
  )
}

/* Revenue chart ─────────────────────────────────────────────────────────── */
interface RevenueCardProps {
  data: RevenueDataPoint[]
  isLoading: boolean
}

function RevenueCard({ data, isLoading }: RevenueCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h2 className="text-sm font-semibold">Revenue performance</h2>
          <p className="text-[11px] text-muted-foreground">Last 12 months</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted transition">
            <Filter className="h-3 w-3" /> Filter
          </button>
          <button className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted transition">
            <Download className="h-3 w-3" /> Export
          </button>
        </div>
      </div>

      {isLoading || data.length === 0 ? (
        <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
          {isLoading ? 'Loading revenue data...' : 'No revenue data available'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#B8860B" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#B8860B" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={fmt}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              formatter={(v) => [`KSh ${Number(v ?? 0).toLocaleString()}`, "Revenue"]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#B8860B"
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

/* Category mix ──────────────────────────────────────────────────────────── */
interface CategoryMixCardProps {
  data: CategoryDataPoint[]
  isLoading: boolean
}

function CategoryMixCard({ data, isLoading }: CategoryMixCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col">
      <h2 className="text-sm font-semibold">Category mix</h2>
      <p className="text-[11px] text-muted-foreground mb-3">Share of revenue</p>

      {isLoading || data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          {isLoading ? 'Loading...' : 'No category data'}
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <PieChart width={160} height={160}>
              <Pie
                data={data}
                cx={75}
                cy={75}
                innerRadius={46}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </div>

          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {data.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium">{cat.value}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* Recent orders ─────────────────────────────────────────────────────────── */
interface RecentOrdersCardProps {
  orders: OrderDisplay[]
  isLoading: boolean
}

function RecentOrdersCard({ orders, isLoading }: RecentOrdersCardProps) {
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
          <div className="p-8 text-center text-muted-foreground text-sm">
            Loading orders...
          </div>
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
                  <td className="px-5 py-3 font-mono text-muted-foreground">#{order.id}</td>
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
                    <button className="text-muted-foreground hover:text-foreground transition">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
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

/* AI Insights ───────────────────────────────────────────────────────────── */
const iconMap: Record<string, any> = {
  TrendingUp,
  AlertTriangle,
  Zap,
  Sparkles,
}

interface AiInsightsCardProps {
  insights: InsightData[]
  isLoading: boolean
}

function AiInsightsCard({ insights, isLoading }: AiInsightsCardProps) {
  return (
    <div className="rounded-xl border border-[#E8D5A0] bg-[#FFFDF5] p-5 shadow-sm">
      {/* Chip */}
      <div className="mb-3 flex items-center gap-1.5">
        <span className="flex items-center gap-1 rounded-full bg-[#B8860B]/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-widest text-[#B8860B] uppercase">
          <Sparkles className="h-3 w-3" /> Lumina AI
        </span>
      </div>
      <h2 className="text-sm font-semibold mb-3">Today&apos;s insights</h2>

      {isLoading ? (
        <div className="text-center text-muted-foreground text-sm py-4">
          Generating insights...
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map(({ icon, color, bg, title, body }) => {
            const Icon = iconMap[icon] || Sparkles
            return (
              <div key={title} className="flex gap-2.5">
                <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ${bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </span>
                <div>
                  <p className="text-xs font-semibold leading-tight">{title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug">{body}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


/* Inventory health ──────────────────────────────────────────────────────── */
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

function InventorySection({ items, isLoading }: InventorySectionProps) {
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

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function AdminDashboardPage() {
  // State management
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [categoryData, setCategoryData] = useState<CategoryDataPoint[]>([])
  const [recentOrders, setRecentOrders] = useState<OrderDisplay[]>([])
  const [aiInsights, setAiInsights] = useState<InsightData[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItemDisplay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Fetch all dashboard data
  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }

      console.log('Fetching dashboard data...')

      // Fetch all data in parallel
      const [revenue, categories, orders, insights, inventory] = await Promise.all([
        getRevenueData(),
        getCategoryData(),
        getOrderItems(10),
        getAIInsights(),
        getInventoryHealth(),
      ])

      setRevenueData(revenue)
      setCategoryData(categories)
      setRecentOrders(orders)
      setAiInsights(insights)
      setInventoryItems(inventory)
      setLastUpdated(new Date())

      console.log('Dashboard data loaded successfully')
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial data fetch on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto-refresh every 3 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing dashboard data...')
      fetchDashboardData(true)
    }, 180000) // 3 minutes

    return () => clearInterval(interval)
  }, [])

  // Manual refresh handler
  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <DashboardHeader 
        lastUpdated={lastUpdated} 
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Main grid */}
      <div className="flex-1 p-5 space-y-4">

        {/* Row 1 — Revenue + Category */}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <RevenueCard data={revenueData} isLoading={isLoading} />
          <CategoryMixCard data={categoryData} isLoading={isLoading} />
        </div>

        {/* Row 2 — Orders + (AI Insights) */}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <RecentOrdersCard orders={recentOrders} isLoading={isLoading} />
          <div className="flex flex-col gap-4">
            <AiInsightsCard insights={aiInsights} isLoading={isLoading} />
            
          </div>
        </div>

        {/* Row 3 — Inventory full width */}
        <InventorySection items={inventoryItems} isLoading={isLoading} />
      </div>
    </div>
  )
}
