import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { AccountNavLink } from '@/app/(shop)/account/account-nav-link'
import { LogOut, Crown } from 'lucide-react'
import { db } from '@/lib/db'
import { users } from '@/drizzle/src/db/schema'
import { eq } from 'drizzle-orm'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/sign_in?callbackUrl=/account')
  }

  const [dbUser] = await db
    .select({
      customerTier: users.customerTier,
      loyaltyBalance: users.loyaltyBalance,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const tier = dbUser?.customerTier || 'standard'
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1) + ' Member'
  const points = dbUser?.loyaltyBalance || 0

  const navItems = [
    { href: '/account', label: 'Overview', iconName: 'LayoutDashboard' },
    { href: '/account/orders', label: 'My Orders', iconName: 'ShoppingBag' },
    { href: '/account/wishlist', label: 'Wishlist', iconName: 'Heart' },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden bg-[#111827] text-white px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-gradient-to-br from-[#B88E2F] to-[#D4A574] flex items-center justify-center text-white font-semibold text-xs">
              {session.user.name?.charAt(0) || 'U'}
            </div>
            <div>
              <span className="text-sm font-semibold block leading-tight">{session.user.name || 'User'}</span>
              <span className="text-[11px] text-[#B88E2F]">{tierLabel}</span>
            </div>
          </div>
          <a
            href="/api/auth/signout"
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-gray-800/80 px-2.5 py-1.5 rounded-full"
          >
            <LogOut className="size-3" />
            <span>Sign Out</span>
          </a>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs">
          {navItems.map((item) => (
            <AccountNavLink key={item.href} href={item.href} iconName={item.iconName} isMobile>
              {item.label}
            </AccountNavLink>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#111827] min-h-screen sticky top-0 hidden lg:block shadow-xl">
          <div className="p-6">
            {/* User Profile */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-12 rounded-full bg-gradient-to-br from-[#B88E2F] to-[#D4A574] flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                  {session.user.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-white font-semibold leading-tight">{session.user.name || 'User'}</h2>
                  <div className="flex items-center gap-1 text-[#B88E2F] text-xs font-medium mt-0.5">
                    <Crown className="size-3" />
                    <span>{tierLabel}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-xs pl-0.5">
                {points.toLocaleString()} Loyalty Points
              </p>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <AccountNavLink key={item.href} href={item.href} iconName={item.iconName}>
                  {item.label}
                </AccountNavLink>
              ))}
            </nav>

            {/* Sign Out */}
            <div className="pt-8 mt-8 border-t border-gray-700">
              <a
                href="/api/auth/signout"
                className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="size-5" />
                <span>Sign Out</span>
              </a>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
