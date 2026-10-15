import Link from "next/link";
import { Gem, ArrowLeft, Sparkles, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <div className="min-h-[75vh] bg-[#FAF9F6] flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full text-center space-y-8 bg-white/80 backdrop-blur-sm p-8 sm:p-12 rounded-3xl border border-[#B88E2F]/20 shadow-lg">
        {/* Diamond Icon */}
        <div className="mx-auto size-20 rounded-full bg-[#B88E2F]/10 border border-[#B88E2F]/30 flex items-center justify-center text-[#B88E2F]">
          <Gem className="size-10 stroke-[1.5]" />
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#B88E2F] font-semibold">
            Product Not Found
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#111827]">
            This Piece Is Unavailable
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            The jewelry piece you are looking for may have been archived, discontinued, or acquired by another collector.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            
            className="rounded-full bg-[#111827] text-white hover:bg-[#111827]/90 px-6 gap-2"
          >
            <Link href="/products">
              <Compass className="size-4" />
              Explore All Collections
            </Link>
          </Button>
          <Button
            
            variant="outline"
            className="rounded-full border-border hover:bg-muted/50 px-6 gap-2"
          >
            <Link href="/">
              <ArrowLeft className="size-4" />
              Return Home
            </Link>
          </Button>
        </div>

        {/* Popular Categories Shortcut */}
        <div className="pt-6 border-t border-border/40">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
            Browse by Category
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: "Rings", href: "/products?category=rings" },
              { label: "Necklaces", href: "/products?category=necklaces" },
              { label: "Earrings", href: "/products?category=earrings" },
              { label: "Bracelets", href: "/products?category=bracelets" },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/60 hover:bg-[#B88E2F]/15 hover:text-[#B88E2F] transition-colors"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
