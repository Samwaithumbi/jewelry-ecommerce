"use client"

import { useState, useEffect } from "react"
import React from "react"
import { useRouter } from "next/navigation"
import { Search, Download, MoreHorizontal, ChevronDown, ChevronUp, X } from "lucide-react"
import { getCustomers } from "@/app/actions/admin/get-customers"

const tierStyle: Record<string, string> = {
  Diamond: "bg-purple-100 text-purple-700",
  Gold: "bg-amber-100 text-amber-700",
  Silver: "bg-gray-100 text-gray-700",
  Bronze: "bg-orange-100 text-orange-700",
}

const statusStyle: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-600",
}

const orderStatusStyle: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTier, setSelectedTier] = useState("All")
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCustomers() {
      try {     
        const data = await getCustomers()
        setCustomers(data)

      } catch (error) {
        console.error("Client: Failed to fetch customers:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTier = selectedTier === "All" || customer.tier === selectedTier

    return matchesSearch && matchesTier
  })

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const diamondMembers = customers.filter((c) => c.tier === "Diamond").length
  const activeCustomers = customers.filter((c) => c.status === "Active").length

  

  const formatCurrency = (cents: number) => {
    return `KSh ${(cents / 100).toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const toggleExpand = (customerId: string) => {
    setExpandedCustomerId(expandedCustomerId === customerId ? null : customerId)
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground">{customers.length} registered members</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium hover:bg-muted transition">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Total Customer Revenue
            </p>
            <p className="mt-2 text-2xl font-bold">
              {totalRevenue >= 1000
                ? `KSh ${(totalRevenue / 1000).toFixed(1)}k`
                : `KSh ${(totalRevenue / 100).toFixed(2)}`
              }
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Diamond Members
            </p>
            <p className="mt-2 text-2xl font-bold">{diamondMembers}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Active Customers
            </p>
            <p className="mt-2 text-2xl font-bold">{activeCustomers}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10 transition"
            />
          </div>

          <div className="flex gap-2">
            {["All", "Diamond", "Gold", "Silver", "Bronze"].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-md text-xs font-medium transition ${
                  selectedTier === tier
                    ? "bg-[#1A1A2E] text-white"
                    : "border border-border bg-background hover:bg-muted"
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Customers Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Contact</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Tier</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Orders</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Total Spent(Ksh)</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer, i) => (
                    <React.Fragment key={customer.id}>
                      <tr
                        className={`border-b border-border hover:bg-muted/20 transition ${
                          i % 2 === 0 ? "" : "bg-muted/5"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <button
                            onClick={() => router.push(`/admin-dashboard/customers/${customer.id}`)}
                            className="font-medium hover:text-[#B8860B] transition text-left"
                          >
                            {customer.name}
                          </button>
                          <div className="text-xs text-muted-foreground">
                            {customer.id}
                            {customer.isGuest && (
                              <span className="ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-blue-100 text-blue-700">
                                Guest
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs">{customer.email}</div>
                          <div className="text-xs text-muted-foreground">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              tierStyle[customer.tier] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {customer.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium">{customer.orders}</td>
                        <td className="px-6 py-4 font-medium">{(customer.totalSpent)/100}</td>
                        <td className="px-6 py-4 text-muted-foreground">{customer.joined}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              statusStyle[customer.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {customer.orders > 0 && (
                              <button
                                onClick={() => toggleExpand(customer.id)}
                                className="text-muted-foreground hover:text-foreground transition"
                                title="View orders"
                              >
                                {expandedCustomerId === customer.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            <button className="text-muted-foreground hover:text-foreground transition">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedCustomerId === customer.id && customer.ordersData && (
                        <tr key={`${customer.id}-expanded`}>
                          <td colSpan={8} className="px-6 py-4 bg-muted/10">
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Order History ({customer.ordersData.length} orders)
                              </h4>
                              <div className="rounded-lg border border-border bg-background overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Order #</th>
                                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Date</th>
                                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Total</th>
                                      <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {customer.ordersData.map((order: any) => (
                                      <tr key={order.id} className="border-b border-border last:border-0">
                                        <td className="px-4 py-2 font-medium">{order.orderNumber}</td>
                                        <td className="px-4 py-2 text-muted-foreground">{formatDate(order.createdAt)}</td>
                                        <td className="px-4 py-2 font-medium">{formatCurrency(order.totalCents)}</td>
                                        <td className="px-4 py-2">
                                          <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                              orderStatusStyle[order.status] ?? "bg-gray-100 text-gray-600"
                                            }`}
                                          >
                                            {order.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}