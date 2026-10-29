"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Sparkles, X, ArrowRight } from "lucide-react";
import type { HybridSearchResult } from "@/lib/search/types";
import { SearchDropdownSkeleton } from "@/components/search/search-skeleton";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSelectResult?: () => void;
}

export function SearchBar({
  className = "",
  placeholder = "Search jewelry...",
  autoFocus = false,
  onSelectResult,
}: SearchBarProps) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HybridSearchResult[]>([]);
  const [searchLogId, setSearchLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fast client-side query cache to make repeat typing/keystrokes instant
  const clientCacheRef = useRef<Map<string, { results: HybridSearchResult[]; searchLogId: string | null }>>(
    new Map()
  );

  // 1. Debounced Search Function with instant client cache & AbortController
  const fetchSearchResults = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setResults([]);
      setSearchLogId(null);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    const norm = trimmed.toLowerCase();
    // Instant client cache hit (0ms latency)
    if (clientCacheRef.current.has(norm)) {
      const cached = clientCacheRef.current.get(norm)!;
      setResults(cached.results);
      setSearchLogId(cached.searchLogId);
      setIsLoading(false);
      setIsOpen(true);
      setSelectedIndex(-1);
      return;
    }

    // Abort previous pending fetch to prevent racing and save network/compute
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          query: trimmed,
          filters: { limit: 5 },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const fetchedResults = data.results || [];
          const logId = data.searchLogId || null;
          clientCacheRef.current.set(norm, { results: fetchedResults, searchLogId: logId });
          setResults(fetchedResults);
          setSearchLogId(logId);
          setIsOpen(true);
          setSelectedIndex(-1);
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.warn("[SearchBar] Search error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = value.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    const norm = trimmed.toLowerCase();
    // If already in client cache, show immediately without waiting!
    if (clientCacheRef.current.has(norm)) {
      const cached = clientCacheRef.current.get(norm)!;
      setResults(cached.results);
      setSearchLogId(cached.searchLogId);
      setIsLoading(false);
      setIsOpen(true);
      setSelectedIndex(-1);
      return;
    }

    // Show dropdown skeleton immediately while debouncing & fetching
    setIsLoading(true);
    setIsOpen(true);
    setSelectedIndex(-1);

    debounceTimerRef.current = setTimeout(() => {
      fetchSearchResults(value);
    }, 300);
  };

  // 2. Track search-to-click conversion when user clicks a suggestion
  const handleResultClick = async (productId: string, slug: string) => {
    if (searchLogId) {
      try {
        fetch("/api/search/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchLogId, productId }),
          keepalive: true,
        }).catch(() => { });
      } catch {
        // non-fatal
      }
    }

    setIsOpen(false);
    if (onSelectResult) onSelectResult();
    router.push(`/products/${slug}`);
  };

  // 3. Form submit navigates to full /search page with loading transition
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    if (onSelectResult) onSelectResult();
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    });
  };

  // 4. Keyboard Navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || (results.length === 0 && !isLoading)) {
      if (e.key === "ArrowDown" && results.length > 0) {
        setIsOpen(true);
        setSelectedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        const selected = results[selectedIndex];
        handleResultClick(selected.id, selected.slug);
      } else {
        handleSubmit(e);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  // 5. Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-[#B88E2F]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-results-dropdown"
          className="w-full h-10 pl-10 pr-18 text-sm bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 focus:border-[#B88E2F] rounded-full outline-hidden transition-all duration-200 shadow-2xs focus:shadow-md focus:ring-1 focus:ring-[#B88E2F]/30"
        />

        
      </form>

      {/* Live Dropdown: Skeletons while loading, or Top 5 Results */}
      {isOpen && (
        <div id="search-results-dropdown">
          {isLoading ? (
            <SearchDropdownSkeleton />
          ) : results.length > 0 ? (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5 text-[#B88E2F]">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Semantic Matches
                </span>
                <span>{results.length} suggested</span>
              </div>

              <div className="divide-y divide-slate-50" role="listbox">
                {results.map((product, idx) => {
                  const formattedPrice = (product.basePriceCents / 100).toLocaleString("en-US", {
                    style: "currency",
                    currency: "KSH",
                    maximumFractionDigits: 0,
                  });
                  const isSelected = idx === selectedIndex;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleResultClick(product.id, product.slug)}
                      className={`w-full p-3 flex items-center gap-3.5 text-left transition-colors group cursor-pointer ${isSelected ? "bg-amber-50/80" : "hover:bg-amber-50/40"
                        }`}
                    >
                      <div className="relative w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-serif">
                            LJ
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate transition-colors ${isSelected ? "text-[#B88E2F]" : "text-slate-900 group-hover:text-[#B88E2F]"
                          }`}>
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {product.metalPurity} {product.metalType} • {product.category}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-semibold text-slate-900">
                          {formattedPrice}
                        </span>

                      </div>
                    </button>
                  );
                })}
              </div>

              {/* View Full Results Footer */}
              <div className="p-2.5 bg-slate-50/60 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#B88E2F] hover:text-[#9A7424] transition-colors"
                >
                  <span>View all results for &quot;{query}&quot;</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : query.trim() ? (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 text-center z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <p className="text-xs text-slate-500 mb-2">No direct matches found</p>
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#B88E2F] hover:text-[#9A7424] transition-colors"
              >
                <span>Explore all results for &quot;{query}&quot;</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
