// src/db/inventory-schema.ts
// Production inventory system — separate module for inventory management

import {
    pgTable, pgEnum, uuid, varchar, text, integer,
    smallint, boolean, timestamp, index, uniqueIndex
  } from "drizzle-orm/pg-core";
  
  // ── Inventory Enums ───────────────────────────────────────────────────────────────
  export const reservationStatusEnum = pgEnum("reservation_status", ["active","confirmed","released","expired","cancelled"]);
  export const inventoryMovementTypeEnum = pgEnum("inventory_movement_type", ["purchase","sale","return","restock","adjustment","damage","loss","transfer_in","transfer_out"]);

  const ts = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
  const tsUpdatable = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

  // ── Inventory Locations ─────────────────────────────────────────────────────────
  // Even with one location, this enables multi-location in future
  export const inventoryLocations = pgTable("inventory_locations", {
    id:        uuid("id").primaryKey().defaultRandom(),
    name:      varchar("name", { length: 100 }).notNull(),
    code:      varchar("code", { length: 30 }).unique().notNull(),
    type:      varchar("type", { length: 30 }).notNull(), // warehouse, store, display, damaged, transit
    active:    boolean("active").default(true).notNull(),
    createdAt: ts(),
    updatedAt: tsUpdatable(),
  }, (t: any) => ({
    codeIdx: uniqueIndex("inventory_locations_code_idx").on(t.code),
    activeIdx: index("inventory_locations_active_idx").on(t.active),
  }));

  // ── Inventory Levels ─────────────────────────────────────────────────────────────
  // Current snapshot of inventory for each variant at each location
  export const inventoryLevels = pgTable("inventory_levels", {
    id:             uuid("id").primaryKey().defaultRandom(),
    variantId:      uuid("variant_id").notNull(),
    locationId:     uuid("location_id").notNull(),
    onHand:         integer("on_hand").notNull().default(0),
    reserved:       integer("reserved").notNull().default(0),
    reorderPoint:   integer("reorder_point").notNull().default(0),
    reorderQuantity: integer("reorder_quantity").notNull().default(0),
    createdAt:      ts(),
    updatedAt:      tsUpdatable(),
  }, (t: any) => ({
    variantLocationUnique: uniqueIndex("inventory_levels_unique").on(t.variantId, t.locationId),
    variantIdx: index("inventory_levels_variant_idx").on(t.variantId),
    locationIdx: index("inventory_levels_location_idx").on(t.locationId),
  }));

  // ── Inventory Movements ─────────────────────────────────────────────────────────
  // Immutable audit ledger of all inventory changes
  export const inventoryMovements = pgTable("inventory_movements", {
    id:            uuid("id").primaryKey().defaultRandom(),
    variantId:     uuid("variant_id").notNull(),
    locationId:    uuid("location_id").notNull(),
    movementType:  inventoryMovementTypeEnum("movement_type").notNull(),
    quantity:      integer("quantity").notNull(),
    referenceType: varchar("reference_type", { length: 50 }), // order, adjustment, purchase_order
    referenceId:   uuid("reference_id"),
    reason:        text("reason"),
    performedBy:   uuid("performed_by"),
    createdAt:     ts(),
  }, (t: any) => ({
    variantIdx: index("inventory_movements_variant_idx").on(t.variantId),
    locationIdx: index("inventory_movements_location_idx").on(t.locationId),
    movementTypeIdx: index("inventory_movements_type_idx").on(t.movementType),
    referenceIdx: index("inventory_movements_reference_idx").on(t.referenceType, t.referenceId),
    createdIdx: index("inventory_movements_created_idx").on(t.createdAt),
  }));

  // ── Inventory Reservations ───────────────────────────────────────────────────────
  // Temporary holds on inventory during checkout
  export const inventoryReservations = pgTable("inventory_reservations", {
    id:        uuid("id").primaryKey().defaultRandom(),
    userId:    uuid("user_id"),
    orderId:   uuid("order_id"),
    status:    reservationStatusEnum("status").default("active").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: ts(),
    updatedAt: tsUpdatable(),
  }, (t: any) => ({
    userIdx: index("inventory_reservations_user_idx").on(t.userId),
    orderIdx: index("inventory_reservations_order_idx").on(t.orderId),
    statusIdx: index("inventory_reservations_status_idx").on(t.status),
    expiresIdx: index("inventory_reservations_expires_idx").on(t.expiresAt),
  }));

  // ── Inventory Reservation Items ───────────────────────────────────────────────────
  // Individual items within a reservation
  export const inventoryReservationItems = pgTable("inventory_reservation_items", {
    id:            uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id").notNull(),
    variantId:     uuid("variant_id").notNull(),
    locationId:    uuid("location_id").notNull(),
    quantity:      integer("quantity").notNull(),
  }, (t: any) => ({
    reservationIdx: index("inventory_reservation_items_reservation_idx").on(t.reservationId),
    variantIdx: index("inventory_reservation_items_variant_idx").on(t.variantId),
    locationIdx: index("inventory_reservation_items_location_idx").on(t.locationId),
  }));
