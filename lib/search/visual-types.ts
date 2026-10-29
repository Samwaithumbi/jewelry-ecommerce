import { z } from "zod";
import type { HybridSearchResult } from "./types";

/**
 * Standard error codes for Visual Search operations.
 */
export type VisualSearchErrorCode =
  | "UNSUPPORTED_FORMAT"
  | "FILE_TOO_LARGE"
  | "CORRUPT_IMAGE"
  | "NON_JEWELRY"
  | "POOR_QUALITY"
  | "RATE_LIMIT_EXCEEDED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "INTERNAL_ERROR";

/**
 * Strict schema for Claude Vision extraction.
 * Distinguishes observable jewelry attributes from uncertain inferences.
 */
export const visualAnalysisSchema = z.object({
  status: z.enum(["ok", "not_jewelry", "poor_quality"]),
  category: z
    .enum(["ring", "necklace", "bracelet", "earring", "pendant", "bangle", "set", "unknown"])
    .nullable()
    .optional(),
  style: z.string().max(80).nullable().optional(),
  metal_color: z.string().max(50).nullable().optional(),
  stone_shape: z.string().max(50).nullable().optional(),
  stone_type: z.string().max(50).nullable().optional(),
  era: z.string().max(50).nullable().optional(),
  vibe: z.string().max(80).nullable().optional(),
  descriptors: z.array(z.string().max(40)).max(10).default([]),
  message: z.string().max(200).nullable().optional(),
  confidence: z.number().min(0).max(1).default(0.8),
});

export type VisualAnalysisResult = z.infer<typeof visualAnalysisSchema>;

/**
 * Normalized visual search attributes ready for catalog matching.
 */
export interface NormalizedVisualQuery {
  searchQuery: string;
  category?: "ring" | "necklace" | "bracelet" | "earring" | "pendant" | "bangle" | "set";
  metalType?: "gold" | "silver" | "platinum" | "rose_gold" | "white_gold";
  visualSummary: string;
  tags: string[];
}

/**
 * Visual search API response types.
 */
export interface VisualSearchSuccessResponse {
  success: true;
  cached: boolean;
  analysis: VisualAnalysisResult;
  normalizedQuery: NormalizedVisualQuery;
  query: string;
  totalCount: number;
  products: HybridSearchResult[];
  searchLogId?: string;
}

export interface VisualSearchErrorResponse {
  success: false;
  error: string;
  errorType: VisualSearchErrorCode;
}

export type VisualSearchApiResponse = VisualSearchSuccessResponse | VisualSearchErrorResponse;
