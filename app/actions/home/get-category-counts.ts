"use server"

import { db } from "@/lib/db"
import { products } from "@/drizzle/src/db/schema"
import { eq, count } from "drizzle-orm"

export async function getCategoryCounts() {
  try {
    const categoryCounts = await db
      .select({
        category: products.category,
        count: count(),
      })
      .from(products)
      .where(eq(products.active, true))
      .groupBy(products.category)

    return categoryCounts
  } catch (error) {
    console.error('Failed to get category counts:', error)
    return []
  }
}
