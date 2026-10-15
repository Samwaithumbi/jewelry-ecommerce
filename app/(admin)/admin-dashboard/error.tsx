'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin Dashboard error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-muted/20">
      <div className="max-w-lg w-full bg-background rounded-2xl border border-border shadow-md p-8 md:p-10 text-center">
        {/* Admin Error Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-5">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>

        <span className="inline-block text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
          Management Console
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
          Dashboard Analytics Failed to Load
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          There was an error aggregating the dashboard data (revenue, orders, or inventory health). This may be a temporary database connectivity interruption.
        </p>

        {error.digest && (
          <div className="mb-6 px-3 py-2 bg-muted rounded-md text-xs font-mono text-muted-foreground break-all">
            Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => reset()}
            className="rounded-lg gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Dashboard
          </Button>

          <Button
           
            variant="outline"
            className="rounded-lg gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              Storefront
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
