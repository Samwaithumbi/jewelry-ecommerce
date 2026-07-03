import { notFound } from "next/navigation"
import { Metadata } from "next"
import Link from "next/link"
import { db } from "@/lib/db"
import {
  products,
  productImages,
  productVariants,
  certificates,
  metalPricing,
} from "@/drizzle/src/db/schema"
import { eq, or, and, asc, not, inArray } from "drizzle-orm"
import { ProductViewer } from "@/components/shop/product-viewer"
import { ProductClient } from "@/components/shop/product-client"
import { SizeGuideDialog } from "@/components/shop/size-guide-dialog"
import { ProductCard } from "@/components/shop/product-card"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ArrowRight, ExternalLink } from "lucide-react"

export const revalidate = 3600 // 1 hour ISR

type Params = Promise<{ slug: string }>

export async function generateStaticParams() {
  const allProducts = await db.select({ slug: products.slug }).from(products)
  return allProducts.map((p) => ({
    slug: p.slug,
  }))
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const resolvedParams = await params
  const { slug } = resolvedParams
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1)

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: `${product.name} | Lumina Jewelry`,
    description: product.shortDesc || product.description?.substring(0, 160) || `Buy ${product.name} at Lumina Jewelry.`,
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  // 1. Fetch Product
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1)
  if (!product) return notFound()

  // 2. Fetch Relations
  const images = await db.select().from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.position))
  const variants = await db.select().from(productVariants).where(eq(productVariants.productId, product.id))
  const [certificate] = await db.select().from(certificates).where(eq(certificates.productId, product.id)).limit(1)

  // 3. Fetch Metal Pricing
  const [metalPriceRecord] = await db.select().from(metalPricing)
    .where(and(eq(metalPricing.metal, product.metalType), eq(metalPricing.purity, product.metalPurity)))
    .limit(1)

  const metalPriceCents = metalPriceRecord && product.weightGrams 
    ? Math.round(metalPriceRecord.pricePerGramCents * Number(product.weightGrams))
    : 0

  // 4. Fetch Related Products
  const relatedProducts = await db.select().from(products)
    .where(
      and(
        or(
          eq(products.metalType, product.metalType),
          eq(products.category, product.category)
        ),
        not(eq(products.id, product.id))
      )
    )
    .limit(4)

  let relatedImages: (typeof productImages.$inferSelect)[] = []
  if (relatedProducts.length > 0) {
    const relatedProductIds = relatedProducts.map(rp => rp.id)
    relatedImages = await db.select().from(productImages).where(inArray(productImages.productId, relatedProductIds))
  }
  
  const relatedWithImages = relatedProducts.map(rp => ({
    ...rp,
    images: relatedImages.filter(img => img.productId === rp.id)
  }))

  // 5. JSON-LD Structured Data
  const baseTotalCents = product.basePriceCents + metalPriceCents
  const firstAvailableVariant = variants.find(v => v.stockQty > 0) || variants[0]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": images.map(img => img.url),
    "description": product.shortDesc || product.description,
    "sku": firstAvailableVariant?.sku || product.id,
    "offers": {
      "@type": "Offer",
      "url": `https://luminajewelry.com/products/${product.slug}`,
      "priceCurrency": "USD",
      "price": ((baseTotalCents + (firstAvailableVariant?.priceAdjustCents || 0)) / 100).toFixed(2),
      "availability": firstAvailableVariant?.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    }
  }

  const formatMetal = (metal: string) => metal.replace('_', ' ')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="flex text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-primary transition-colors">Shop</Link>
          <span className="mx-2">/</span>
          <span className="capitalize hover:text-primary transition-colors cursor-pointer">
            {product.category}
          </span>
          <span className="mx-2">/</span>
          <span className="text-[#111827] font-medium truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left Column: Viewer */}
          <div className="w-full">
            <ProductViewer images={images} />
          </div>

          {/* Right Column: Info & Actions */}
          <div className="flex flex-col">
            {/* Header / Info */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{product.category}</span>
                <Badge variant="outline" className="bg-[#FCFBF9] border-primary/20 text-[#B88E2F] capitalize font-medium">
                  {product.metalPurity} {formatMetal(product.metalType)}
                </Badge>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-semibold text-[#111827] leading-tight mb-4">
                {product.name}
              </h1>
              
              {product.shortDesc && (
                <p className="text-lg text-muted-foreground mb-6">
                  {product.shortDesc}
                </p>
              )}
              
              {/* Product Client handles Pricing, Variants, and Add to Cart */}
              <div className="relative">
                {product.category === "ring" && (
                  <div className="absolute right-0 top-[88px] z-10">
                    <SizeGuideDialog />
                  </div>
                )}
                <ProductClient 
                  basePriceCents={product.basePriceCents}
                  metalPriceCents={metalPriceCents}
                  variants={variants}
                  category={product.category}
                />
              </div>
            </div>

            {/* Certificate Section */}
            {certificate && (
              <div className="mt-8 pt-8 border-t border-primary/10">
                <div className="bg-[#FCFBF9] border border-primary/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-white border shadow-sm flex items-center justify-center">
                      <ShieldCheck className="size-6 text-[#B88E2F]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#111827]">{certificate.lab} Certified Gemstone</h4>
                      <p className="text-sm text-muted-foreground">Report #{certificate.certNumber}</p>
                    </div>
                  </div>
                  <Link 
                    href={`https://www.gia.edu/report-check?reportno=${certificate.certNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-[#B88E2F] hover:text-[#F59E0B] transition-colors bg-white px-4 py-2 rounded-full border shadow-sm self-start sm:self-auto"
                  >
                    Verify Report
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Description Details */}
            {product.description && (
              <div className="mt-8 pt-8 border-t border-primary/10">
                <h3 className="text-lg font-serif font-semibold text-[#111827] mb-4">Product Details</h3>
                <div className="prose prose-sm text-muted-foreground">
                  <p>{product.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedWithImages.length > 0 && (
          <div className="mt-24 pt-16 border-t border-primary/10">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-[#111827]">You May Also Love</h2>
              <Link href="/products" className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#B88E2F] hover:text-[#F59E0B] transition-colors">
                Explore All
                <ArrowRight className="size-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedWithImages.map(rp => (
                <ProductCard key={rp.id} product={rp} />
              ))}
            </div>
            
            <Link href="/products" className="flex sm:hidden items-center justify-center gap-2 text-sm font-medium text-[#B88E2F] hover:text-[#F59E0B] mt-8">
              Explore All
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}

      </div>
    </>
  )
}
