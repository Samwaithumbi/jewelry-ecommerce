"use server"

import { db } from "@/lib/db"
import { inventoryLocations } from "@/drizzle/src/db/inventory-schema"
import { eq } from "drizzle-orm"
import { adjustInventory } from "@/lib/inventory/service"
import { requireAdminSession } from "@/lib/auth-guard"
import { revalidatePath } from "next/cache"
import { getInventory } from "./get-inventory"

export interface RestockInput {
  variantId: string
  quantity: number
  locationId?: string
  reason?: string
}

export async function restockInventory(input: RestockInput) {
  const session = await requireAdminSession()

  if (!input.variantId) {
    return { success: false, error: "Variant ID is required." }
  }

  const quantity = Math.floor(Number(input.quantity))
  if (isNaN(quantity) || quantity <= 0) {
    return { success: false, error: "Restock quantity must be a positive number greater than 0." }
  }

  let targetLocationId = input.locationId
  if (!targetLocationId) {
    const mainLocation = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.code, "MAIN"),
    })
    if (!mainLocation) {
      return { success: false, error: "Primary inventory location (MAIN) was not found." }
    }
    targetLocationId = mainLocation.id
  }

  try {
    await adjustInventory({
      variantId: input.variantId,
      locationId: targetLocationId,
      movementType: "restock",
      quantity,
      referenceType: "manual_restock",
      reason: input.reason?.trim() || `Restocked ${quantity} units via Admin Dashboard`,
      performedBy: session.user?.id,
    })

    revalidatePath("/admin-dashboard/inventory")

    // Fetch refreshed inventory data to immediately sync client state
    const refreshed = await getInventory()

    return {
      success: true,
      message: `Successfully restocked ${quantity} unit${quantity > 1 ? "s" : ""}.`,
      data: refreshed,
    }
  } catch (error: any) {
    console.error("Restock error:", error)
    return {
      success: false,
      error: error?.message || "Failed to restock inventory.",
    }
  }
}
