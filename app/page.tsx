import { HeroSection } from "@/components/home/hero-section"
import { ShopByCategory } from "@/components/home/shop-by-category"
import { AIStylist } from "@/components/home/ai-stylist"
import { BestSellers } from "@/components/home/best-sellers"
import { NewArrivals } from "@/components/home/new-arrivals"
import { Testimonials } from "@/components/home/testimonials"
import { SocialGallery } from "@/components/home/social-gallery"

export default function Home() {
  return (
    <main>
      <HeroSection />
      <ShopByCategory />
      <AIStylist />
      <BestSellers />
      <NewArrivals />
      <Testimonials />
      <SocialGallery />
    </main>
  )
}
