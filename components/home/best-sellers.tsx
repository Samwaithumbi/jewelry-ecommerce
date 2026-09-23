import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getBestSellers } from "@/app/actions/home/get-featured-products"
import { ProductCard } from "@/components/shop/product-card"

export async function BestSellers() {
  const products = await getBestSellers()

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair-display text-gray-900">Best Sellers</h2>
          <Link
            href="/products?sort=bestsellers"
            className="flex items-center gap-2 text-[#B8860B] hover:text-[#9A7009] font-medium transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
