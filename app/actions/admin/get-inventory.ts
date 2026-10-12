"use server"

import { db } from "@/lib/db"
import { 
  inventoryLevels, 
  inventoryLocations 
} from "@/drizzle/src/db/inventory-schema"
import { productVariants, products } from "@/drizzle/src/db/schema"
import { eq, and, sql, lt, gte, desc } from "drizzle-orm"

export interface InventoryItem {
  id: string
  variantId: string
  locationId: string
  productName: string
  variantName: string
  sku: string
  unitPriceCents: number
  onHand: number
  reserved: number
  available: number
  reorderPoint: number
  reorderQuantity: number
  totalValueCents: number
  locationName: string
  isLowStock: boolean
  isOutOfStock: boolean
}

export interface InventorySummary {
  totalItems: number
  totalValueCents: number
  lowStockCount: number
  outOfStockCount: number
  totalOnHand: number
  totalReserved: number
  totalAvailable: number
}

export async function getInventory(): Promise<{
  items: InventoryItem[]
  summary: InventorySummary
}> {
  try {
    // Get main inventory location
    const mainLocation = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.code, "MAIN"),
    })

    if (!mainLocation) {
      console.warn("Main inventory location not found")
      return {
        items: [],
        summary: {
          totalItems: 0,
          totalValueCents: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          totalOnHand: 0,
          totalReserved: 0,
          totalAvailable: 0,
        },
      }
    }

    // Get all inventory levels with variants and products
    const inventoryData = await db.query.inventoryLevels.findMany({
      where: eq(inventoryLevels.locationId, mainLocation.id),
    })

    // Get all variants and products separately
    const allVariants = await db.query.productVariants.findMany()
    const allProducts = await db.query.products.findMany()

    // Create maps for easy lookup
    const variantMap = new Map(allVariants.map(v => [v.id, v]))
    const productMap = new Map(allProducts.map(p => [p.id, p]))

    // Transform to InventoryItem format
    const items: InventoryItem[] = inventoryData.map((level) => {
      const available = level.onHand - level.reserved
      const variant = variantMap.get(level.variantId)
      const product = variant ? productMap.get(variant.productId) : null
      
      // Calculate unit price: product base price + variant adjustment
      const productBasePrice = product?.basePriceCents || 0
      const variantAdjustment = variant?.priceAdjustCents || 0
      const unitPriceCents = productBasePrice + variantAdjustment
      const totalValueCents = level.onHand * unitPriceCents

      return {
        id: level.id,
        variantId: level.variantId,
        locationId: level.locationId,
        productName: product?.name || "Unknown Product",
        variantName: variant?.sku || "Variant",
        sku: variant?.sku || "N/A",
        unitPriceCents,
        onHand: level.onHand,
        reserved: level.reserved,
        available,
        reorderPoint: level.reorderPoint,
        reorderQuantity: level.reorderQuantity,
        totalValueCents,
        locationName: mainLocation.name,
        isLowStock: available <= level.reorderPoint && available > 0,
        isOutOfStock: available === 0,
      }
    })

    // Calculate summary metrics
    const summary: InventorySummary = {
      totalItems: items.length,
      totalValueCents: items.reduce((sum, item) => sum + item.totalValueCents, 0),
      lowStockCount: items.filter((item) => item.isLowStock).length,
      outOfStockCount: items.filter((item) => item.isOutOfStock).length,
      totalOnHand: items.reduce((sum, item) => sum + item.onHand, 0),
      totalReserved: items.reduce((sum, item) => sum + item.reserved, 0),
      totalAvailable: items.reduce((sum, item) => sum + item.available, 0),
    }

    console.log("Inventory summary:", summary)

    return {
      items,
      summary,
    }
  } catch (error) {
    console.error("Failed to fetch inventory:", error)
    return {
      items: [],
      summary: {
        totalItems: 0,
        totalValueCents: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalOnHand: 0,
        totalReserved: 0,
        totalAvailable: 0,
      },
    }
  }
}