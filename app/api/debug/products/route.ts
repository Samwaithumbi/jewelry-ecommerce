import { db } from "@/lib/db"
import { products, productImages } from "@/drizzle/src/db/schema"
import { sql, count, desc, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
  }

  try {
    // Check for products with duplicate names
    const duplicateNames = await db
      .select({
        name: products.name,
        count: count(),
      })
      .from(products)
      .groupBy(products.name)
      .having(sql`${count()} > 1`)
      .orderBy(desc(count()))

    // Check for products with duplicate slugs
    const duplicateSlugs = await db
      .select({
        slug: products.slug,
        count: count(),
      })
      .from(products)
      .groupBy(products.slug)
      .having(sql`${count()} > 1`)
      .orderBy(desc(count()))

    // Show total products and images
    const totalProducts = await db.select({ count: count() }).from(products)
    const totalImages = await db.select({ count: count() }).from(productImages)

    // Show sample products with their image counts
    const productImageCounts = await db
      .select({
        productId: products.id,
        name: products.name,
        imageCount: count(productImages.id),
      })
      .from(products)
      .leftJoin(productImages, eq(products.id, productImages.productId))
      .groupBy(products.id, products.name)
      .orderBy(desc(count(productImages.id)))
      .limit(10)

    return NextResponse.json({
      duplicateNames,
      duplicateSlugs,
      totalProducts: totalProducts[0].count,
      totalImages: totalImages[0].count,
      averageImagesPerProduct: totalProducts[0].count > 0 
        ? (totalImages[0].count / totalProducts[0].count).toFixed(2)
        : 0,
      topProductsByImageCount: productImageCounts,
    })
  } catch (error) {
    console.error("Error checking duplicates:", error)
    return NextResponse.json({ error: "Failed to check duplicates" }, { status: 500 })
  }
}
