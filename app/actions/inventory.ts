"use server";

import { db } from "@/lib/db";
import { products, productVariants, productImages } from "@/drizzle/src/db/schema";
import { inventoryLevels, inventoryLocations } from "@/drizzle/src/db/inventory-schema";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { adjustInventory } from "@/lib/inventory/service";
import { requireAdminSession } from "@/lib/auth-guard";

export type InventoryItemDB = {
  id: string; // variant id (or product id if no variant)
  variantId: string;
  productId: string;
  sku: string;
  name: string;
  category: "Rings" | "Necklaces" | "Earrings" | "Bracelets";
  stock: number;
  reorderPoint: number;
  unitPrice: number;
  status: "Good" | "Low" | "Critical" | "Out of Stock";
  imageUrl: string | null;
};

// Map DB category string (e.g. "ring") to display category ("Rings")
function mapCategoryToDisplay(cat: string): "Rings" | "Necklaces" | "Earrings" | "Bracelets" {
  const lower = cat?.toLowerCase() || "";
  if (lower.includes("ring")) return "Rings";
  if (lower.includes("neck") || lower.includes("pendant")) return "Necklaces";
  if (lower.includes("earring")) return "Earrings";
  if (lower.includes("brace") || lower.includes("bangle")) return "Bracelets";
  return "Rings";
}

function mapDisplayToDBCategory(
  display: "Rings" | "Necklaces" | "Earrings" | "Bracelets"
): "ring" | "necklace" | "earring" | "bracelet" {
  switch (display) {
    case "Rings":
      return "ring";
    case "Necklaces":
      return "necklace";
    case "Earrings":
      return "earring";
    case "Bracelets":
      return "bracelet";
    default:
      return "ring";
  }
}

function calculateStatus(stock: number, reorderPoint: number): "Good" | "Low" | "Critical" | "Out of Stock" {
  if (stock === 0) return "Out of Stock";
  if (stock <= Math.ceil(reorderPoint * 0.5)) return "Critical";
  if (stock <= reorderPoint) return "Low";
  return "Good";
}



export async function getInventoryItems(): Promise<InventoryItemDB[]> {
  try {
    // Get MAIN location
    const mainLocation = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.code, "MAIN"),
    });

    if (!mainLocation) {
      console.warn("MAIN inventory location not found. Please run seed script.");
      return [];
    }

    // 1. Fetch existing variants joined with products and inventory levels
    const variants = await db
      .select({
        variantId: productVariants.id,
        sku: productVariants.sku,
        productId: products.id,
        productName: products.name,
        category: products.category,
        onHand: inventoryLevels.onHand,
        reserved: inventoryLevels.reserved,
        reorderPoint: inventoryLevels.reorderPoint,
        basePriceCents: products.basePriceCents,
        priceAdjustCents: productVariants.priceAdjustCents,
        imageUrl: productImages.url,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .leftJoin(
        inventoryLevels,
        and(
          eq(inventoryLevels.variantId, productVariants.id),
          eq(inventoryLevels.locationId, mainLocation.id)
        )
      )
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
      );

    // 2. Fetch all products to check for products without variants
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        category: products.category,
        basePriceCents: products.basePriceCents,
        slug: products.slug,
        imageUrl: productImages.url,
      })
      .from(products)
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
      );


    // If there are products without variants, create a variant for each so they're tracked
    const variantProductIds = new Set(variants.map((v) => v.productId));
    for (const prod of allProducts) {
      if (!variantProductIds.has(prod.id)) {
        const generatedSku = `LJ-${prod.category.toUpperCase().slice(0, 4)}-${prod.id.slice(0, 4).toUpperCase()}`;
        try {
          const [newVariant] = await db
            .insert(productVariants)
            .values({
              productId: prod.id,
              sku: generatedSku,
              priceAdjustCents: 0,
              active: true,
            })
            .returning();

          if (newVariant) {
            // Create inventory level
            await db.insert(inventoryLevels).values({
              variantId: newVariant.id,
              locationId: mainLocation.id,
              onHand: 5,
              reserved: 0,
              reorderPoint: 3,
              reorderQuantity: 0,
            });

            variants.push({
              variantId: newVariant.id,
              sku: newVariant.sku,
              productId: prod.id,
              productName: prod.name,
              category: prod.category,
              onHand: 5,
              reserved: 0,
              reorderPoint: 3,
              basePriceCents: prod.basePriceCents,
              priceAdjustCents: newVariant.priceAdjustCents,
              imageUrl: prod.imageUrl,
            });
          }
        } catch {
          // Ignore duplicate SKU collisions
        }
      }
    }

    // 3. Format into InventoryItemDB
    return variants.map((v) => {
      const onHand = v.onHand ?? 0;
      const reserved = v.reserved ?? 0;
      const available = onHand - reserved;
      const reorderPoint = v.reorderPoint ?? 3;
      const unitPrice = Math.round(((v.basePriceCents ?? 0) + (v.priceAdjustCents ?? 0)) / 100);

      return {
        id: v.variantId,
        variantId: v.variantId,
        productId: v.productId,
        sku: v.sku,
        name: v.productName,
        category: mapCategoryToDisplay(v.category),
        stock: available, // Show available stock (on_hand - reserved)
        reorderPoint,
        unitPrice,
        status: calculateStatus(available, reorderPoint),
        imageUrl: v.imageUrl,
      };
    });
  } catch (err) {
    console.error("Error loading inventory from database:", err);
    // Return empty list if DB error occurs
    return [];
  }
}

export async function updateStockQty(variantId: string, newQty: number) {
  await requireAdminSession();
  try {
    // Get MAIN location
    const mainLocation = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.code, "MAIN"),
    });

    if (!mainLocation) {
      throw new Error("MAIN inventory location not found");
    }

    const currentLevel = await db.query.inventoryLevels.findFirst({
      where: and(
        eq(inventoryLevels.variantId, variantId),
        eq(inventoryLevels.locationId, mainLocation.id)
      ),
    });

    const qty = Math.max(0, newQty);
    const adjustment = qty - (currentLevel?.onHand ?? 0);

    if (adjustment !== 0) {
      await adjustInventory({
        variantId,
        locationId: mainLocation.id,
        movementType: "adjustment",
        quantity: adjustment,
        reason: "Manual stock adjustment via admin dashboard",
      });
    }

    revalidatePath("/admin-dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to update stock in DB:", error);
    throw new Error("Failed to update stock quantity");
  }
}

export async function restockVariant(variantId: string, addQty: number) {
  await requireAdminSession();
  try {
    const qty = Math.max(1, addQty);
    
    // Get MAIN location
    const mainLocation = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.code, "MAIN"),
    });

    if (!mainLocation) {
      throw new Error("MAIN inventory location not found");
    }

    await adjustInventory({
      variantId,
      locationId: mainLocation.id,
      movementType: "restock",
      quantity: qty,
      reason: "Restock via admin dashboard",
    });

    revalidatePath("/admin-dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to restock variant in DB:", error);
    throw new Error("Failed to restock item");
  }
}

export async function updateReorderPoint(variantId: string, threshold: number) {
  await requireAdminSession();
  try {
    // Get MAIN location
    const mainLocation = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.code, "MAIN"),
    });

    if (!mainLocation) {
      throw new Error("MAIN inventory location not found");
    }

    await db
      .update(inventoryLevels)
      .set({ reorderPoint: Math.max(1, threshold) })
      .where(
        and(
          eq(inventoryLevels.variantId, variantId),
          eq(inventoryLevels.locationId, mainLocation.id)
        )
      );

    revalidatePath("/admin-dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error("Failed to update reorder point in DB:", error);
    throw new Error("Failed to update reorder point");
  }
}

export async function createInventorySKU(data: {
  // Product Information
  name: string;
  category: "Rings" | "Necklaces" | "Earrings" | "Bracelets";
  metal: "gold" | "silver" | "platinum" | "rose_gold" | "white_gold";
  purity: "9k" | "14k" | "18k" | "24k" | "925" | "950";
  
  // Variant
  sku: string;
  size?: string;
  unitPrice: number;
  
  // Inventory
  location?: string; // defaults to MAIN
  initialStock: number;
  reorderPoint?: number;
}) {
  await requireAdminSession();
  try {
    const dbCategory = mapDisplayToDBCategory(data.category);
    const slug = `${data.sku.toLowerCase()}-${Date.now()}`;

    // Get inventory location (default to MAIN)
    const locationCode = data.location || "MAIN";
    const inventoryLocation = await db.query.inventoryLocations.findFirst({
      where: eq(inventoryLocations.code, locationCode),
    });

    if (!inventoryLocation) {
      throw new Error(`Inventory location '${locationCode}' not found. Using MAIN location.`);
    }

    // 1. Create product in products table
    const [newProduct] = await db
      .insert(products)
      .values({
        name: data.name,
        slug,
        description: `Fine jewelry piece: ${data.name}.`,
        metalType: data.metal,
        metalPurity: data.purity,
        basePriceCents: data.unitPrice * 100,
        weightGrams: "5.000",
        category: dbCategory,
        active: true,
      })
      .returning({ id: products.id });

    if (!newProduct) {
      throw new Error("Failed to create product");
    }

    // 2. Create product variant in productVariants table
    const [newVariant] = await db
      .insert(productVariants)
      .values({
        productId: newProduct.id,
        sku: data.sku,
        size: data.size,
        priceAdjustCents: 0,
        active: true,
      })
      .returning();

    // 3. Create inventory level
    await db.insert(inventoryLevels).values({
      variantId: newVariant.id,
      locationId: inventoryLocation.id,
      onHand: data.initialStock,
      reserved: 0,
      reorderPoint: data.reorderPoint || 3,
      reorderQuantity: 0,
    });

    // 4. Create initial movement
    const { inventoryMovements } = await import("@/drizzle/src/db/inventory-schema");
    await db.insert(inventoryMovements).values({
      variantId: newVariant.id,
      locationId: inventoryLocation.id,
      movementType: "restock",
      quantity: data.initialStock,
      referenceType: "admin",
      reason: "Initial stock from SKU creation",
    });

    revalidatePath("/admin-dashboard/inventory");
    return {
      success: true,
      id: newVariant.id,
      variantId: newVariant.id,
      productId: newProduct.id,
    };
  } catch (error) {
    console.error("Failed to create SKU in DB:", error);
    throw new Error("Failed to create new SKU in database");
  }
}
