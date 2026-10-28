/**
 * lib/products/vectorstorage.ts
 * Complete pgvector product embeddings pipeline:
 * - Single product embedding & storage
 * - Batched embedding & backfill
 * - Cosine similarity semantic search
 */

import { eq, isNull, isNotNull, and, lte, sql, inArray } from "drizzle-orm";
import { cosineDistance } from "drizzle-orm/sql/functions/vector";

import { db } from "@/lib/db";
import { products, productImages, productVariants } from "@/drizzle/src/db/schema";
import { embedText, embedTexts } from "@/lib/embeddings/embeddings";
import {
  buildProductEmbeddingText,
  type ProductForEmbedding,
  type ProductVariantForEmbedding,
} from "@/lib/products/embed";

export interface SimilarProductResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDesc: string | null;
  category: string;
  metalType: string;
  metalPurity: string;
  basePriceCents: number;
  ratingAvg: string | null;
  reviewCount: number | null;
  similarity: number; // 0 to 1
  imageUrl: string | null;
}

export interface SemanticSearchFilters {
  category?: string;
  metalType?: string;
  maxPriceCents?: number;
  similarityThreshold?: number; // Minimum cosine similarity (e.g. 0.35)
  limit?: number;
}

/**
 * Generate embedding for a single product and update its record in the database.
 */
export async function embedAndSaveProduct(
  product: ProductForEmbedding & { id: string }
): Promise<{ id: string; dimensions: number; success: boolean }> {
  try {
    const text = buildProductEmbeddingText(product);
    const embedding = await embedText(text, { inputType: "document" });

    await db
      .update(products)
      .set({
        embedding,
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    return {
      id: product.id,
      dimensions: embedding.length,
      success: true,
    };
  } catch (error: any) {
    console.error(`[pgvector] Failed to embed product ${product.id}:`, error);
    throw error;
  }
}

/**
 * Embed multiple products in high-throughput batches.
 */
export async function batchEmbedAndSaveProducts(
  productList: (ProductForEmbedding & { id: string })[]
): Promise<{ processed: number; errors: number }> {
  if (productList.length === 0) return { processed: 0, errors: 0 };

  let processed = 0;
  let errors = 0;

  // 1. Prepare texts for all products
  const texts = productList.map((p) => buildProductEmbeddingText(p));

  try {
    // 2. Fetch embeddings in batch from Voyage AI
    const embeddings = await embedTexts(texts, { inputType: "document" });

    // 3. Save each embedding to PostgreSQL
    for (let i = 0; i < productList.length; i++) {
      const p = productList[i];
      const emb = embeddings[i];
      try {
        await db
          .update(products)
          .set({
            embedding: emb,
            updatedAt: new Date(),
          })
          .where(eq(products.id, p.id));
        processed++;
      } catch (dbErr) {
        console.error(`[pgvector] DB update error for product ${p.id}:`, dbErr);
        errors++;
      }
    }
  } catch (apiErr) {
    console.error("[pgvector] Batch embedding API call failed:", apiErr);
    throw apiErr;
  }

  return { processed, errors };
}

/**
 * Backfill embeddings for products that do not yet have an embedding.
 * @param batchSize Number of products to process in this run (default 50)
 */
export async function backfillMissingEmbeddings(
  batchSize = 50
): Promise<{
  totalMissing: number;
  processed: number;
  remaining: number;
}> {
  // 1. Find products without embeddings
  const unindexedProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      shortDesc: products.shortDesc,
      category: products.category,
      metalType: products.metalType,
      metalPurity: products.metalPurity,
      basePriceCents: products.basePriceCents,
      weightGrams: products.weightGrams,
      occasionTags: products.occasionTags,
      styleTags: products.styleTags,
    })
    .from(products)
    .where(and(eq(products.active, true), isNull(products.embedding)))
    .limit(batchSize);

  if (unindexedProducts.length === 0) {
    return { totalMissing: 0, processed: 0, remaining: 0 };
  }

  // 2. Fetch variant stones for these products to enrich embeddings
  const productIds = unindexedProducts.map((p) => p.id);
  const variants = await db
    .select({
      productId: productVariants.productId,
      stoneType: productVariants.stoneType,
      stoneCarat: productVariants.stoneCarat,
      stoneCut: productVariants.stoneCut,
      stoneColor: productVariants.stoneColor,
      stoneClarity: productVariants.stoneClarity,
      size: productVariants.size,
    })
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds));

  const variantsByProduct = new Map<string, ProductVariantForEmbedding[]>();
  for (const v of variants) {
    const list = variantsByProduct.get(v.productId) || [];
    list.push(v);
    variantsByProduct.set(v.productId, list);
  }

  // 3. Assemble products with variants
  const toEmbed: (ProductForEmbedding & { id: string })[] = unindexedProducts.map((p) => ({
    ...p,
    variants: variantsByProduct.get(p.id) || [],
  }));

  // 4. Batch embed and save
  const { processed } = await batchEmbedAndSaveProducts(toEmbed);

  // 5. Count total remaining missing
  const countRes = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.active, true), isNull(products.embedding)));

  const remaining = Number(countRes[0]?.count ?? 0);

  return {
    totalMissing: unindexedProducts.length + remaining,
    processed,
    remaining,
  };
}

/**
 * Perform semantic vector similarity search against active products using pgvector.
 * Uses cosine distance with optional category, metal, and price filtering.
 */
export async function searchSimilarProducts(
  query: string,
  filters: SemanticSearchFilters = {}
): Promise<SimilarProductResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  const limit = filters.limit ?? 12;
  const similarityThreshold = filters.similarityThreshold ?? 0.35; // Cosine similarity: 1 = exact, 0 = orthogonal

  // 1. Generate query embedding using asymmetric query input type
  const queryEmbedding = await embedText(trimmedQuery, { inputType: "query" });

  // 2. Distance expression: cosine distance is 0 for identical, 1 for orthogonal, 2 for opposite
  const distanceExpr = cosineDistance(products.embedding, queryEmbedding);
  const similarityExpr = sql<number>`round((1 - (${distanceExpr}))::numeric, 4)`;

  // 3. Build WHERE conditions
  const conditions = [
    eq(products.active, true),
    isNotNull(products.embedding),
    // Filter by similarity threshold: (1 - distance) >= threshold => distance <= (1 - threshold)
    sql`(${distanceExpr}) <= ${1 - similarityThreshold}`,
  ];

  if (filters.category) {
    conditions.push(sql`${products.category} = ${filters.category}::category`);
  }

  if (filters.metalType) {
    conditions.push(sql`${products.metalType} = ${filters.metalType}::metal_type`);
  }

  if (filters.maxPriceCents && filters.maxPriceCents > 0) {
    conditions.push(lte(products.basePriceCents, filters.maxPriceCents));
  }

  // 4. Execute query with Drizzle
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      description: products.description,
      shortDesc: products.shortDesc,
      category: products.category,
      metalType: products.metalType,
      metalPurity: products.metalPurity,
      basePriceCents: products.basePriceCents,
      ratingAvg: products.ratingAvg,
      reviewCount: products.reviewCount,
      similarity: similarityExpr,
    })
    .from(products)
    .where(and(...conditions))
    .orderBy(distanceExpr)
    .limit(limit);

  if (rows.length === 0) return [];

  // 5. Fetch primary images for matched products
  const matchedIds = rows.map((r) => r.id);
  const images = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      isPrimary: productImages.isPrimary,
    })
    .from(productImages)
    .where(inArray(productImages.productId, matchedIds));

  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (img.isPrimary || !imageMap.has(img.productId)) {
      imageMap.set(img.productId, img.url);
    }
  }

  return rows.map((row) => ({
    ...row,
    similarity: Number(row.similarity),
    imageUrl: imageMap.get(row.id) || null,
  }));
}
