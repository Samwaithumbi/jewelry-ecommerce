import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminDashboardLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      {/* Dashboard Header Skeleton */}
      <div className="border-b bg-background px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-sm" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-5 space-y-4">
        {/* Row 1 — Revenue + Category */}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Revenue Card Skeleton */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <Skeleton className="h-5 w-32 rounded" />
                <Skeleton className="h-8 w-44 rounded-md" />
              </div>
              <Skeleton className="h-8 w-24 rounded-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Category Mix Card Skeleton */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-4 w-48 rounded" />
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-4">
              <Skeleton className="size-44 rounded-full" />
              <div className="w-full mt-6 space-y-2">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2 — Orders + AI Insights */}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          {/* Recent Orders Skeleton */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Insights Skeleton */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-5 w-28 rounded" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg border border-border/50 space-y-2 bg-muted/20">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Row 3 — Inventory Section */}
        <Card className="shadow-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-1">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-4 w-56 rounded" />
            </div>
            <Skeleton className="h-8 w-28 rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/40">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-md" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-36 rounded" />
                      <Skeleton className="h-3 w-24 rounded" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
