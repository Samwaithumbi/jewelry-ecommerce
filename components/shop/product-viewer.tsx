"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Rotate3D, ChevronLeft, ChevronRight } from "lucide-react"

interface ProductImage {
  id: string
  url: string
  is360: boolean | null
  altText: string | null
}

export function ProductViewer({ images }: { images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  
  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-2xl flex items-center justify-center text-muted-foreground">
        No image available
      </div>
    )
  }

  const activeImage = images[activeIndex]

  const nextImage = () => setActiveIndex((prev) => (prev + 1) % images.length)
  const prevImage = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square bg-[#FCFBF9] rounded-3xl overflow-hidden border border-primary/5 flex items-center justify-center group">
        {activeImage.is360 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F9F7F2]">
            <Rotate3D className="size-12 text-[#B88E2F] mb-4 opacity-80" />
            <p className="text-sm font-medium text-muted-foreground">Interactive 360° Viewer</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Drag to rotate</p>
          </div>
        ) : (
          <Image
            src={activeImage.url}
            alt={activeImage.altText || "Product view"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
        )}
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full size-10 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white text-[#111827] border border-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevImage}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full size-10 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white text-[#111827] border border-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <ChevronRight className="size-5" />
            </Button>
          </>
        )}

        {activeImage.is360 && (
          <div className="absolute top-4 left-4 bg-[#111827]/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Rotate3D className="size-3.5" />
            360° View
          </div>
        )}
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                "relative flex-shrink-0 size-20 rounded-xl overflow-hidden border-2 transition-all duration-200",
                activeIndex === idx ? "border-[#F59E0B]" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              {img.is360 ? (
                <div className="absolute inset-0 bg-[#F9F7F2] flex items-center justify-center">
                  <Rotate3D className="size-5 text-[#B88E2F]" />
                </div>
              ) : (
                <Image
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
