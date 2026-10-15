"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts"
import type { CategoryDataPoint } from "@/app/actions/admin/get-dashboard-data"

interface CategoryMixCardProps {
  data: CategoryDataPoint[]
  isLoading: boolean
}

export function CategoryMixCard({ data, isLoading }: CategoryMixCardProps) {
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
