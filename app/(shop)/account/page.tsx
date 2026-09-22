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
  const loyaltyPoints = user?.loyaltyBalance || 0
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2022'

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#111827] mb-2">
          Welcome back, {session.user.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-muted-foreground">
          Gold Member - Member since {memberSince}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Orders"
          value={totalOrders.toString()}
          subtitle="+2 this month"
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Loyalty Points"
          value={loyaltyPoints.toLocaleString()}
          subtitle="+380 this month"
          icon={Gift}
          color="gold"
        />
        <StatCard
          title="Wishlist Items"
          value={wishlistCount.toString()}
          subtitle="2 on sale"
          icon={Heart}
          color="red"
        />
        <StatCard
          title="Referrals"
          value="4"
          subtitle="$200 earned"
          icon={Users}
          color="purple"
        />
      </div>

      {/* Loyalty Progress */}
      <Card className="mb-8 border-[#B88E2F]/20 bg-gradient-to-r from-[#B88E2F]/5 to-[#B88E2F]/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#111827] mb-1">Gold Member</h3>
              <p className="text-sm text-muted-foreground">
                {loyaltyPoints.toLocaleString()} / 5,000 points to Platinum
              </p>
            </div>
            <Button className="bg-[#B88E2F] text-white hover:bg-[#B88E2F]/90">
              View Rewards
            </Button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#B88E2F] h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((loyaltyPoints / 5000) * 100, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#111827]">Recent Orders</h2>
          <Link href="/account/orders">
            <Button variant="ghost" className="text-[#B88E2F] hover:text-[#B88E2F]/80">
              View All
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="size-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#111827] mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                Start shopping to see your order history here.
              </p>
              <Link href="/products">
                <Button className="bg-[#111827] text-white hover:bg-[#111827]/90">
                  Browse Products
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
  const colors = {
    blue: 'bg-blue-500',
    gold: 'bg-[#B88E2F]',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  }

  return (
    <Card className="border-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`size-10 rounded-lg ${colors[color]} bg-opacity-10 flex items-center justify-center`}>
            <Icon className={`size-5 ${colors[color].replace('bg-', 'text-')}`} />
          </div>
          <TrendingUp className="size-4 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-[#111827] mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-xs text-[#B88E2F]">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function OrderCard({ order }: { order: any }) {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
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
  const statusColor = statusColors[status] || 'bg-gray-100 text-gray-800'
  const statusLabel = statusLabels[status] || status

  return (
    <Card className="border-primary/10 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-lg bg-[#F8F7F5] flex items-center justify-center">
            <Package className="size-8 text-[#B88E2F]/50" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-[#111827]">{order.orderNumber}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#111827]">
              ${(order.totalCents / 100).toFixed(2)}
            </p>
            <Link href={`/account/orders/${order.id}`}>
              <Button variant="ghost" size="sm" className="text-[#B88E2F] hover:text-[#B88E2F]/80">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
