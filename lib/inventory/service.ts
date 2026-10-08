// lib/inventory/service.ts
// Production inventory service — single source of truth for inventory operations

import { db } from "@/lib/db";
import { 
  inventoryLevels, 
  inventoryMovements, 
  inventoryReservations, 
  inventoryReservationItems,
  inventoryLocations 
} from "@/drizzle/src/db/inventory-schema";
import { productVariants } from "@/drizzle/src/db/schema";
import { eq, and, sql, lt, gte, desc } from "drizzle-orm";

// ── Types ───────────────────────────────────────────────────────────────────────
export interface ReserveInventoryInput {
  orderId: string;
  userId?: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  expiresAt: Date;
}

export interface InventoryLevel {
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  available: number;
}

export interface MovementInput {
  variantId: string;
  locationId: string;
  movementType: "purchase" | "sale" | "return" | "restock" | "adjustment" | "damage" | "loss" | "transfer_in" | "transfer_out";
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  performedBy?: string;
}

// ── Errors ───────────────────────────────────────────────────────────────────────
export class InsufficientStockError extends Error {
  constructor(variantId: string, requested: number, available: number) {
    super(`Insufficient stock for variant ${variantId}: requested ${requested}, available ${available}`);
    this.name = "InsufficientStockError";
  }
}

export class ReservationNotFoundError extends Error {
  constructor(reservationId: string) {
    super(`Reservation ${reservationId} not found`);
    this.name = "ReservationNotFoundError";
  }
}

export class InvalidReservationStateError extends Error {
  constructor(reservationId: string, currentStatus: string, expectedStatus: string) {
    super(`Reservation ${reservationId} is ${currentStatus}, expected ${expectedStatus}`);
    this.name = "InvalidReservationStateError";
  }
}

// ── Core Operations ───────────────────────────────────────────────────────────────

/**
 * Get available stock for a variant at a location
 * Available = onHand - reserved
 */
export async function getAvailableStock(
  variantId: string,
  locationId: string
): Promise<number> {
  const level = await db.query.inventoryLevels.findFirst({
    where: and(
      eq(inventoryLevels.variantId, variantId),
      eq(inventoryLevels.locationId, locationId)
    ),
  });

  if (!level) {
    return 0;
  }

  return level.onHand - level.reserved;
}

/**
 * Get inventory level details for a variant
 */
export async function getInventoryLevel(
  variantId: string,
  locationId: string
): Promise<InventoryLevel | null> {
  const level = await db.query.inventoryLevels.findFirst({
    where: and(
      eq(inventoryLevels.variantId, variantId),
      eq(inventoryLevels.locationId, locationId)
    ),
  });

  if (!level) {
    return null;
  }

  return {
    variantId: level.variantId,
    locationId: level.locationId,
    onHand: level.onHand,
    reserved: level.reserved,
    available: level.onHand - level.reserved,
  };
}

/**
 * Reserve inventory atomically
 * Note: Neon HTTP doesn't support transactions, so we use atomic SQL statements
 */
export async function reserveInventory(input: ReserveInventoryInput): Promise<string> {
  const reservationId = crypto.randomUUID();
  
  // Get default location (MAIN warehouse)
  const mainLocation = await db.query.inventoryLocations.findFirst({
    where: eq(inventoryLocations.code, "MAIN"),
  });

  if (!mainLocation) {
    throw new Error("Main inventory location not found. Please seed inventory locations first.");
  }

  // Create reservation record first
  await db.insert(inventoryReservations).values({
    id: reservationId,
    userId: input.userId,
    orderId: input.orderId,
    status: "active",
    expiresAt: input.expiresAt,
  });

  // Process each item
  for (const item of input.items) {
    // Atomic check and reserve using a single UPDATE statement
    const result = await db
      .update(inventoryLevels)
      .set({
        reserved: sql`${inventoryLevels.reserved} + ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryLevels.variantId, item.variantId),
          eq(inventoryLevels.locationId, mainLocation.id),
          sql`${inventoryLevels.onHand} - ${inventoryLevels.reserved} >= ${item.quantity}`
        )
      )
      .returning();

    if (result.length === 0) {
      // Get current stock for error message
      const current = await db.query.inventoryLevels.findFirst({
        where: and(
          eq(inventoryLevels.variantId, item.variantId),
          eq(inventoryLevels.locationId, mainLocation.id)
        ),
      });
      
      const available = current ? current.onHand - current.reserved : 0;
      
      // Rollback: delete the reservation we just created
      await db.delete(inventoryReservations).where(eq(inventoryReservations.id, reservationId));
      
      throw new InsufficientStockError(item.variantId, item.quantity, available);
    }

    // Create reservation item
    await db.insert(inventoryReservationItems).values({
      id: crypto.randomUUID(),
      reservationId,
      variantId: item.variantId,
      locationId: mainLocation.id,
      quantity: item.quantity,
    });
  }

  return reservationId;
}

/**
 * Release a reservation (payment failed or cancelled)
 * Decreases reserved count, no inventory movement
 */
export async function releaseReservation(reservationId: string): Promise<void> {
  const reservation = await db.query.inventoryReservations.findFirst({
    where: eq(inventoryReservations.id, reservationId),
  });

  if (!reservation) {
    throw new ReservationNotFoundError(reservationId);
  }

  if (reservation.status !== "active") {
    throw new InvalidReservationStateError(
      reservationId,
      reservation.status,
      "active"
    );
  }

  // Get all reservation items
  const items = await db.query.inventoryReservationItems.findMany({
    where: eq(inventoryReservationItems.reservationId, reservationId),
  });

  // Release each item
  for (const item of items) {
    await db
      .update(inventoryLevels)
      .set({
        reserved: sql`${inventoryLevels.reserved} - ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryLevels.variantId, item.variantId),
          eq(inventoryLevels.locationId, item.locationId)
        )
      );
  }

  // Update reservation status
  await db
    .update(inventoryReservations)
    .set({
      status: "released",
      updatedAt: new Date(),
    })
    .where(eq(inventoryReservations.id, reservationId));
}

/**
 * Confirm a reservation (payment successful)
 * Decreases reserved, decreases onHand, creates sale movement
 */
export async function confirmReservation(reservationId: string, performedBy?: string): Promise<void> {
  const reservation = await db.query.inventoryReservations.findFirst({
    where: eq(inventoryReservations.id, reservationId),
  });

  if (!reservation) {
    throw new ReservationNotFoundError(reservationId);
  }

  if (reservation.status !== "active") {
    throw new InvalidReservationStateError(
      reservationId,
      reservation.status,
      "active"
    );
  }

  // Get all reservation items
  const items = await db.query.inventoryReservationItems.findMany({
    where: eq(inventoryReservationItems.reservationId, reservationId),
  });

  // Process each item
  for (const item of items) {
    // Decrease reserved and onHand
    await db
      .update(inventoryLevels)
      .set({
        reserved: sql`${inventoryLevels.reserved} - ${item.quantity}`,
        onHand: sql`${inventoryLevels.onHand} - ${item.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryLevels.variantId, item.variantId),
          eq(inventoryLevels.locationId, item.locationId)
        )
      );

    // Create sale movement
    await db.insert(inventoryMovements).values({
      id: crypto.randomUUID(),
      variantId: item.variantId,
      locationId: item.locationId,
      movementType: "sale",
      quantity: -item.quantity,
      referenceType: "order",
      referenceId: reservation.orderId,
      reason: "Sale from confirmed reservation",
      performedBy,
    });
  }

  // Update reservation status
  await db
    .update(inventoryReservations)
    .set({
      status: "confirmed",
      updatedAt: new Date(),
    })
    .where(eq(inventoryReservations.id, reservationId));
}

/**
 * Adjust inventory (admin operation)
 * Creates movement and updates onHand
 */
export async function adjustInventory(input: MovementInput): Promise<void> {
  // Create movement
  await db.insert(inventoryMovements).values({
    id: crypto.randomUUID(),
    variantId: input.variantId,
    locationId: input.locationId,
    movementType: input.movementType,
    quantity: input.quantity,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    reason: input.reason,
    performedBy: input.performedBy,
  });

  // Update inventory level
  const level = await db.query.inventoryLevels.findFirst({
    where: and(
      eq(inventoryLevels.variantId, input.variantId),
      eq(inventoryLevels.locationId, input.locationId)
    ),
  });

  if (level) {
    // Update existing
    await db
      .update(inventoryLevels)
      .set({
        onHand: sql`${inventoryLevels.onHand} + ${input.quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryLevels.variantId, input.variantId),
          eq(inventoryLevels.locationId, input.locationId)
        )
      );
  } else {
    // Create new
    await db.insert(inventoryLevels).values({
      id: crypto.randomUUID(),
      variantId: input.variantId,
      locationId: input.locationId,
      onHand: Math.max(0, input.quantity),
      reserved: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
    });
  }
}

/**
 * Return inventory (after order cancellation/refund)
 * Increases onHand, creates return movement
 */
export async function returnInventory(
  variantId: string,
  locationId: string,
  quantity: number,
  orderId: string,
  performedBy?: string
): Promise<void> {
  await db.transaction(async (tx) => {
    // Update inventory level
    await tx
      .update(inventoryLevels)
      .set({
        onHand: sql`${inventoryLevels.onHand} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(inventoryLevels.variantId, variantId),
          eq(inventoryLevels.locationId, locationId)
        )
      );

    // Create return movement
    await tx.insert(inventoryMovements).values({
      id: crypto.randomUUID(),
      variantId,
      locationId,
      movementType: "return",
      quantity,
      referenceType: "order",
      referenceId: orderId,
      reason: "Return/refund",
      performedBy,
    });
  });
}

/**
 * Expire reservations that have passed their expiration time
 * Should be called by a scheduled worker
 */
export async function expireReservations(): Promise<number> {
  const now = new Date();
  
  const expiredReservations = await db.query.inventoryReservations.findMany({
    where: and(
      eq(inventoryReservations.status, "active"),
      lt(inventoryReservations.expiresAt, now)
    ),
  });

  let expiredCount = 0;

  for (const reservation of expiredReservations) {
    try {
      await releaseReservation(reservation.id);
      
      // Update status to expired instead of released
      await db
        .update(inventoryReservations)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(inventoryReservations.id, reservation.id));
      
      expiredCount++;
    } catch (error) {
      console.error(`Failed to expire reservation ${reservation.id}:`, error);
    }
  }

  return expiredCount;
}

/**
 * Get low stock items (onHand - reserved <= reorderPoint)
 */
export async function getLowStockItems(locationId?: string) {
  const whereClause = locationId
    ? and(eq(inventoryLevels.locationId, locationId))
    : undefined;

  const lowStock = await db.query.inventoryLevels.findMany({
    where: whereClause,
    with: {
      variant: {
        with: {
          product: true,
        },
      },
    },
  });

  return lowStock.filter(
    (level) => level.onHand - level.reserved <= level.reorderPoint
  );
}

/**
 * Get out of stock items (available = 0)
 */
export async function getOutOfStockItems(locationId?: string) {
  const whereClause = locationId
    ? and(eq(inventoryLevels.locationId, locationId))
    : undefined;

  const levels = await db.query.inventoryLevels.findMany({
    where: whereClause,
  });

  return levels.filter((level) => level.onHand - level.reserved === 0);
}

/**
 * Get inventory movements for audit trail
 */
export async function getInventoryMovements(filters?: {
  variantId?: string;
  locationId?: string;
  movementType?: string;
  limit?: number;
  offset?: number;
}) {
  const whereConditions: any[] = [];

  if (filters?.variantId) {
    whereConditions.push(eq(inventoryMovements.variantId, filters.variantId));
  }
  if (filters?.locationId) {
    whereConditions.push(eq(inventoryMovements.locationId, filters.locationId));
  }
  if (filters?.movementType) {
    whereConditions.push(eq(inventoryMovements.movementType, filters.movementType as any));
  }

  const movements = await db.query.inventoryMovements.findMany({
    where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
    orderBy: [desc(inventoryMovements.createdAt)],
    limit: filters?.limit || 100,
    offset: filters?.offset || 0,
  });

  return movements;
}
