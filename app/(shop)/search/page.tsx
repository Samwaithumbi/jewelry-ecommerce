import React, { Suspense } from "react";
import type { Metadata } from "next";
import type { HybridSearchResult } from "@/lib/search/types";
import { getAiSuggestions } from "@/lib/search/suggestions";
import { SearchClient } from "./search-client";
import { SearchPageSkeleton } from "@/components/search/search-skeleton";

export const dynamic = "force-dynamic";

type SearchPageParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchPageParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  if (q) {
    return {
      title: `Search: "${q}" | Luxe Jewels Fine Jewelry`,
      description: `Explore curated handcrafted fine jewelry, rings, necklaces, and diamonds matching "${q}".`,
    };
  }

  return {
    title: "Search Fine Jewelry | Luxe Jewels",
    description: "Search our exclusive collection of ethical diamonds, 18k gold, and fine handcrafted jewelry.",
  };
}

/**
 * Top-level Page entry point:
 * Synchronously sets up Suspense boundary keyed by search parameters so that whenever
 * a user hits Enter or navigates with a new query, SearchPageSkeleton streams IMMEDIATELY
 * while the async vector embedding and database queries execute.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchPageParams;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category.trim() : "";
  const metal = typeof params.metal === "string" ? params.metal.trim() : "";
  const sort = typeof params.sort === "string" ? params.sort.trim() : "relevance";
  const searchKey = `${q}:${category}:${metal}:${sort}`;

  return (
    <main className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      <Suspense key={searchKey} fallback={<SearchPageSkeleton />}>
        <SearchResultsContent params={params} />
      </Suspense>
    </main>
  );
}

/**
 * Async content component wrapped by Suspense:
 * Handles the heavy vector similarity embedding and database query.
 */
async function SearchResultsContent({
  params,
}: {
  params: { [key: string]: string | string[] | undefined };
}) {
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const category = typeof params.category === "string" ? params.category.trim() : undefined;
  const metal = typeof params.metal === "string" ? params.metal.trim() : undefined;
  const sort = typeof params.sort === "string" ? params.sort.trim() : "relevance";

  let results: HybridSearchResult[] = [];
  let searchLogId: string | undefined;
  let aiSuggestions: string[] = [];

  if (query) {
    try {
      const { searchSemantic } = await import("@/lib/search/semantic");
      const searchRes = await searchSemantic(
        query,
        {
          category: category && category !== "all" ? category : undefined,
          metalType: metal && metal !== "all" ? metal : undefined,
          limit: 30,
        },
        { logSearch: true }
      );

      results = searchRes.results;
      searchLogId = searchRes.searchLogId;

      if (results.length === 0) {
        aiSuggestions = await getAiSuggestions(query);
      }
    } catch (error) {
      console.error("[SearchPage] Semantic search failed:", error);
      aiSuggestions = await getAiSuggestions(query);
    }
  } else {
    aiSuggestions = [
      "something timeless",
      "bold statement piece",
      "cozy and delicate",
      "romantic anniversary",
    ];
  }

  return (
    <SearchClient
      initialQuery={query}
      initialResults={results}
      searchLogId={searchLogId}
      initialCategory={category}
      initialMetal={metal}
      initialSort={sort}
      aiSuggestions={aiSuggestions}
    />
  );
}
