import Link from "next/link"
import { RefreshCw, Search, Bell, Plus } from "lucide-react"

interface DashboardHeaderProps {
  lastUpdated: Date | null
  onRefresh: () => void
  isRefreshing: boolean
}

export default function DashboardHeader({ lastUpdated, onRefresh, isRefreshing }: DashboardHeaderProps) {
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
