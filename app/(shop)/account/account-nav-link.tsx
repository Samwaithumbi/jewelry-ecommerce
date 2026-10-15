"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Gift,
  Users,
  Settings,
} from 'lucide-react'

const iconMap: Record<string, any> = {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Gift,
  Users,
  Settings,
}

export function AccountNavLink({ 
  href, 
  iconName, 
  children,
  isMobile = false
}: { 
  href: string; 
  iconName: string; 
  children: React.ReactNode;
  isMobile?: boolean;
}) {
  const pathname = usePathname()
  const isActive = pathname === href
  const Icon = iconMap[iconName]

  if (isMobile) {
    return (
      <Link
        href={href}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
          isActive
            ? 'bg-[#B88E2F] text-white font-medium shadow-sm'
            : 'text-gray-400 hover:text-white bg-gray-800/60'
        }`}
      >
        <Icon className="size-3.5" />
        <span>{children}</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-[#B88E2F] text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`}
    >
      <Icon className="size-5" />
      <span>{children}</span>
    </Link>
  )
}
