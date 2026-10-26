import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from "@/lib/db"
import { orders, wishlists, users } from "@/drizzle/src/db/schema"
import { eq, desc, count, sql } from "drizzle-orm"
import { 
  ShoppingBag, 
  Heart, 
  Gift, 
  Users, 
  ArrowRight,
  Package,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default async function AccountOverview() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }

  // Fetch user data
  const userData = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1)
  const user = userData[0]

  // Fetch order count
  const orderCountResult = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.userId, session.user.id))

  // Fetch wishlist count
  const wishlistCountResult = await db
    .select({ count: count() })
    .from(wishlists)
    .where(eq(wishlists.userId, session.user.id))

  // Fetch recent orders
  const recentOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalCents: orders.totalCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))
    .limit(3)

  const totalOrders = orderCountResult[0]?.count || 0
  const wishlistCount = wishlistCountResult[0]?.count || 0
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently Joined'
  const tier = user?.customerTier || 'standard'
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1) + ' Member'

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-primary/10 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-[#111827] mb-1">
            Welcome back, {session.user.name?.split(' ')[0] || 'Friend'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {tierLabel} &bull; Member since {memberSince}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/products">
            <Button className="bg-[#111827] text-white hover:bg-[#111827]/90 rounded-full px-5 text-sm shadow-sm">
              <ShoppingBag className="size-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link href="/account/orders" className="block">
          <StatCard
            title="Total Orders"
            value={totalOrders.toString()}
            subtitle={totalOrders === 1 ? "1 order placed" : `${totalOrders} orders placed`}
            icon={ShoppingBag}
            color="blue"
          />
        </Link>
        <Link href="/account/wishlist" className="block">
          <StatCard
            title="Wishlist Items"
            value={wishlistCount.toString()}
            subtitle={wishlistCount === 1 ? "1 saved piece" : `${wishlistCount} saved pieces`}
            icon={Heart}
            color="red"
          />
        </Link>
        
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-serif font-semibold text-[#111827]">Recent Orders</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalOrders > 3
                ? `Showing 3 of ${totalOrders} orders`
                : "Track shipments and view previous purchases"}
            </p>
          </div>
          {recentOrders.length > 0 && (
            <Link href="/account/orders">
              <Button variant="ghost" className="text-[#B88E2F] hover:text-[#B88E2F]/80 text-sm font-medium">
                View All{totalOrders > 0 && <span className="ml-1 text-[#B88E2F]/60">({totalOrders})</span>}
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <Card className="border-primary/10 shadow-sm rounded-2xl bg-white">
            <CardContent className="p-12 text-center">
              <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                <Package className="size-8 text-[#B88E2F]/60" />
              </div>
              <h3 className="text-lg font-semibold text-[#111827] mb-1">No orders yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                Your order history and live parcel tracking updates will appear here once you make your first purchase.
              </p>
              <Link href="/products">
                <Button className="bg-[#111827] text-white hover:bg-[#111827]/90 rounded-full px-6 shadow-sm">
                  Browse Catalog
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string
  value: string
  subtitle: string
  icon: any
  color: 'blue' | 'gold' | 'red' | 'purple'
}) {
  return (
    <Card className="group relative overflow-hidden border border-[#E8E0D5] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-2xl cursor-pointer">
      {/* Subtle accent */}
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-[#C9A227]/10 blur-2xl transition-all duration-500 group-hover:bg-[#C9A227]/25" />

      <CardContent className="relative p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase font-semibold tracking-wider text-[#6B7280]">
              {title}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-3xl font-semibold tracking-tight text-[#111827]">
                {value}
              </h3>
            </div>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E8E0D5] bg-[#FAF8F4] group-hover:border-[#B88E2F]/40 transition-colors">
            <Icon className="size-5 text-[#B88E2F]" />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-primary/5">
          <p className="text-xs text-gray-500 font-medium">
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function OrderCard({ order }: { order: any }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    processing: 'bg-purple-100 text-purple-800 border-purple-200',
    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }

  const status = order.status as string
  const statusColor = statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  const statusLabel = statusLabels[status] || status

  return (
    <Card className="border-primary/10 hover:shadow-md transition-all duration-200 rounded-2xl bg-white overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-[#FAF8F5] border border-primary/10 flex items-center justify-center shrink-0">
              <Package className="size-7 text-[#B88E2F]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base text-[#111827]">{order.orderNumber}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-primary/5">
            <p className="font-bold text-base sm:text-lg text-[#111827]">
              KSh {(order.totalCents / 100).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <Link href={`/account/orders/${order.id}`}>
              <Button variant="ghost" size="sm" className="text-[#B88E2F] hover:text-[#B88E2F]/80 p-0 h-auto sm:mt-1 text-xs font-semibold hover:bg-transparent">
                View Details &rarr;
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
