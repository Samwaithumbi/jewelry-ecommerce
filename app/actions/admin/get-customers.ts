"use server"

import { db } from "@/lib/db"
import { users, orders } from "@/drizzle/src/db/schema"
import { desc, eq, or, and } from "drizzle-orm"

const tierDisplayMap: Record<string, string> = {
  standard: "Bronze",
  vip: "Gold",
  wholesale: "Diamond",
}

// Orders that should NOT count towards revenue
const EXCLUDED_STATUSES = new Set(['cancelled', 'refunded'])

export async function getCustomers() {
  try {
    console.log("Starting getCustomers fetch...")

    // Get all users
    const customersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        customerTier: users.customerTier,
        lifetimeSpend: users.lifetimeSpend,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    console.log("Fetched users:", customersList.length)

    // Get all orders in a single query for efficiency
    const allOrders = await db.select().from(orders)

    console.log("Fetched orders:", allOrders.length)

    // Process each customer - match orders by userId OR email
    const customersWithOrders = customersList.map((customer) => {
      const customerEmail = customer.email?.toLowerCase()

      // Match orders by userId (primary) OR shipping email (fallback)
      const customerOrders = allOrders.filter((order) => {
        // Primary match: userId matches
        if (order.userId === customer.id) return true

        // Fallback match: shipping address email matches
        const shippingAddress = order.shippingAddress as any
        const shippingEmail = shippingAddress?.email?.toLowerCase()
        return shippingEmail === customerEmail
      })

      // Separate valid vs excluded orders
      const validOrders = customerOrders.filter(order => !EXCLUDED_STATUSES.has(order.status))
      const excludedOrders = customerOrders.filter(order => EXCLUDED_STATUSES.has(order.status))

      return {
        ...customer,
        ordersData: customerOrders,
        validOrders,
        excludedOrders,
        orderCount: customerOrders.length,
        validOrderCount: validOrders.length,
      }
    })

    // Find orders that don't match any registered user (guest orders)
    const allCustomerEmails = new Set(customersList.map(c => c.email?.toLowerCase()))
    const allCustomerIds = new Set(customersList.map(c => c.id))

    const guestOrders = allOrders.filter(order => {
      // Check if order has a userId that matches a registered user
      if (order.userId && allCustomerIds.has(order.userId)) return false

      // Check if order shipping email matches a registered user
      const shippingAddress = order.shippingAddress as any
      const shippingEmail = shippingAddress?.email?.toLowerCase()
      if (shippingEmail && allCustomerEmails.has(shippingEmail)) return false

      // This is a guest order - no matching registered user
      return true
    })

    console.log("Guest orders found:", guestOrders.length)

    // Group guest orders by email to create "virtual" guest customers
    const guestCustomersByEmail = new Map<string, any[]>()
    guestOrders.forEach(order => {
      const shippingAddress = order.shippingAddress as any
      const email = shippingAddress?.email?.toLowerCase() || 'unknown'
      if (!guestCustomersByEmail.has(email)) {
        guestCustomersByEmail.set(email, [])
      }
      guestCustomersByEmail.get(email)!.push(order)
    })

    // Create virtual guest customer records
    const guestCustomers = Array.from(guestCustomersByEmail.entries()).map(([email, orders]) => {
      const validOrders = orders.filter(order => !EXCLUDED_STATUSES.has(order.status))
      const excludedOrders = orders.filter(order => EXCLUDED_STATUSES.has(order.status))
      const mostRecentOrder = orders[0]
      const shippingAddress = mostRecentOrder.shippingAddress as any

      return {
        id: `GUEST-${email.slice(0, 8).toUpperCase()}`,
        name: shippingAddress?.name || 'Guest Customer',
        email: shippingAddress?.email || email,
        customerTier: 'standard',
        lifetimeSpend: 0,
        createdAt: mostRecentOrder.createdAt,
        ordersData: orders,
        validOrders,
        excludedOrders,
        orderCount: orders.length,
        validOrderCount: validOrders.length,
        isGuest: true,
      }
    })

    console.log("Guest customers created:", guestCustomers.length)

    // Combine registered and guest customers
    const allCustomers = [...customersWithOrders, ...guestCustomers]

    console.log("Total customers (registered + guest):", allCustomers.length)

    // Calculate customer status based on recent activity (30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Transform data to match the expected format
    const transformedCustomers = allCustomers.map((customer: any) => {
      const tier = customer.customerTier ? (tierDisplayMap[customer.customerTier] || "Bronze") : "Bronze"
      const joinedDate = new Date(customer.createdAt)
      const joined = joinedDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })

      // Generate a customer ID (use existing if registered, generate for guest)
      const customerId = customer.isGuest ? customer.id : `C-${customer.id.slice(0, 4).toUpperCase()}`

      // Determine status based on recent VALID orders only
      const hasRecentOrder = customer.validOrders.some(
        (order) => new Date(order.createdAt) > thirtyDaysAgo
      )
      const status = hasRecentOrder ? "Active" : "Inactive"

      // Calculate revenue from VALID orders only (exclude cancelled/refunded)
      const actualTotalSpent = customer.validOrders.reduce(
        (sum, order) => sum + order.totalCents,
        0
      )

      // Get phone from most recent valid order's shipping address
      const mostRecentOrder = customer.validOrders[0] || customer.ordersData[0]
      const phone = (mostRecentOrder?.shippingAddress as any)?.phone || ""

      return {
        id: customerId,
        name: customer.name || "Unknown",
        email: customer.email,
        phone,
        tier,
        orders: customer.validOrderCount, // Show only valid orders count
        totalSpent: actualTotalSpent, // Revenue from valid orders only
        joined,
        status,
        isGuest: customer.isGuest || false,
        ordersData: customer.ordersData.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          totalCents: order.totalCents,
          status: order.status,
          createdAt: order.createdAt,
        })),
      }
    })

    console.log("Transformed customers:", transformedCustomers.length)
    console.log("Sample customer data:", transformedCustomers[0])

    // Sort by most recent order date
    transformedCustomers.sort((a, b) => {
      const aMostRecent = a.ordersData[0]?.createdAt || ''
      const bMostRecent = b.ordersData[0]?.createdAt || ''
      return new Date(bMostRecent).getTime() - new Date(aMostRecent).getTime()
    })

    return transformedCustomers

  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return []
  }
}


