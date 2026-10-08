// scripts/migrate-inventory.ts
// Migration script to add inventory tables and update existing schema

import 'dotenv/config';
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { productVariants } from "@/drizzle/src/db/schema";

async function migrateInventory() {
  console.log("Starting inventory migration...");

  try {
    // Create inventory tables with proper constraints
    console.log("Creating inventory_locations table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_locations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL,
        code varchar(30) NOT NULL UNIQUE,
        type varchar(30) NOT NULL,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    console.log("Creating inventory_levels table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_levels (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_id uuid NOT NULL,
        location_id uuid NOT NULL,
        on_hand integer NOT NULL DEFAULT 0,
        reserved integer NOT NULL DEFAULT 0,
        reorder_point integer NOT NULL DEFAULT 0,
        reorder_quantity integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT inventory_levels_unique UNIQUE (variant_id, location_id),
        CONSTRAINT inventory_on_hand_nonnegative CHECK (on_hand >= 0),
        CONSTRAINT inventory_reserved_nonnegative CHECK (reserved >= 0),
        CONSTRAINT inventory_reserved_not_exceed_on_hand CHECK (reserved <= on_hand)
      );
    `);

    console.log("Creating inventory_movements table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_id uuid NOT NULL,
        location_id uuid NOT NULL,
        movement_type varchar(30) NOT NULL,
        quantity integer NOT NULL,
        reference_type varchar(50),
        reference_id uuid,
        reason text,
        performed_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT inventory_movement_quantity_nonzero CHECK (quantity <> 0)
      );
    `);

    console.log("Creating inventory_reservations table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_reservations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid,
        order_id uuid,
        status varchar(30) NOT NULL DEFAULT 'active',
        expires_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    console.log("Creating inventory_reservation_items table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS inventory_reservation_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        reservation_id uuid NOT NULL,
        variant_id uuid NOT NULL,
        location_id uuid NOT NULL,
        quantity integer NOT NULL,
        CONSTRAINT reservation_quantity_positive CHECK (quantity > 0)
      );
    `);

    // Create indexes
    console.log("Creating indexes...");
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_locations_code_idx ON inventory_locations(code)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_locations_active_idx ON inventory_locations(active)`);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_levels_variant_idx ON inventory_levels(variant_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_levels_location_idx ON inventory_levels(location_id)`);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_movements_variant_idx ON inventory_movements(variant_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_movements_location_idx ON inventory_movements(location_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_movements_type_idx ON inventory_movements(movement_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_movements_reference_idx ON inventory_movements(reference_type, reference_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_movements_created_idx ON inventory_movements(created_at)`);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_reservations_user_idx ON inventory_reservations(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_reservations_order_idx ON inventory_reservations(order_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_reservations_status_idx ON inventory_reservations(status)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_reservations_expires_idx ON inventory_reservations(expires_at)`);

    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_reservation_items_reservation_idx ON inventory_reservation_items(reservation_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_reservation_items_variant_idx ON inventory_reservation_items(variant_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS inventory_reservation_items_location_idx ON inventory_reservation_items(location_id)`);

    // Add foreign key constraints (PostgreSQL doesn't support adding FKs with IF NOT EXISTS, so we check first)
    console.log("Adding foreign key constraints...");
    
    // Check if FKs exist before adding
    const checkFK = async (tableName: string, fkName: string) => {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 
          FROM pg_constraint 
          WHERE conname = ${fkName}
        );
      `);
      return result.rows[0].exists;
    };

    // Add FK for inventory_levels.variant_id
    if (!(await checkFK('inventory_levels', 'inventory_levels_variant_fkey'))) {
      await db.execute(sql`
        ALTER TABLE inventory_levels 
        ADD CONSTRAINT inventory_levels_variant_fkey 
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT;
      `);
    }

    // Add FK for inventory_levels.location_id
    if (!(await checkFK('inventory_levels', 'inventory_levels_location_fkey'))) {
      await db.execute(sql`
        ALTER TABLE inventory_levels 
        ADD CONSTRAINT inventory_levels_location_fkey 
        FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE RESTRICT;
      `);
    }

    // Add FK for inventory_movements.variant_id
    if (!(await checkFK('inventory_movements', 'inventory_movements_variant_fkey'))) {
      await db.execute(sql`
        ALTER TABLE inventory_movements 
        ADD CONSTRAINT inventory_movements_variant_fkey 
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT;
      `);
    }

    // Add FK for inventory_movements.location_id
    if (!(await checkFK('inventory_movements', 'inventory_movements_location_fkey'))) {
      await db.execute(sql`
        ALTER TABLE inventory_movements 
        ADD CONSTRAINT inventory_movements_location_fkey 
        FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE RESTRICT;
      `);
    }

    // Add FK for inventory_reservations.user_id
    if (!(await checkFK('inventory_reservations', 'inventory_reservations_user_fkey'))) {
      await db.execute(sql`
        ALTER TABLE inventory_reservations 
        ADD CONSTRAINT inventory_reservations_user_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
      `);
    }

    // Add FK for inventory_reservations.order_id
    if (!(await checkFK('inventory_reservations', 'inventory_reservations_order_fkey'))) {
      await db.execute(sql`
        ALTER TABLE inventory_reservations 
        ADD CONSTRAINT inventory_reservations_order_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;
      `);
    }

    // Add FK for inventory_reservation_items.reservation_id
    if (!(await checkFK('inventory_reservation_items', 'inventory_reservation_items_reservation_fkey'))) {
      await db.execute(sql`
        ALTER TABLE inventory_reservation_items 
        ADD CONSTRAINT inventory_reservation_items_reservation_fkey 
        FOREIGN KEY (reservation_id) REFERENCES inventory_reservations(id) ON DELETE CASCADE;
      `);
    }

    // Add FK for inventory_reservation_items.variant_id
    if (!(await checkFK('inventory_reservation_items', 'inventory_reservation_items_variant_fkey'))) {
      await db.execute(sql`
        ALTER TABLE inventory_reservation_items 
        ADD CONSTRAINT inventory_reservation_items_variant_fkey 
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT;
      `);
    }

    // Add FK for inventory_reservation_items.location_id
    if (!(await checkFK('inventory_reservation_items', 'inventory_reservation_items_location_fkey'))) {
      await db.execute(sql`
        ALTER TABLE inventory_reservation_items 
        ADD CONSTRAINT inventory_reservation_items_location_fkey 
        FOREIGN KEY (location_id) REFERENCES inventory_locations(id) ON DELETE RESTRICT;
      `);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration
migrateInventory()
  .then(() => {
    console.log("✅ Inventory migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Inventory migration failed:", error);
    process.exit(1);
  });
