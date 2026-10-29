import React from "react";
import { Sparkles } from "lucide-react";

/**
 * Single Product Card Skeleton matching the luxury aesthetic of ProductCard.
 */
export function SearchProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full rounded-2xl bg-white p-3.5 shadow-sm border border-slate-200/80 animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-square w-full rounded-xl bg-slate-100 overflow-hidden">
        {/* Shimmer gradient overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        
        {/* Wishlist placeholder */}
        <div className="absolute right-3.5 top-3.5 size-9 rounded-full bg-slate-200/70" />
      </div>

      {/* Content Skeleton */}
      <div className="flex flex-col flex-1 pt-3.5 space-y-2.5">
        {/* Category & Metal Tag */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-slate-200 rounded-md" />
          <div className="h-3 w-12 bg-slate-100 rounded-md" />
        </div>

        {/* Product Title */}
        <div className="space-y-1.5">
          <div className="h-4 w-4/5 bg-slate-200 rounded-md" />
          <div className="h-3.5 w-1/2 bg-slate-100 rounded-md" />
        </div>

        {/* Rating stars skeleton */}
        <div className="flex items-center gap-1 pt-1">
          <div className="h-3 w-16 bg-amber-100/80 rounded-md" />
          <div className="h-3 w-8 bg-slate-100 rounded-md" />
        </div>

        {/* Price & CTA Skeleton */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100">
          <div className="h-5 w-24 bg-slate-200 rounded-md" />
          <div className="h-8 w-20 bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Live Search Dropdown Skeleton displayed inside SearchBar while debounced query is loading.
 */
export function SearchDropdownSkeleton() {
  return (
    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header with pulsing AI sparkler */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
        <span className="flex items-center gap-1.5 text-[#B88E2F]">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span className="animate-pulse">Searching luxury catalog...</span>
        </span>
        <div className="h-3 w-14 bg-slate-200/80 rounded-md animate-pulse" />
      </div>

      {/* 4 Skeleton Rows */}
      <div className="divide-y divide-slate-50 p-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-2.5 flex items-center gap-3 animate-pulse">
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 border border-slate-100" />
            
            {/* Title & Category */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="h-3.5 w-3/4 bg-slate-200 rounded-md" />
              <div className="h-2.5 w-1/2 bg-slate-100 rounded-md" />
            </div>

            {/* Price & Score */}
            <div className="text-right shrink-0 space-y-1">
              <div className="h-4 w-14 bg-slate-200 rounded-md ml-auto" />
              <div className="h-2.5 w-10 bg-emerald-100 rounded-md ml-auto" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Skeleton */}
      <div className="p-2.5 bg-slate-50/60 border-t border-slate-100 text-center">
        <div className="h-3 w-32 bg-slate-200 rounded-md mx-auto animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Full Page Luxury Skeleton for `/search` route and Suspense boundaries.
 */
export function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 animate-pulse">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#B88E2F]">
              <Sparkles className="w-3.5 h-3.5" />
              <div className="h-3 w-36 bg-amber-100 rounded-md" />
            </div>
            <div className="h-8 sm:h-10 w-64 sm:w-96 bg-slate-200 rounded-lg" />
            <div className="h-4 w-72 bg-slate-100 rounded-md" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-9 w-28 bg-slate-200 rounded-xl" />
            <div className="h-9 w-32 bg-slate-200 rounded-xl" />
          </div>
        </div>

        {/* Layout Grid: Filters Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
          {/* Filters Sidebar Skeleton (Desktop) */}
          <aside className="hidden lg:block space-y-6">
            {/* Category Filter Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-pulse">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="h-4 w-20 bg-slate-200 rounded-md" />
                <div className="h-3 w-10 bg-slate-100 rounded-md" />
              </div>
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-8 w-full bg-slate-100 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Metal Filter Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 animate-pulse">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="h-4 w-24 bg-slate-200 rounded-md" />
              </div>
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 w-full bg-slate-100 rounded-lg" />
                ))}
              </div>
            </div>
          </aside>

          {/* Product Cards Grid Skeleton */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <SearchProductCardSkeleton key={idx} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
