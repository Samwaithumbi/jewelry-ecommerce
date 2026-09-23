"use server"

import { db } from "@/lib/db"
import { products, productImages } from "@/drizzle/src/db/schema"
import { eq, desc, and, inArray } from "drizzle-orm"

export async function getBestSellers() {
  try {
    const productsList = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePriceCents: products.basePriceCents,
        category: products.category,
        ratingAvg: products.ratingAvg,
        reviewCount: products.reviewCount,
        featured: products.featured,
      })
      .from(products)
      .where(and(eq(products.active, true), eq(products.featured, true)))
      .orderBy(desc(products.reviewCount))
      .limit(8)

    // Get primary images for these products
    const productIds = productsList.map((p) => p.id)
    const images = productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(
            and(
              inArray(productImages.productId, productIds),
              eq(productImages.isPrimary, true)
            )
          )
      : []

    const imagesByProduct = images.reduce<Record<string, string>>(
      (acc, img) => {
        acc[img.productId] = img.url
        return acc
      },
      {}
    )

    return productsList.map((product) => ({
      ...product,
      images: imagesByProduct[product.id] ? [{ url: imagesByProduct[product.id], altText: product.name }] : [],
      badge: "Best Seller" as const,
      originalPriceCents: null,
    }))
  } catch (error) {
    console.error('Failed to get best sellers:', error)
    return []
  }
}

export async function getNewArrivals() {
  try {
    const productsList = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        basePriceCents: products.basePriceCents,
        category: products.category,
        ratingAvg: products.ratingAvg,
        reviewCount: products.reviewCount,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(eq(products.active, true))
      .orderBy(desc(products.createdAt))
      .limit(8)

    // Get primary images for these products
    const productIds = productsList.map((p) => p.id)
    const images = productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
          })
          .from(productImages)
          .where(
            and(
              inArray(productImages.productId, productIds),
              eq(productImages.isPrimary, true)
            )
          )
      : []

    const imagesByProduct = images.reduce<Record<string, string>>(
      (acc, img) => {
        acc[img.productId] = img.url
        return acc
      },
      {}
    )

    return productsList.map((product) => ({
      ...product,
      images: imagesByProduct[product.id] ? [{ url: imagesByProduct[product.id], altText: product.name }] : [],
      badge: "New Arrival" as const,
      originalPriceCents: null,
    }))
  } catch (error) {
    console.error('Failed to get new arrivals:', error)
    return []
  }
}
