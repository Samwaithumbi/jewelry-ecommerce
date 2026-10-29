/**
 * lib/search/semantic.ts
 * Enterprise-grade Hybrid Search Engine (pgvector + pg_trgm).
 *
 * Scoring Formula:
 *   score = (semantic_score * 0.7) + (trigram_score * 0.3)
 * Where:
 *   semantic_score = 1 - (embedding <=> $1::vector)
 *   trigram_score  = similarity(name || ' ' || COALESCE(description, ''), $2)
 *
 * Filters are applied as SQL WHERE clauses AFTER vector ranking for maximum efficiency.
 */

import { sql } from "drizzle-orm";
import { db, pool } from "../db";
import { searchLogs } from "../../drizzle/src/db/schema";
import { embedText } from "../embeddings/embeddings";

export * from "./types";
import type { SearchFilters, HybridSearchResult, SearchOptions, SearchResponse } from "./types";

/**
 * Extract explicit category and metal intents from a natural language query.
 * For example:
 *   "timeless wedding earrings" -> category: "earring"
 *   "diamond ring" -> category: "ring"
 *   "sterling silver necklace" -> category: "necklace", metalType: "silver"
 */
export function extractQueryIntent(query: string): {
  category?: string;
  metalType?: string;
} {
  const q = query.toLowerCase();
  let category: string | undefined;
  let metalType: string | undefined;

  // Categories
  if (/\b(earrings?|studs?|hoops?|eardrops?|huggies?)\b/i.test(q)) {
    category = "earring";
  } else if (/\b(rings?|wedding\s*bands?|engagement\s*bands?|bands?|solitaire)\b/i.test(q)) {
    category = "ring";
  } else if (/\b(necklaces?|chokers?|chains?|collars?)\b/i.test(q)) {
    category = "necklace";
  } else if (/\b(pendants?|lockets?)\b/i.test(q)) {
    category = "pendant";
  } else if (/\b(bangles?)\b/i.test(q)) {
    category = "bangle";
  } else if (/\b(bracelets?|cuffs?)\b/i.test(q)) {
    category = "bracelet";
  } else if (/\b(sets?|bridal\s*set|jewelry\s*set)\b/i.test(q)) {
    category = "set";
  }

  // Metals
  if (/\b(rose\s*gold)\b/i.test(q)) {
    metalType = "rose_gold";
  } else if (/\b(white\s*gold)\b/i.test(q)) {
    metalType = "white_gold";
  } else if (/\b(yellow\s*gold|golden|gold)\b/i.test(q)) {
    metalType = "gold";
  } else if (/\b(silver|sterling)\b/i.test(q)) {
    metalType = "silver";
  } else if (/\b(platinum)\b/i.test(q)) {
    metalType = "platinum";
  }

  return { category, metalType };
}

// In-memory query result cache (3 minutes TTL) to make repeated/hot AI queries ultra-fast
declare global {
  // eslint-disable-next-line no-var
  var __searchResultCache: Map<string, { timestamp: number; results: HybridSearchResult[] }> | undefined;
}

const searchResultCache: Map<string, { timestamp: number; results: HybridSearchResult[] }> =
  globalThis.__searchResultCache ?? new Map();
if (process.env.NODE_ENV !== "production") {
  globalThis.__searchResultCache = searchResultCache;
}
const SEARCH_CACHE_TTL_MS = 3 * 60 * 1000;

/**
 * Execute a hybrid search blending semantic cosine similarity (70%) with trigram text matching (30%).
 * Filters are evaluated in the outer query after vector candidate scoring.
 */
export async function searchSemantic(
  query: string,
  filters: SearchFilters = {},
  options: SearchOptions = {}
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { query: "", totalCount: 0, results: [] };
  }

  const limit = Math.min(filters.limit ?? 20, 50);
  const minScore = filters.minScore ?? 0.01;

  // 1. Extract natural language intent (e.g. "earrings", "ring", "silver")
  const intent = extractQueryIntent(trimmed);
  const targetCategory =
    filters.category && filters.category !== "all"
      ? filters.category.toLowerCase().trim()
      : intent.category;
  const targetMetal =
    filters.metalType && filters.metalType !== "all"
      ? filters.metalType.toLowerCase().trim()
      : intent.metalType;

  // Check cache for instant match (bypasses DB & API roundtrip)
  const normQuery = trimmed.toLowerCase().replace(/\s+/g, " ");
  const cacheKey = `${normQuery}|${targetCategory || ""}|${targetMetal || ""}|${filters.minPriceCents || ""}|${filters.maxPriceCents || ""}|${limit}|${minScore}`;
  const cached = searchResultCache.get(cacheKey);

  let finalResults: HybridSearchResult[] | null = null;
  if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL_MS) {
    finalResults = cached.results;
  }

  if (!finalResults) {
    // 2. Generate query embedding using asymmetric query input type
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await embedText(trimmed, { inputType: "query" });
    } catch (embedErr: any) {
      console.warn(
        `[searchSemantic] Vector embedding unavailable (${embedErr.message}). Gracefully falling back to trigram matching.`
      );
    }

    const hasVector = queryEmbedding !== null;
    const vectorLiteral = hasVector ? JSON.stringify(queryEmbedding) : "[]";

    // 3. Build dynamic post-filters for the outer WHERE clause
    const filterClauses: string[] = [];
    const params: any[] = hasVector ? [vectorLiteral, trimmed] : [trimmed];

    let paramIdx = hasVector ? 3 : 2;

    if (targetCategory && targetCategory.trim()) {
      filterClauses.push(`category = $${paramIdx++}::category`);
      params.push(targetCategory);
    }

    if (targetMetal && targetMetal.trim()) {
      filterClauses.push(`metal_type = $${paramIdx++}::metal_type`);
      params.push(targetMetal);
    }

    if (typeof filters.minPriceCents === "number" && filters.minPriceCents > 0) {
      filterClauses.push(`base_price_cents >= $${paramIdx++}`);
      params.push(filters.minPriceCents);
    }

    if (typeof filters.maxPriceCents === "number" && filters.maxPriceCents > 0) {
      filterClauses.push(`base_price_cents <= $${paramIdx++}`);
      params.push(filters.maxPriceCents);
    }

    filterClauses.push(`score >= $${paramIdx++}`);
    params.push(minScore);

    const whereSql = filterClauses.length > 0 ? `WHERE ${filterClauses.join(" AND ")}` : "";
    params.push(limit);
    const limitIdx = paramIdx;

    // 4. Raw SQL Query with CTE:
    // - Clamps negative semantic scores to 0.0 so semantically dis-similar items are never elevated
    // - Filters top_matches before joining product_images to maximize query throughput
    const rankedSelect = hasVector
      ? `
          (1 - (p.embedding <=> $1::vector)) as semantic_score,
          similarity(p.name || ' ' || COALESCE(p.description, '') || ' ' || p.category::text, $2) as trigram_score
        `
      : `
          0.0::float as semantic_score,
          similarity(p.name || ' ' || COALESCE(p.description, '') || ' ' || p.category::text, $1) as trigram_score
        `;

    const scoreCalculation = hasVector
      ? `
          CASE 
            WHEN r.semantic_score < 0 THEN 0.0
            ELSE round(((r.semantic_score * 0.7) + (r.trigram_score * 0.3))::numeric, 4)
          END
        `
      : `round(r.trigram_score::numeric, 4)`;

    const rawQuery = `
      WITH ranked AS (
        SELECT 
          p.id,
          p.name,
          p.slug,
          p.description,
          p.short_desc,
          p.metal_type,
          p.metal_purity,
          p.base_price_cents,
          p.category,
          p.rating_avg,
          p.review_count,
          ${rankedSelect}
        FROM products p
        WHERE p.active = true ${hasVector ? "AND p.embedding IS NOT NULL" : ""}
      ),
      scored AS (
        SELECT 
          r.*,
          ${scoreCalculation} as score
        FROM ranked r
      ),
      top_matches AS (
        SELECT *
        FROM scored s
        ${whereSql}
        ORDER BY s.score DESC
        LIMIT $${limitIdx}
      )
      SELECT 
        t.id,
        t.name,
        t.slug,
        t.description,
        t.short_desc as "shortDesc",
        t.category,
        t.metal_type as "metalType",
        t.metal_purity as "metalPurity",
        t.base_price_cents as "basePriceCents",
        t.rating_avg as "ratingAvg",
        t.review_count as "reviewCount",
        round(t.semantic_score::numeric, 4)::float as "semanticScore",
        round(t.trigram_score::numeric, 4)::float as "trigramScore",
        t.score::float as score,
        pi.url as "imageUrl"
      FROM top_matches t
      LEFT JOIN LATERAL (
        SELECT url FROM product_images 
        WHERE product_id = t.id 
        ORDER BY is_primary DESC, position ASC 
        LIMIT 1
      ) pi ON true
      ORDER BY t.score DESC;
    `;

    const queryResult = await pool.query(rawQuery, params);
    const rawRows: any[] = queryResult.rows || [];

    const results: HybridSearchResult[] = rawRows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      shortDesc: r.shortDesc,
      category: r.category,
      metalType: r.metalType,
      metalPurity: r.metalPurity,
      basePriceCents: Number(r.basePriceCents),
      ratingAvg: r.ratingAvg ? String(r.ratingAvg) : null,
      reviewCount: r.reviewCount ? Number(r.reviewCount) : 0,
      semanticScore: Number(r.semanticScore),
      trigramScore: Number(r.trigramScore),
      score: Number(r.score),
      imageUrl: r.imageUrl || null,
    }));

    // 5. Dynamic Relative Score Pruning:
    // When top candidate is a strong match, eliminate trailing noise with score < 35% of top score
    finalResults = results;
    if (finalResults.length > 1) {
      const topScore = finalResults[0].score;
      if (topScore >= 0.20) {
        finalResults = finalResults.filter((r) => r.score >= Math.max(topScore * 0.35, 0.08));
      } else if (topScore >= 0.08) {
        finalResults = finalResults.filter((r) => r.score >= Math.max(topScore * 0.30, 0.03));
      }
    }

    // Save to memory cache for fast repeat searches
    searchResultCache.set(cacheKey, {
      timestamp: Date.now(),
      results: finalResults,
    });
  }

  // 6. Log search in search_logs
  let searchLogId: string | undefined;
  if (options.logSearch !== false) {
    try {
      const inserted = await db
        .insert(searchLogs)
        .values({
          query: trimmed,
          resultCount: finalResults.length,
          userId: options.userId || null,
          sessionId: options.sessionId || null,
        })
        .returning({ id: searchLogs.id });

      searchLogId = inserted[0]?.id;
    } catch (logErr) {
      console.warn("[searchSemantic] Non-fatal search log failure:", logErr);
    }
  }

  return {
    searchLogId,
    query: trimmed,
    totalCount: finalResults.length,
    results: finalResults,
  };
}

/**
 * Record a search-to-click conversion when a user navigates to a product from search results.
 */
export async function recordSearchClick(
  searchLogId: string,
  clickedProductId: string
): Promise<boolean> {
  try {
    const result = await db
      .update(searchLogs)
      .set({
        clickedProductId,
      })
      .where(sql`${searchLogs.id} = ${searchLogId}`);

    return true;
  } catch (err) {
    console.warn(`[recordSearchClick] Failed to log click for ${searchLogId}:`, err);
    return false;
  }
}
