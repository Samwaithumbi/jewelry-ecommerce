"use client"

import { TrendingUp, AlertTriangle, Zap, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { InsightData } from "@/app/actions/admin/get-dashboard-data"

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

export function AiInsightsCard({ insights, isLoading }: AiInsightsCardProps) {
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
        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2.5">
              <Skeleton className="mt-0.5 h-6 w-6 rounded-md shrink-0 bg-amber-200/60" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28 bg-amber-300/40" />
                <Skeleton className="h-2.5 w-full bg-amber-200/30" />
                <Skeleton className="h-2.5 w-4/5 bg-amber-200/30" />
              </div>
            </div>
          ))}
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
