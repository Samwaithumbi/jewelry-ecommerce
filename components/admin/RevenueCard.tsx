"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Filter, Download } from "lucide-react"
import { fmt } from "./constants"
import type { RevenueDataPoint } from "@/app/actions/admin/get-dashboard-data"

interface RevenueCardProps {
  data: RevenueDataPoint[]
  isLoading: boolean
}

export function RevenueCard({ data, isLoading }: RevenueCardProps) {
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
