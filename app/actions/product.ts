"use server";

import { db } from "@/lib/db";
import { products, productImages, productVariants } from "@/drizzle/src/db/schema";
import { inventoryLevels, inventoryLocations, inventoryMovements } from "@/drizzle/src/db/inventory-schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ProductFormValues } from "@/lib/validations";

export async function createProduct(data: ProductFormValues & {
  sku?: string;
  size?: string;
  priceAdjustCents?: number;
  location?: string;
  initialStock?: number;
  reorderPoint?: number;
}) {
  // 1. Create product
  const result = await db.insert(products).values({
    name: data.name,
    slug: data.slug,
    description: data.description,
    metalType: data.metalType,
    metalPurity: data.metalPurity,
    basePriceCents: data.basePriceCents,
    weightGrams: data.weightGrams.toString() as any,
    category: data.category,
  }).returning({ id: products.id });

  const productId = result[0].id;

  // 2. Create product image if provided
  if (data.imageUrl) {
    await db.insert(productImages).values({
      productId,
      url: data.imageUrl,
      position: 1,
      isPrimary: true,
    });
  }

  // 3. Create variant if SKU is provided
  if (data.sku) {
    const [newVariant] = await db.insert(productVariants).values({
      productId,
      sku: data.sku,
      size: data.size,
      priceAdjustCents: data.priceAdjustCents || 0,
      active: true,
    }).returning();

    // 4. Create inventory level if initial stock is provided
    if (data.initialStock !== undefined) {
      const locationCode = data.location || "MAIN";
      const inventoryLocation = await db.query.inventoryLocations.findFirst({
        where: eq(inventoryLocations.code, locationCode),
      });

      if (inventoryLocation) {
        await db.insert(inventoryLevels).values({
          variantId: newVariant.id,
          locationId: inventoryLocation.id,
          onHand: data.initialStock,
          reserved: 0,
          reorderPoint: data.reorderPoint || 3,
          reorderQuantity: 0,
        });

        // 5. Create initial movement for audit trail
        await db.insert(inventoryMovements).values({
          variantId: newVariant.id,
          locationId: inventoryLocation.id,
          movementType: "restock",
          quantity: data.initialStock,
          referenceType: "admin",
          reason: "Initial stock from product creation",
        });
      }
    }
  }

  revalidatePath("/admin-dashboard/products");
  revalidatePath("/admin-dashboard/inventory");
  return result[0];
}

export async function updateProduct(id: string, data: ProductFormValues) {
  await db.update(products).set({
    name: data.name,
    slug: data.slug,
    description: data.description,
    metalType: data.metalType,
    metalPurity: data.metalPurity,
    basePriceCents: data.basePriceCents,
    weightGrams: data.weightGrams.toString() as any,
    category: data.category,
    updatedAt: new Date(),
  }).where(eq(products.id, id));

  if (data.imageUrl) {
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.insert(productImages).values({
      productId: id,
      url: data.imageUrl,
      position: 1,
      isPrimary: true,
    });
  }

  revalidatePath("/admin-dashboard/products");
  revalidatePath(`/admin-dashboard/products/${id}/edit`);
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin-dashboard/products");
}
