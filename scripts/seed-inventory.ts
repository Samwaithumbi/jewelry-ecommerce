// scripts/seed-inventory.ts
// Seed script to create initial inventory location and migrate existing stock

import 'dotenv/config';
import { db } from "@/lib/db";
import { inventoryLocations, inventoryLevels, inventoryMovements } from "@/drizzle/src/db/inventory-schema";
import { productVariants } from "@/drizzle/src/db/schema";

async function seedInventory() {
  console.log("Starting inventory seed...");

  try {
    // Step 1: Create MAIN warehouse location
    console.log("Creating MAIN warehouse location...");
    
    const existingLocation = await db.query.inventoryLocations.findFirst({
      where: (locations, { eq }) => eq(locations.code, "MAIN"),
    });

    let mainLocationId: string;

    if (existingLocation) {
      console.log("MAIN location already exists, using existing:", existingLocation.id);
      mainLocationId = existingLocation.id;
    } else {
      const [newLocation] = await db
        .insert(inventoryLocations)
        .values({
          id: crypto.randomUUID(),
          name: "Main Warehouse",
          code: "MAIN",
          type: "warehouse",
          active: true,
        })
        .returning();
      
      mainLocationId = newLocation.id;
      console.log("Created MAIN location:", mainLocationId);
    }

    // Step 2: Create inventory levels for all active variants
    console.log("Creating inventory levels for all variants...");
    
    const variants = await db.query.productVariants.findMany({
      where: (variants, { eq }) => eq(variants.active, true),
    });

    console.log(`Found ${variants.length} active variants`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const variant of variants) {
      // Check if inventory level already exists
      const existingLevel = await db.query.inventoryLevels.findFirst({
        where: (levels, { and, eq }) => 
          and(
            eq(levels.variantId, variant.id),
            eq(levels.locationId, mainLocationId)
          ),
      });

      if (existingLevel) {
        console.log(`Inventory level already exists for SKU ${variant.sku}, skipping`);
        skippedCount++;
        continue;
      }

      // Create inventory level with zero stock (admin will adjust later)
      await db.insert(inventoryLevels).values({
        id: crypto.randomUUID(),
        variantId: variant.id,
        locationId: mainLocationId,
        onHand: 0,
        reserved: 0,
        reorderPoint: 3,
        reorderQuantity: 0,
      });

      console.log(`Created inventory level for SKU ${variant.sku}: 0 units`);
      createdCount++;
    }

    console.log(`\n✅ Seed completed:`);
    console.log(`   - Created ${createdCount} inventory levels`);
    console.log(`   - Skipped ${skippedCount} existing inventory levels`);
    console.log(`   - Main location ID: ${mainLocationId}`);
    
    console.log("\n⚠️  IMPORTANT: All inventory levels start at 0 stock.");
    console.log("   Use the admin dashboard to adjust stock levels as needed.");

  } catch (error) {
    console.error("Seed failed:", error);
    throw error;
  }
}

// Run seed
seedInventory()
  .then(() => {
    console.log("✅ Inventory seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Inventory seed failed:", error);
    process.exit(1);
  });
