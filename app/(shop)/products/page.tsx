import { Suspense } from "react"
import type { Metadata } from "next"
import { eq, and, desc, asc, lte, inArray, count, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { products, productImages, productVariants } from "@/drizzle/src/db/schema"

import { ProductCard } from "@/components/shop/product-card"
import { ProductFilters, type FilterCounts } from "@/components/shop/product-filters"
import { ProductToolbar, ShopHeader } from "@/components/shop/product-toolbar"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import ProductsLoading from "./loading"
import { PackageSearch } from "lucide-react"

// ISR: revalidate every hour
export const revalidate = 3600

// ── SEO metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Shop Fine Jewelry | Rings, Necklaces, Earrings & More",
  description:
    "Browse our curated collection of fine jewelry — diamond rings, gold necklaces, platinum earrings and certified gemstone pieces. Filter by metal, stone, price and size.",
  openGraph: {
    title: "Shop Fine Jewelry",
    description:
      "Curated fine jewelry — rings, necklaces, earrings, bracelets. ISR-powered, SEO-indexed filters.",
    type: "website",
  },
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Safely parse a positive integer from a search param. Returns `fallback` on failure. */
function parsePositiveInt(val: string | string[] | undefined, fallback: number): number {
  if (typeof val !== "string") return fallback
  const n = parseInt(val, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** Build a stable pagination query string preserving all active filters. */
function buildPageHref(
  targetPage: number,
  params: {
    category?: string
    metalTypes?: string[]
    stoneTypes?: string[]
    maxPrice?: number
    hasCert: boolean
    size?: string
    sort: string
  }
) {
  const qs = new URLSearchParams()
  qs.set("page", String(targetPage))
  if (params.category) qs.set("category", params.category)
  if (params.metalTypes?.length) qs.set("metal", params.metalTypes.join(","))
  if (params.stoneTypes?.length) qs.set("stone", params.stoneTypes.join(","))
  if (params.maxPrice) qs.set("max", String(params.maxPrice))
  if (params.hasCert) qs.set("cert", "true")
  if (params.size) qs.set("size", params.size)
  if (params.sort !== "popular") qs.set("sort", params.sort)
  return `?${qs.toString()}`
}

// ── ProductsContent (server component) ──────────────────────────────────────

type SearchParams = { [key: string]: string | string[] | undefined }

async function ProductsContent({ searchParams }: { searchParams: SearchParams }) {
  // ── Parse & validate search params ─────────────────────────────────────────
  const category =
    typeof searchParams.category === "string" && searchParams.category !== ""
      ? searchParams.category
      : undefined

  // nuqs serialises parseAsArrayOf as comma-separated values: ?metal=gold,silver
  const metalTypes =
    typeof searchParams.metal === "string" && searchParams.metal !== ""
      ? searchParams.metal.split(",").filter(Boolean)
      : Array.isArray(searchParams.metal)
      ? searchParams.metal.filter(Boolean)
      : undefined

  const stoneTypes =
    typeof searchParams.stone === "string" && searchParams.stone !== ""
      ? searchParams.stone.split(",").filter(Boolean)
      : Array.isArray(searchParams.stone)
      ? searchParams.stone.filter(Boolean)
      : undefined

  // Ignore the default slider value (10000) so no price filter is applied
  const rawMax = typeof searchParams.max === "string" ? searchParams.max : ""
  const maxPrice =
    rawMax !== "" && rawMax !== "10000" ? parsePositiveInt(rawMax, 0) || undefined : undefined

  const hasCert = searchParams.cert === "true"

  const size =
    typeof searchParams.size === "string" && searchParams.size !== ""
      ? searchParams.size
      : undefined

  const validSorts = ["popular", "newest", "price-asc", "price-desc"] as const
  type SortKey = (typeof validSorts)[number]
  const sort: SortKey =
    validSorts.includes(searchParams.sort as SortKey)
      ? (searchParams.sort as SortKey)
      : "popular"

  const page = parsePositiveInt(searchParams.page, 1)
  const LIMIT = 12
  const offset = (page - 1) * LIMIT

  // ── WHERE conditions ────────────────────────────────────────────────────────
  type Condition = ReturnType<typeof eq>

  const conditions: Condition[] = [
    // Always scope to active products
    eq(products.active, true) as Condition,
  ]

  if (category) {
    // Use raw SQL to sidestep Drizzle's strict enum overload — category is a PG enum column
    // and a plain `string` cannot be assigned to the union type it expects.
    conditions.push(
      sql`${products.category} = ${category}::category` as unknown as Condition
    )
  }

  if (metalTypes && metalTypes.length > 0) {
    conditions.push(
      sql`${products.metalType} = ANY(ARRAY[${sql.join(
        metalTypes.map((m) => sql`${m}`),
        sql`, `
      )}]::metal_type[])` as unknown as Condition
    )
  }

  if (maxPrice && maxPrice > 0) {
    conditions.push(lte(products.basePriceCents, maxPrice * 100) as Condition)
  }

  if (stoneTypes && stoneTypes.length > 0) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM product_variants pv
        WHERE pv.product_id = ${products.id}
          AND pv.stone_type = ANY(ARRAY[${sql.join(
            stoneTypes.map((s) => sql`${s}`),
            sql`, `
          )}]::stone_type[])
          AND pv.active = true
      )` as unknown as Condition
    )
  }

  if (size) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM product_variants pv
        WHERE pv.product_id = ${products.id}
          AND pv.size = ${size}
          AND pv.active = true
          AND pv.stock_qty > 0
      )` as unknown as Condition
    )
  }

  if (hasCert) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM certificates c
        WHERE c.product_id = ${products.id}
      )` as unknown as Condition
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  // ── Run all DB queries in parallel ─────────────────────────────────────────
  const [productsList, [{ total: totalProducts }], categoryRows, metalRows, stoneRows, allImages] =
    await Promise.all([
      // 1. Paginated product list
      (() => {
        let q = db.select().from(products).$dynamic()
        if (sort === "newest") q = q.orderBy(desc(products.createdAt))
        else if (sort === "price-asc") q = q.orderBy(asc(products.basePriceCents))
        else if (sort === "price-desc") q = q.orderBy(desc(products.basePriceCents))
        else q = q.orderBy(desc(products.viewCount))
        return q.where(whereClause).limit(LIMIT).offset(offset)
      })(),

      // 2. Total count for pagination
      db
        .select({ total: count() })
        .from(products)
        .where(whereClause),

      // 3. Count per category
      db
        .select({ category: products.category, cnt: count() })
        .from(products)
        .where(eq(products.active, true))
        .groupBy(products.category),

      // 4. Count per metal type
      db
        .select({ metalType: products.metalType, cnt: count() })
        .from(products)
        .where(eq(products.active, true))
        .groupBy(products.metalType),

      // 5. Count per stone type (distinct products via variants)
      db
        .select({
          stoneType: productVariants.stoneType,
          cnt: sql<number>`COUNT(DISTINCT ${productVariants.productId})::int`,
        })
        .from(productVariants)
        .where(eq(productVariants.active, true))
        .groupBy(productVariants.stoneType),

      // 6. Primary images for the products on this page (fetched post-query via inArray below)
      Promise.resolve([] as { productId: string; url: string; altText: string | null }[]),
    ])

  // Fetch images now that we have productIds
  const productIds = productsList.map((p) => p.id)
  const pageImages =
    productIds.length > 0
      ? await db
          .select({
            productId: productImages.productId,
            url: productImages.url,
            altText: productImages.altText,
          })
          .from(productImages)
          .where(
            and(
              inArray(productImages.productId, productIds),
              eq(productImages.isPrimary, true)
            )
          )
      : []

  // ── Build filter counts ─────────────────────────────────────────────────────
  const categoryCounts = Object.fromEntries(categoryRows.map((r) => [r.category, r.cnt]))
  const metalCounts = Object.fromEntries(metalRows.map((r) => [r.metalType, r.cnt]))
  const stoneCounts = Object.fromEntries(
    stoneRows
      .filter((r) => r.stoneType && r.stoneType !== "none")
      .map((r) => [r.stoneType!, r.cnt])
  )
  const totalActive = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  const filterCounts: FilterCounts = {
    categories: categoryCounts,
    metalTypes: metalCounts,
    stoneTypes: stoneCounts,
    total: totalActive,
  }

  // ── Map products ────────────────────────────────────────────────────────────
  const imagesByProduct = pageImages.reduce<
    Record<string, { url: string; altText: string | null }[]>
  >((acc, img) => {
    if (!acc[img.productId]) acc[img.productId] = []
    acc[img.productId].push({ url: img.url, altText: img.altText })
    return acc
  }, {})

  const displayProducts = productsList.map((product) => ({
    ...product,
    images: imagesByProduct[product.id] ?? [],
    badge: product.featured ? ("Best Seller" as const) : null,
    originalPriceCents: null,
  }))

  // ── Pagination maths ────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(totalProducts / LIMIT))
  const paginationParams = { category, metalTypes, stoneTypes, maxPrice, hasCert, size, sort }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (displayProducts.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pb-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <ShopHeader />
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="hidden lg:block sticky top-8 z-10 w-full max-w-[260px]">
              <ProductFilters counts={filterCounts} />
            </div>
            <div className="flex-1 w-full flex flex-col">
              <ProductToolbar />
              <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/5">
                  <PackageSearch className="size-10 text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-semibold text-[#111827]">No products found</h2>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Try adjusting or clearing your filters to find what you&apos;re looking for.
                </p>
                <a
                  href="/products"
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#111827]/90 transition-colors"
                >
                  Clear all filters
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <ShopHeader />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="hidden lg:block sticky top-8 z-10 w-full max-w-[260px]">
            <ProductFilters counts={filterCounts} />
          </div>

          <div className="flex-1 w-full flex flex-col">
            <ProductToolbar />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination — only render when there is more than one page */}
            {totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center w-full">
                <Pagination>
                  <PaginationContent>
                    {/* Previous */}
                    <PaginationItem>
                      <PaginationPrevious
                        href={page > 1 ? buildPageHref(page - 1, paginationParams) : "#"}
                        size="icon"
                        className="border border-primary/10 bg-white"
                        aria-disabled={page <= 1}
                      />
                    </PaginationItem>

                    {/* First page */}
                    <PaginationItem>
                      <PaginationLink
                        href={buildPageHref(1, paginationParams)}
                        isActive={page === 1}
                        size="icon"
                        className="bg-[#111827] text-white hover:bg-[#111827]/90 hover:text-white border-transparent data-[active=false]:bg-white data-[active=false]:border-primary/10 data-[active=false]:text-[#111827] data-[active=false]:hover:bg-primary/5"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {page > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Pages around current */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p > 1 && p < totalPages && Math.abs(p - page) <= 1)
                      .map((p) => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            href={buildPageHref(p, paginationParams)}
                            isActive={p === page}
                            size="icon"
                            className={
                              p === page
                                ? "bg-[#111827] text-white hover:bg-[#111827]/90 hover:text-white border-transparent"
                                : "bg-white border border-primary/10 hover:bg-primary/5"
                            }
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    {page < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Last page */}
                    {totalPages > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          href={buildPageHref(totalPages, paginationParams)}
                          isActive={page === totalPages}
                          size="icon"
                          className={
                            page === totalPages
                              ? "bg-[#111827] text-white hover:bg-[#111827]/90 hover:text-white border-transparent"
                              : "bg-white border border-primary/10 hover:bg-primary/5"
                          }
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    {/* Next */}
                    <PaginationItem>
                      <PaginationNext
                        href={
                          page < totalPages
                            ? buildPageHref(page + 1, paginationParams)
                            : "#"
                        }
                        size="icon"
                        className="border border-primary/10 bg-white"
                        aria-disabled={page >= totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {/* Result count */}
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-[#111827]">
                {offset + 1}–{Math.min(offset + LIMIT, totalProducts)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#111827]">{totalProducts}</span> products
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page entry point ─────────────────────────────────────────────────────────

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams

  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent searchParams={params} />
    </Suspense>
  )
}
