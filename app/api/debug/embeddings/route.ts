import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/drizzle/src/db/schema";
import { desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const diagnostics: Record<string, any> = {
    voyageApiKeyConfigured: Boolean(process.env.VOYAGE_API_KEY),
    voyageModelEnv: process.env.VOYAGE_MODEL || "voyage-4-lite",
  };

  // 1. Check Database Vector Extension & Column Type
  try {
    const extCheck = await db.execute(sql`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
    `);
    diagnostics.pgVectorExtension = extCheck.rows;

    const colCheck = await db.execute(sql`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'embedding';
    `);
    diagnostics.embeddingColumnInfo = colCheck.rows;
  } catch (err: any) {
    diagnostics.dbExtensionCheckError = err.message || String(err);
  }

  // 2. Optional: backfill missing products if requested
  const { searchParams } = new URL(req.url);
  if (searchParams.get("backfill") === "true") {
    const { backfillMissingEmbeddings } = await import("@/lib/products/vectorstorage");
    try {
      diagnostics.backfillResult = await backfillMissingEmbeddings(20);
    } catch (err: any) {
      diagnostics.backfillError = err.message || String(err);
    }
  }

  // 3. Query all active products and their embedding status
  try {
    const allProductsStatus = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        category: products.category,
        createdAt: products.createdAt,
        hasEmbedding: sql<boolean>`${products.embedding} IS NOT NULL`,
      })
      .from(products)
      .where(sql`${products.active} = true`)
      .orderBy(desc(products.createdAt));

    diagnostics.totalActiveProducts = allProductsStatus.length;
    diagnostics.productsWithEmbedding = allProductsStatus.filter((p) => p.hasEmbedding).length;
    diagnostics.productsMissingEmbedding = allProductsStatus.filter((p) => !p.hasEmbedding).length;
    diagnostics.products = allProductsStatus;

    // 4. Optional: Test semantic vector search via ?q=your+query
    const testQuery = searchParams.get("q");
    if (testQuery && testQuery.trim()) {
      const { searchSimilarProducts } = await import("@/lib/products/vectorstorage");
      try {
        diagnostics.testSemanticSearch = {
          query: testQuery.trim(),
          results: await searchSimilarProducts(testQuery.trim(), {
            limit: 5,
            similarityThreshold: 0.2,
          }),
        };
      } catch (err: any) {
        diagnostics.testSemanticSearchError = err.message || String(err);
      }
    }
  } catch (err: any) {
    diagnostics.dbQueryError = err.message || String(err);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
