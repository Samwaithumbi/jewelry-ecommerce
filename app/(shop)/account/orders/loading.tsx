import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AccountOrdersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
      </div>

      {/* Orders Table Container */}
      <Card className="border border-border/60 shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-muted/30 border-b border-border/50 py-4 px-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden md:block">
            <div className="grid grid-cols-6 gap-4 p-4 border-b border-border/50 bg-muted/10 text-xs font-medium">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-16 justify-self-end rounded" />
            </div>

            <div className="divide-y divide-border/40">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-6 gap-4 p-4 items-center">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Card List View (Visible only on mobile) */}
          <div className="block md:hidden divide-y divide-border/40 p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="pt-4 first:pt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
