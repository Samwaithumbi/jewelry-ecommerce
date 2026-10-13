"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Package, DollarSign, ShoppingBag, Calendar, Mail, Phone, MapPin, ChevronDown, ChevronUp, XCircle } from "lucide-react"
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

// Orders that should NOT count towards revenue
const EXCLUDED_STATUSES = new Set(['cancelled', 'refunded'])

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string

  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const customers = await getCustomers()
        const foundCustomer = customers.find((c: any) => c.id === customerId)
        setCustomer(foundCustomer || null)
      } catch (error) {
        console.error("Failed to fetch customer:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCustomer()
  }, [customerId])

  const formatCurrency = (cents: number) => {
    return `KSh ${(cents / 100).toLocaleString()}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading customer details...</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Customer not found</div>
      </div>
    )
  }

  // Separate valid vs excluded orders for this customer
  const validOrders = customer.ordersData.filter((order: any) => !EXCLUDED_STATUSES.has(order.status))
  const excludedOrders = customer.ordersData.filter((order: any) => EXCLUDED_STATUSES.has(order.status))

  // Recalculate metrics based on valid orders only
  const validOrderCount = validOrders.length
  const validTotalSpent = validOrders.reduce((sum: number, order: any) => sum + order.totalCents, 0)
  const averageOrderValue = validOrderCount > 0 ? validTotalSpent / validOrderCount : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Customers
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{customer.name}</h1>
            <p className="text-muted-foreground">
              {customer.id} • {customer.email}
              {customer.isGuest && (
                <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-700">
                  Guest
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                tierStyle[customer.tier] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {customer.tier}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                statusStyle[customer.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {customer.status}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Valid Orders</span>
          </div>
          <p className="text-2xl font-bold">{validOrderCount}</p>
          {excludedOrders.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {excludedOrders.length} cancelled/refunded
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(validTotalSpent)}</p>
          {excludedOrders.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Excluding cancelled/refunded
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Package className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Avg Order Value</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Member Since</span>
          </div>
          <p className="text-2xl font-bold">{customer.joined}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold">Order History</h2>
              <p className="text-sm text-muted-foreground">
                {customer.ordersData.length} total orders ({validOrderCount} valid, {excludedOrders.length} cancelled/refunded)
              </p>
            </div>
            <div className="divide-y divide-border">
              {customer.ordersData.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground">
                  No orders yet
                </div>
              ) : (
                customer.ordersData.map((order: any, index: number) => {
                  const isExcluded = EXCLUDED_STATUSES.has(order.status)
                  return (
                    <div key={order.id} className={`p-6 ${isExcluded ? 'bg-muted/30' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {order.orderNumber}
                            {isExcluded && (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`font-medium ${isExcluded ? 'line-through text-muted-foreground' : ''}`}>
                              {formatCurrency(order.totalCents)}
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                orderStatusStyle[order.status] ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="text-muted-foreground hover:text-foreground transition"
                          >
                            {expandedOrderId === order.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      {expandedOrderId === order.id && (
                        <div className="pt-4 border-t border-border mt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Order ID</div>
                              <div className="font-medium">{order.id}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Status</div>
                              <div className="font-medium capitalize">{order.status}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Total</div>
                              <div className={`font-medium ${isExcluded ? 'line-through text-muted-foreground' : ''}`}>
                                {formatCurrency(order.totalCents)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Created</div>
                              <div className="font-medium">{formatDate(order.createdAt)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Customer Info */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{customer.email}</div>
                </div>
              </div>
              {customer.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium">{customer.phone}</div>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm text-muted-foreground">Member Since</div>
                  <div className="font-medium">{customer.joined}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Customer ID</div>
                <div className="font-medium">{customer.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tier</div>
                <div className="font-medium">{customer.tier}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium">{customer.status}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Valid Orders</div>
                <div className="font-medium">{validOrderCount}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="font-medium">{formatCurrency(validTotalSpent)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
