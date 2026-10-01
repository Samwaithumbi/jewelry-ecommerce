"use server"

import { db } from "@/lib/db"
import { users, orders } from "@/drizzle/src/db/schema"
import { count, eq, desc, sql } from "drizzle-orm"

const tierDisplayMap: Record<string, string> = {
  standard: "Bronze",
  vip: "Gold",
  wholesale: "Diamond",
}

export async function getCustomers() {
  try {
    // Get all users with their order counts
    const customersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        customerTier: users.customerTier,
        lifetimeSpend: users.lifetimeSpend,
        createdAt: users.createdAt,
        orderCount: sql<number>`COALESCE(${count(orders.id)}, 0)`,
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))

    // Transform data to match the expected format
    const transformedCustomers = customersList.map((customer) => {
      const tier = customer.customerTier ? (tierDisplayMap[customer.customerTier] || "Bronze") : "Bronze"
      const joinedDate = new Date(customer.createdAt)
      const joined = joinedDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })

      // Generate a customer ID from the UUID
      const customerId = `C-${customer.id.slice(0, 4).toUpperCase()}`

      return {
        id: customerId,
        name: customer.name || "Unknown",
        email: customer.email,
        phone: "", // Phone not in users table yet
        tier,
        orders: customer.orderCount,
        totalSpent: customer.lifetimeSpend || 0,
        joined,
        status: "Active", // Default to active for now
      }
    })

    return transformedCustomers
  } catch (error) {
    console.error("Failed to fetch customers:", error)
    return []
  }
}
