'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Storefront error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-[#FAF9F6] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#B88E2F]/20 shadow-lg p-8 sm:p-10 text-center">
        {/* Diamond / Sparkle badge */}
        <div className="mx-auto size-16 rounded-full bg-[#B88E2F]/10 border border-[#B88E2F]/20 flex items-center justify-center mb-6">
          <Sparkles className="size-8 text-[#B88E2F]" />
        </div>

        <span className="inline-block text-xs uppercase tracking-widest text-[#B88E2F] font-semibold mb-2">
          Storefront Interruption
        </span>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827] mb-3">
          Something Went Wrong
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          We encountered an unexpected disruption while presenting our collection. Please refresh the page or try again.
        </p>

        {error.digest && (
          <div className="mb-6 px-3 py-2 bg-muted/60 rounded-md text-xs font-mono text-muted-foreground break-all">
            Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="rounded-full bg-[#111827] text-white hover:bg-[#111827]/90 px-6 gap-2"
          >
            <RotateCcw className="size-4" />
            Try Again
          </Button>

          <Button
           
            variant="outline"
            className="rounded-full border-border hover:bg-muted/50 px-6 gap-2"
          >
            <Link href="/">
              <Home className="size-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
