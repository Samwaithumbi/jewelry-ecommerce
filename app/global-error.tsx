"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F6] font-sans antialiased flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center flex flex-col items-center">
          <div className="size-16 rounded-3xl bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 mb-6 shadow-xs">
            <AlertCircle className="size-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Application Error
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            A critical error occurred. Please refresh the page to reload the application.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="size-3.5" />
            Reload Page
          </button>
        </div>
      </body>
    </html>
  )
}
