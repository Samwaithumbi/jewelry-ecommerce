import { db } from "@/lib/db";
import { products, productImages } from "@/drizzle/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProductsClient } from "@/components/admin/products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  // Fetch products and their primary images
  const dbProducts = await db
    .select({
      product: products,
      imageUrl: productImages.url,
    })
    .from(products)
    .leftJoin(productImages, eq(products.id, productImages.productId))
    .orderBy(desc(products.createdAt));

  // Deduplicate products in case of multiple images
  const productMap = new Map();
  for (const row of dbProducts) {
    if (!productMap.has(row.product.id)) {
      productMap.set(row.product.id, {
        ...row.product,
        image: row.imageUrl || "https://images.unsplash.com/photo-1605100804763-247f661c4480?w=200&q=80",
      });
    }
  }
  const productsList = Array.from(productMap.values());

  return <ProductsClient initialProducts={productsList} />;
}