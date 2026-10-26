import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getNewArrivals } from "@/app/actions/home/get-featured-products"
import { ProductCard } from "@/components/shop/product-card"

export async function NewArrivals() {
  const products = await getNewArrivals()

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex justify-between items-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair-display text-gray-900">New Arrivals</h2>
          <Link
            href="/products?sort=newest"
            className="flex items-center gap-1.5 sm:gap-2 text-[#B8860B] hover:text-[#9A7009] text-xs sm:text-sm font-medium transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
