/* ── helpers ──────────────────────────────────────────────────────────────── */
export const fmt = (n: number) => {
  // n is already in KSh (converted from cents in data layer)
  return n >= 1000 ? `KSh ${(n / 1000).toFixed(0)}k` : `KSh ${n.toFixed(0)}`
}

export const statusStyle: Record<string, string> = {
  Fulfilled:  "bg-emerald-100 text-emerald-700",
  Delivered:  "bg-emerald-100 text-emerald-700",
  Processing: "bg-blue-100   text-blue-700",
  Confirmed:  "bg-sky-100    text-sky-700",
  Shipped:    "bg-cyan-100   text-cyan-700",
  Pending:    "bg-amber-100  text-amber-800",
  Atelier:    "bg-purple-100 text-purple-700",
  Cancelled:  "bg-stone-100  text-stone-700",
  Refunded:   "bg-red-100    text-red-700",
}
