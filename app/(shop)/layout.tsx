import { NuqsAdapter } from "nuqs/adapters/next/app"

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // NuqsAdapter is needed here so that shop pages can use URL-based filter state
  // (nuqs/adapters/next/app must wrap the component tree that uses useQueryState)
  return <NuqsAdapter>{children}</NuqsAdapter>
}
