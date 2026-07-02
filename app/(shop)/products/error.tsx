"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error("[ProductsPage]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center gap-5 max-w-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-50 border border-red-100">
          <AlertTriangle className="size-8 text-red-400" />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-bold text-[#111827]">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t load the products right now. Please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono mt-1">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#111827]/90 transition-colors"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      </div>
    </div>
  )
}
