"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Sparkles, SlidersHorizontal, ArrowUpDown, FilterX, HelpCircle } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import type { HybridSearchResult } from "@/lib/search/types";
import { SearchPageSkeleton } from "@/components/search/search-skeleton";

interface SearchClientProps {
  initialQuery: string;
  initialResults: HybridSearchResult[];
  searchLogId?: string;
  initialCategory?: string;
  initialMetal?: string;
  initialSort?: string;
  aiSuggestions: string[];
}

export function SearchClient({
  initialQuery,
  initialResults,
  searchLogId,
  initialCategory,
  initialMetal,
  initialSort = "relevance",
  aiSuggestions,
}: SearchClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [selectedMetal, setSelectedMetal] = useState<string>(initialMetal || "all");
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // If search navigation transition is running, show the full page skeleton immediately
  if (isPending) {
    return <SearchPageSkeleton />;
  }

  // 1. Filter results based on selected UI filters
  let filtered = initialResults.filter((p) => {
    if (selectedCategory !== "all" && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (selectedMetal !== "all" && p.metalType.toLowerCase() !== selectedMetal.toLowerCase()) {
      return false;
    }
    return true;
  });

  // 2. Sort results
  if (sortBy === "price-asc") {
    filtered.sort((a, b) => a.basePriceCents - b.basePriceCents);
  } else if (sortBy === "price-desc") {
    filtered.sort((a, b) => b.basePriceCents - a.basePriceCents);
  } else {
    // Default: Hybrid Relevance Score DESC
    filtered.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  // 3. Track search-to-click conversion when user clicks a product in search results
  const handleProductCardClick = (productId: string) => {
    if (searchLogId) {
      fetch("/api/search/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchLogId, productId }),
        keepalive: true,
      }).catch(() => {});
    }
  };

  const categories = [
    { label: "All Categories", value: "all" },
    { label: "Rings", value: "ring" },
    { label: "Necklaces", value: "necklace" },
    { label: "Earrings", value: "earring" },
    { label: "Bracelets", value: "bracelet" },
    { label: "Pendants", value: "pendant" },
    { label: "Bangles", value: "bangle" },
    { label: "Jewelry Sets", value: "set" },
  ];

  const metals = [
    { label: "All Metals", value: "all" },
    { label: "Yellow Gold", value: "gold" },
    { label: "White Gold", value: "white_gold" },
    { label: "Rose Gold", value: "rose_gold" },
    { label: "Sterling Silver", value: "silver" },
    { label: "Platinum", value: "platinum" },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B88E2F] uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Hybrid Semantic Search</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-900">
            {initialQuery ? (
              <>
                Results for &ldquo;<span className="text-[#B88E2F]">{initialQuery}</span>&rdquo;
              </>
            ) : (
              "Explore Fine Jewelry"
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"} found blending vector similarity (70%) and keyword matching (30%)
          </p>
        </div>

        {/* Toolbar & Sort Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden rounded-full border-slate-200 text-xs font-medium"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-[#B88E2F]" />
            Filters
          </Button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="relevance">Sort: Most Relevant</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        {/* Sidebar Filters */}
        <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:col-span-1 space-y-6`}>
          <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Category</h3>
                {selectedCategory !== "all" && (
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="text-[11px] text-[#B88E2F] hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedCategory === cat.value
                        ? "bg-[#B88E2F] text-white"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200/80 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Metal Type</h3>
                {selectedMetal !== "all" && (
                  <button
                    onClick={() => setSelectedMetal("all")}
                    className="text-[11px] text-[#B88E2F] hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {metals.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setSelectedMetal(m.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      selectedMetal === m.value
                        ? "bg-[#B88E2F] text-white"
                        : "text-slate-600 hover:bg-slate-200/60"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid / Empty State */}
        <div className="lg:col-span-3">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((product) => {
                const cardProduct = {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  basePriceCents: product.basePriceCents,
                  category: product.category,
                  metalType: product.metalType,
                  metalPurity: product.metalPurity,
                  ratingAvg: product.ratingAvg,
                  reviewCount: product.reviewCount,
                  images: product.imageUrl ? [{ url: product.imageUrl, altText: product.name }] : [],
                };

                return (
                  <div
                    key={product.id}
                    onClick={() => handleProductCardClick(product.id)}
                    className="relative group cursor-pointer"
                  >
                    {/* Relevance Badge */}
                    {typeof product.score === "number" && (
                      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-xs text-slate-700 font-semibold text-[11px] px-2.5 py-1 rounded-full border border-slate-200 shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>{Math.round(product.score * 100)}% match</span>
                      </div>
                    )}
                    <ProductCard product={cardProduct} />
                  </div>
                );
              })}
            </div>
          ) : (
            /* No Results State with AI Suggested Alternatives */
            <div className="p-8 md:p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-[#B88E2F] flex items-center justify-center mx-auto shadow-xs">
                <Search className="w-8 h-8 stroke-[1.5]" />
              </div>

              <div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  No exact jewelry matches for &ldquo;{initialQuery}&rdquo;
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                  We couldn&apos;t find an exact match for your query, but our AI stylist suggests exploring these curated themes:
                </p>
              </div>

              {/* AI Suggestions Chips */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B88E2F] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Recommended Searches</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    {aiSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          startTransition(() => {
                            router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                          });
                        }}
                        className="px-4 py-2 rounded-full text-xs font-medium bg-slate-50 hover:bg-[#B88E2F] hover:text-white border border-slate-200 hover:border-[#B88E2F] text-slate-700 transition-all duration-200 shadow-2xs"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/products")}
                  className="rounded-full text-xs"
                >
                  Browse All Collections
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push("/ai-stylist")}
                  className="rounded-full bg-[#B88E2F] hover:bg-[#9A7424] text-white text-xs font-semibold"
                >
                  Talk to AI Stylist
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
