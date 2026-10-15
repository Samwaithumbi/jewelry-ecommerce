"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[ProductDetailError]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        <div className="size-16 rounded-3xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 mb-6 shadow-xs">
          <AlertTriangle className="size-8" />
        </div>

        <span className="text-xs font-semibold tracking-widest text-rose-600 uppercase mb-2">
          Unable to Load Piece
        </span>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827] tracking-tight mb-3">
          Failed to Load Product Details
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          We encountered a connection issue while retrieving this piece&apos;s details. Please try reloading.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#111827] hover:bg-[#111827]/90 text-white rounded-full px-7 py-2.5 text-xs font-semibold shadow-xs"
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            Try Again
          </Button>
          <Link href="/products" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-gray-300 hover:bg-white text-gray-700 rounded-full px-6 py-2.5 text-xs font-semibold"
            >
              <ArrowLeft className="mr-1.5 size-3.5" />
              Browse Collection
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
