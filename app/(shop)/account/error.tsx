'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Account section error:', error);
  }, [error]);

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
        {/* Luxury Gold Icon Badge */}
        <div className="mx-auto w-14 h-14 rounded-full bg-[#B88E2F]/10 border border-[#B88E2F]/20 flex items-center justify-center mb-5">
          <AlertTriangle className="w-7 h-7 text-[#B88E2F]" />
        </div>

        <span className="inline-block text-xs uppercase tracking-widest text-[#B88E2F] font-semibold mb-2">
          Account Portal
        </span>

        <h1 className="text-2xl font-serif font-bold text-[#111827] mb-2">
          Unable to Load Account
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          We encountered an issue retrieving your account details. Please try again or return to your dashboard.
        </p>

        {error.digest && (
          <div className="mb-6 px-3 py-2 bg-muted/50 rounded-md text-xs font-mono text-muted-foreground break-all">
            Reference: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="rounded-full bg-[#111827] text-white hover:bg-[#111827]/90 px-5 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>

          <Button
            
            variant="outline"
            className="rounded-full border-border hover:bg-muted/50 px-5 gap-2"
          >
            <Link href="/account">
              <User className="w-4 h-4" />
              Account Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
