"use client"

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
import { DashboardHeader } from "@/components/admin/DashboardHeader"
import { RevenueCard } from "@/components/admin/RevenueCard"
import { CategoryMixCard } from "@/components/admin/CategoryMixCard"
import { RecentOrdersCard } from "@/components/admin/RecentOrdersCard"
import { AiInsightsCard } from "@/components/admin/AiInsightsCard"
import { InventorySection } from "@/components/admin/InventorySection"

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

        {/* Row 2 — Orders + AI Insights */}
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
