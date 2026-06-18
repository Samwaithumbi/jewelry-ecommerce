"use server";

import { db } from "@/lib/db";
import { products, productImages } from "@/drizzle/src/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ProductFormValues } from "@/lib/validations";

export async function createProduct(data: ProductFormValues) {
  const result = await db.insert(products).values({
    name: data.name,
    slug: data.slug,
    description: data.description,
    metalType: data.metalType,
    metalPurity: data.metalPurity,
    basePriceCents: data.basePriceCents,
    weightGrams: data.weightGrams.toString() as any, // decimal expects string
    category: data.category,
  }).returning({ id: products.id });

  const productId = result[0].id;

  if (data.imageUrl) {
    await db.insert(productImages).values({
      productId,
      url: data.imageUrl,
      position: 1,
      isPrimary: true,
    });
  }

  revalidatePath("/admin-dashboard/products");
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
