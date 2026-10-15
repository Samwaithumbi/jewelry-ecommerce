"use server"

import { db } from "@/lib/db"
import { orders, orderItems, products, productVariants } from "@/drizzle/src/db/schema"
import { inventoryLevels, inventoryLocations } from "@/drizzle/src/db/inventory-schema"
import { eq, and, gte, inArray, sql, desc, asc } from "drizzle-orm"
import { formatMonth, mapCategoryToDisplay, getCategoryColor } from "@/lib/dashboard-utils"
import { requireAdminSession } from "@/lib/auth-guard"

// ── TypeScript Types ──────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string
  revenue: number
}

export interface CategoryDataPoint {
  name: string
  value: number
  color: string
}

export interface InsightData {
  icon: string
  color: string
  bg: string
  title: string
  body: string
}

export interface InventoryItemDisplay {
  sku: string
  name: string
  stock: number
  total: number
}

// ── Constants ──────────────────────────────────────────────────────────────────

const VALID_ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'] as const

// ── Revenue Data ───────────────────────────────────────────────────────────────

/**
 * Gets monthly revenue data for the last 12 months
 * Excludes pending, cancelled, and refunded orders
 */
export async function getRevenueData(): Promise<RevenueDataPoint[]> {
  await requireAdminSession()
  try {
    // Calculate date 12 months ago
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    twelveMonthsAgo.setDate(1) // Start from first of month

    // Query orders from last 12 months with valid statuses
    const orderData = await db
      .select({
        createdAt: orders.createdAt,
        totalCents: orders.totalCents,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, twelveMonthsAgo),
          inArray(orders.status, VALID_ORDER_STATUSES)
        )
      )
      .orderBy(orders.createdAt)

    // Group by month and sum revenue (convert from cents to KSh)
    const monthlyRevenue = new Map<string, number>()
    
    orderData.forEach((order) => {
      const monthKey = formatMonth(new Date(order.createdAt))
      const currentRevenue = monthlyRevenue.get(monthKey) || 0
      // Convert cents to KSh (divide by 100)
      monthlyRevenue.set(monthKey, currentRevenue + (order.totalCents / 100))
    })

    // Create array for last 12 months (ensure all months present)
    const result: RevenueDataPoint[] = []
    const now = new Date()
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthKey = formatMonth(date)
      
      result.push({
        month: monthKey,
        revenue: monthlyRevenue.get(monthKey) || 0,
      })
    }

    return result

  } catch (error) {
    console.error('Failed to fetch revenue data:', error)
    return []
  }
}

// ── Category Data ──────────────────────────────────────────────────────────────

/**
 * Gets revenue distribution by product category
 * Returns percentages of total revenue
 */
export async function getCategoryData(): Promise<CategoryDataPoint[]> {
  await requireAdminSession()
  try {
    // Get all order items with valid order statuses
    const categoryRevenue = await db
      .select({
        category: products.category,
        totalRevenue: sql<number>`sum(${orderItems.priceCents} * ${orderItems.qty})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(inArray(orders.status, VALID_ORDER_STATUSES))
      .groupBy(products.category)


    // Calculate total revenue across all categories (convert from cents to KSh)
    const totalRevenue = categoryRevenue.reduce(
      (sum, cat) => sum + (Number(cat.totalRevenue || 0) / 100),
      0
    )

    if (totalRevenue === 0) {
      return []
    }

    // Convert to percentages and format
    const result = categoryRevenue
      .map((cat, index) => {
        const revenue = Number(cat.totalRevenue || 0) / 100 // Convert cents to KSh
        const percentage = Math.round((revenue / totalRevenue) * 100)
        
        return {
          name: mapCategoryToDisplay(cat.category || 'unknown'),
          value: percentage,
          color: getCategoryColor(index),
        }
      })
      .filter((cat) => cat.value > 0) // Remove 0% categories
      .sort((a, b) => b.value - a.value) // Sort by percentage descending

    return result

  } catch (error) {
    console.error('Failed to fetch category data:', error)
    return []
  }
}

// ── AI Insights ────────────────────────────────────────────────────────────────

/**
 * Generates dynamic insights from real data
 * - Trending products (growth in last 30 days)
 * - Low stock alerts
 * - Revenue metrics
 */
export async function getAIInsights(): Promise<InsightData[]> {
  await requireAdminSession()
  const insights: InsightData[] = []

  try {
    // Calculate date ranges
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    // ── INSIGHT 1: Trending Product ──────────────────────────────────────────

    try {
      // Get product sales for last 30 days
      const recentSales = await db
        .select({
          productId: orderItems.productId,
          productName: products.name,
          totalQty: sql<number>`sum(${orderItems.qty})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(
            gte(orders.createdAt, thirtyDaysAgo),
            inArray(orders.status, VALID_ORDER_STATUSES)
          )
        )
        .groupBy(orderItems.productId, products.name)
        .orderBy(desc(sql`sum(${orderItems.qty})`))
        .limit(1)

      // Get sales for 30-60 days ago for comparison
      const previousSales = await db
        .select({
          productId: orderItems.productId,
          totalQty: sql<number>`sum(${orderItems.qty})`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            gte(orders.createdAt, sixtyDaysAgo),
            sql`${orders.createdAt} < ${thirtyDaysAgo}`,
            inArray(orders.status, VALID_ORDER_STATUSES)
          )
        )
        .groupBy(orderItems.productId)

      if (recentSales.length > 0) {
        const topProduct = recentSales[0]
        const previousQty = previousSales.find(
          (p) => p.productId === topProduct.productId
        )?.totalQty || 0
        
        const growth = previousQty > 0
          ? Math.round(((Number(topProduct.totalQty) - Number(previousQty)) / Number(previousQty)) * 100)
          : 100

        insights.push({
          icon: 'TrendingUp',
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          title: `${topProduct.productName} trending +${growth}%`,
          body: 'Best performing product in the last 30 days.',
        })
      }
    } catch (error) {
      console.error('Error calculating trending products:', error)
    }

    // ── INSIGHT 2: Low Stock Alert ───────────────────────────────────────────

    try {
      // Get main inventory location
      const mainLocation = await db.query.inventoryLocations.findFirst({
        where: eq(inventoryLocations.code, 'MAIN'),
      })

      if (mainLocation) {
        // Find items below reorder point
        const lowStockItems = await db
          .select({
            variantId: inventoryLevels.variantId,
            onHand: inventoryLevels.onHand,
            reserved: inventoryLevels.reserved,
            reorderPoint: inventoryLevels.reorderPoint,
          })
          .from(inventoryLevels)
          .where(
            and(
              eq(inventoryLevels.locationId, mainLocation.id),
              sql`(${inventoryLevels.onHand} - ${inventoryLevels.reserved}) <= ${inventoryLevels.reorderPoint}`
            )
          )
          .limit(5)

        if (lowStockItems.length > 0) {
          // Get product names for low stock items
          const variantIds = lowStockItems.map((item) => item.variantId)
          const variantData = await db
            .select({
              variantId: productVariants.id,
              productName: products.name,
            })
            .from(productVariants)
            .innerJoin(products, eq(productVariants.productId, products.id))
            .where(inArray(productVariants.id, variantIds))
            .limit(2)

          const productNames = variantData.map((v) => v.productName).join(' & ')

          insights.push({
            icon: 'AlertTriangle',
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            title: `Low stock: ${lowStockItems.length} SKU${lowStockItems.length > 1 ? 's' : ''}`,
            body: productNames ? `${productNames} below threshold.` : 'Items need restocking.',
          })
        }
      }
    } catch (error) {
      console.error('Error calculating low stock:', error)
    }

    // ── INSIGHT 3: Revenue/Performance Metric ────────────────────────────────

    try {
      // Calculate revenue for last 30 days
      const recentRevenue = await db
        .select({
          total: sql<number>`sum(${orders.totalCents})`,
          count: sql<number>`count(*)`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, thirtyDaysAgo),
            inArray(orders.status, VALID_ORDER_STATUSES)
          )
        )

      if (recentRevenue.length > 0 && recentRevenue[0].total) {
        const totalRevenue = Number(recentRevenue[0].total)
        const orderCount = Number(recentRevenue[0].count)
        const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount / 100) : 0

        insights.push({
          icon: 'Zap',
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          title: `Average order value: KSh ${avgOrderValue.toLocaleString()}`,
          body: `${orderCount} orders completed in the last 30 days.`,
        })
      }
    } catch (error) {
      console.error('Error calculating revenue metrics:', error)
    }

    // If no insights generated, provide defaults
    if (insights.length === 0) {
      insights.push({
        icon: 'Sparkles',
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        title: 'Dashboard ready',
        body: 'Start tracking insights as orders come in.',
      })
    }

    return insights

  } catch (error) {
    console.error('Failed to generate AI insights:', error)
    return [
      {
        icon: 'Sparkles',
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        title: 'Insights unavailable',
        body: 'Unable to generate insights at this time.',
      },
    ]
  }
}

// ── Inventory Health ───────────────────────────────────────────────────────────

/**
 * Gets top 4 products with lowest available stock
 */
export async function getInventoryHealth(): Promise<InventoryItemDisplay[]> {
  await requireAdminSession()
  try {

    // Get main inventory location
    const mainLocation = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.code, 'MAIN'),
    })

    if (!mainLocation) {
      console.warn('Main inventory location not found')
      return []
    }

    // Get inventory levels with lowest available stock
    const inventoryData = await db
      .select({
        variantId: inventoryLevels.variantId,
        onHand: inventoryLevels.onHand,
        reserved: inventoryLevels.reserved,
        available: sql<number>`${inventoryLevels.onHand} - ${inventoryLevels.reserved}`,
      })
      .from(inventoryLevels)
      .where(eq(inventoryLevels.locationId, mainLocation.id))
      .orderBy(asc(sql`${inventoryLevels.onHand} - ${inventoryLevels.reserved}`))
      .limit(4)

    if (inventoryData.length === 0) {
      return []
    }

    // Get variant and product information
    const variantIds = inventoryData.map((item) => item.variantId)
    const variantInfo = await db
      .select({
        variantId: productVariants.id,
        sku: productVariants.sku,
        productName: products.name,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(inArray(productVariants.id, variantIds))

    // Create map for quick lookup
    const variantMap = new Map(variantInfo.map((v) => [v.variantId, v]))

    // Transform to display format
    const result = inventoryData
      .map((item) => {
        const variant = variantMap.get(item.variantId)
        const available = Number(item.available)
        
        return {
          sku: variant?.sku || 'N/A',
          name: variant?.productName || 'Unknown Product',
          stock: available >= 0 ? available : 0,
          total: item.onHand,
        }
      })
      .filter((item) => item.sku !== 'N/A') // Remove items without variant info

    return result

  } catch (error) {
    console.error('Failed to fetch inventory health:', error)
    return []
  }
}
