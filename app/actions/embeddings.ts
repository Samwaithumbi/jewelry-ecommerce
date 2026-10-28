"use server";

import { eq, isNull, isNotNull, and, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { products } from "@/drizzle/src/db/schema";
import { requireAdminSession } from "@/lib/auth-guard";
import { backfillMissingEmbeddings } from "@/lib/products/vectorstorage";

export interface EmbeddingStats {
  totalActive: number;
  embedded: number;
  missing: number;
  percentComplete: number;
}

/**
 * Fetch statistics on product embeddings coverage.
 */
export async function getEmbeddingStatsAction(): Promise<EmbeddingStats> {
  await requireAdminSession();

  const [totalRes] = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.active, true));

  const [embeddedRes] = await db
    .select({ count: count() })
    .from(products)
    .where(and(eq(products.active, true), isNotNull(products.embedding)));

  const total = Number(totalRes?.count ?? 0);
  const embedded = Number(embeddedRes?.count ?? 0);
  const missing = Math.max(0, total - embedded);
  const percentComplete = total > 0 ? Math.round((embedded / total) * 100) : 100;

  return {
    totalActive: total,
    embedded,
    missing,
    percentComplete,
  };
}

/**
 * Server action to trigger backfilling missing product embeddings in batches.
 */
export async function backfillEmbeddingsAction(batchSize = 50) {
  await requireAdminSession();

  try {
    const result = await backfillMissingEmbeddings(batchSize);

    revalidatePath("/admin-dashboard/products");
    revalidatePath("/products");

    return {
      success: true,
      data: result,
      message: `Processed ${result.processed} products. ${result.remaining} remaining.`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to backfill embeddings",
    };
  }
}
