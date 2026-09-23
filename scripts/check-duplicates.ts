import { config } from "dotenv"
config({ path: ".env.local" })

import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { products, productImages } from "@/drizzle/src/db/schema"
import { sql, count, desc, eq } from "drizzle-orm"

const sqlClient = neon(process.env.DATABASE_URL!)
const db = drizzle(sqlClient)

async function checkDuplicates() {
  console.log("Checking for duplicate products...\n")

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

  if (duplicateNames.length > 0) {
    console.log("❌ Found duplicate product names:")
    duplicateNames.forEach((dup) => {
      console.log(`  - "${dup.name}" appears ${dup.count} times`)
    })
  } else {
    console.log("✅ No duplicate product names found")
  }

  console.log("\n---\n")

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

  if (duplicateSlugs.length > 0) {
    console.log("❌ Found duplicate product slugs:")
    duplicateSlugs.forEach((dup) => {
      console.log(`  - "${dup.slug}" appears ${dup.count} times`)
    })
  } else {
    console.log("✅ No duplicate product slugs found")
  }

  console.log("\n---\n")

  // Show total products and images
  const totalProducts = await db.select({ count: count() }).from(products)
  const totalImages = await db.select({ count: count() }).from(productImages)

  console.log(`📊 Total products: ${totalProducts[0].count}`)
  console.log(`📊 Total product images: ${totalImages[0].count}`)
  console.log(`📊 Average images per product: ${(totalImages[0].count / totalProducts[0].count).toFixed(2)}`)

  console.log("\n---\n")

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

  console.log("Top 10 products by image count:")
  productImageCounts.forEach((p) => {
    console.log(`  - "${p.name}" (${p.imageCount} images)`)
  })

  process.exit(0)
}

checkDuplicates().catch((error) => {
  console.error("Error checking duplicates:", error)
  process.exit(1)
})
