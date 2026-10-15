'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Checkout error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-[#FAF9F6] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-border shadow-md p-8 md:p-10 text-center">
        {/* Luxury Gold Icon Container */}
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-[#B88E2F]" />
        </div>

        <span className="inline-block text-xs uppercase tracking-widest text-[#B88E2F] font-semibold mb-2">
          Secure Checkout
        </span>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#111827] mb-3">
          Unable to Proceed with Checkout
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          An unexpected issue prevented your checkout session from loading. Your items remain safely saved in your shopping bag.
        </p>

        {error.digest && (
          <div className="mb-6 px-3 py-2 bg-muted/60 rounded-md text-xs font-mono text-muted-foreground break-all">
            Reference ID: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="rounded-full bg-[#111827] text-white hover:bg-[#111827]/90 px-6 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>

          <Button
            
            variant="outline"
            className="rounded-full border-border hover:bg-muted/50 px-6 gap-2"
          >
            <Link href="/cart">
              <ShoppingBag className="w-4 h-4" />
              Return to Bag
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
