import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getCategoryCounts } from "@/app/actions/home/get-category-counts"

const categoryImages: Record<string, string> = {
  ring: "/images/ring.jfif",
  necklace: "/images/necklace.jfif",
  earring: "/images/earring.jfif",
  bracelet: "/images/bracelet.jfif",
  pendant: "/images/pendant.webp",
  bangle: "/images/bangle.jfif",
  set: "/images/set.jfif",
}

export async function ShopByCategory() {
  const categoryCounts = await getCategoryCounts()

  const categories = categoryCounts.map((cat) => ({
    name: cat.category.charAt(0).toUpperCase() + cat.category.slice(1),
    count: cat.count,
    image: categoryImages[cat.category] || categoryImages.ring,
  }))

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl md:text-4xl font-playfair-display text-gray-900">Shop by Category</h2>
          <Link
            href="/products"
            className="flex items-center gap-2 text-[#B8860B] hover:text-[#9A7009] font-medium transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/products?category=${category.name.toLowerCase()}`}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">{category.name}</h3>
              <p className="text-sm text-gray-500">{category.count} pieces</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
