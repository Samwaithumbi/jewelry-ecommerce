"use server"

import { db } from "@/lib/db"
import { orders, orderItems, products } from "@/drizzle/src/db/schema"
import { eq, inArray, desc, sql } from "drizzle-orm"
import { formatCurrency } from "@/lib/dashboard-utils"

// ── Types ───────────────────────────────────────────────────────────────────

export interface OrderDisplay {
  id: string
  customer: string
  item: string
  total: string
  status: string
}

// ── Constants ───────────────────────────────────────────────────────────────

const VALID_ORDER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered'] as const

/**
 * Status mapping for UI display
 */
const STATUS_MAP: Record<string, string> = {
  confirmed: 'Processing',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Fulfilled',
}

// ── Get Recent Orders ───────────────────────────────────────────────────────

/**
 * Gets recent orders with full details for dashboard display
 * @param limit - Number of orders to fetch (default: 10)
 * @param offset - Pagination offset (default: 0)
 */
export async function getOrderItems(
  limit: number = 10,
  offset: number = 0
): Promise<OrderDisplay[]> {
  try {
    console.log(`Fetching recent orders (limit: ${limit}, offset: ${offset})`)

    // Get recent orders with valid statuses
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        totalCents: orders.totalCents,
        status: orders.status,
        shippingAddress: orders.shippingAddress,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(inArray(orders.status, VALID_ORDER_STATUSES))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset)

    console.log(`Found ${recentOrders.length} recent orders`)

    if (recentOrders.length === 0) {
      return []
    }

    // Get order items for these orders
    const orderIds = recentOrders.map((o) => o.id)
    const items = await db
      .select({
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        qty: orderItems.qty,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds))

    // Get product names
    const productIds = [...new Set(items.map((i) => i.productId))]
    const productsData = await db
      .select({
        id: products.id,
        name: products.name,
      })
      .from(products)
      .where(inArray(products.id, productIds))

    // Create maps for quick lookup
    const productMap = new Map(productsData.map((p) => [p.id, p.name]))
    const orderItemsMap = new Map<string, typeof items>()
    
    items.forEach((item) => {
      const existing = orderItemsMap.get(item.orderId) || []
      orderItemsMap.set(item.orderId, [...existing, item])
    })

    // Transform to display format
    const result: OrderDisplay[] = recentOrders.map((order) => {
      // Extract customer name from shipping address
      const shippingAddress = order.shippingAddress as any
      const customerName = shippingAddress?.name || 'Guest Customer'

      // Get first product from order
      const orderItemsList = orderItemsMap.get(order.id) || []
      const firstItem = orderItemsList[0]
      const productName = firstItem ? productMap.get(firstItem.productId) || 'Unknown Product' : 'No items'
      
      // Add quantity if more than 1, and show additional items count
      const itemCount = orderItemsList.reduce((sum, item) => sum + item.qty, 0)
      const itemDisplay = itemCount > 1 
        ? `${productName} +${itemCount - 1} more`
        : productName

      // Map status to display format
      const displayStatus = STATUS_MAP[order.status] || order.status

      return {
        id: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
        customer: customerName,
        item: itemDisplay,
        total: formatCurrency(order.totalCents),
        status: displayStatus,
      }
    })

    console.log('Orders transformed for display:', result.length)
    return result

  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return []
  }
}
