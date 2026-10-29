/**
 * lib/search/types.ts
 * Pure TypeScript interfaces for hybrid semantic search.
 * Safe for import in both Client Components and Server Components.
 */

export interface SearchFilters {
  category?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  metalType?: string;
  limit?: number;
  minScore?: number;
}

export interface HybridSearchResult {
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
  semanticScore: number;
  trigramScore: number;
  score: number;
  imageUrl: string | null;
}

export interface SearchOptions {
  userId?: string;
  sessionId?: string;
  logSearch?: boolean;
}

export interface SearchResponse {
  searchLogId?: string;
  query: string;
  totalCount: number;
  results: HybridSearchResult[];
}
