import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { AccountNavLink } from '@/app/(shop)/account/account-nav-link'
import { LogOut, Crown } from 'lucide-react'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/sign_in?callbackUrl=/account')
  }

  const navItems = [
    { href: '/account', label: 'Overview', iconName: 'LayoutDashboard' },
    { href: '/account/orders', label: 'My Orders', iconName: 'ShoppingBag' },
    { href: '/account/wishlist', label: 'Wishlist', iconName: 'Heart' },
    { href: '/account/loyalty', label: 'Loyalty Rewards', iconName: 'Gift' },
    { href: '/account/referrals', label: 'Referrals', iconName: 'Users' },
    { href: '/account/settings', label: 'Settings', iconName: 'Settings' },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#111827] min-h-screen sticky top-0 hidden lg:block">
          <div className="p-6">
            {/* User Profile */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="size-12 rounded-full bg-gradient-to-br from-[#B88E2F] to-[#D4A574] flex items-center justify-center text-white font-semibold text-lg">
                  {session.user.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <h2 className="text-white font-semibold">{session.user.name || 'User'}</h2>
                  <div className="flex items-center gap-1 text-[#B88E2F] text-xs">
                    <Crown className="size-3" />
                    <span>Gold Member</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">2,840 points</p>
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
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
