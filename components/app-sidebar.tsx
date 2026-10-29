
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Gem,
  Boxes,
  ChevronRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Overview",
    url: "/admin-dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    url: "/admin-dashboard/orders",
    icon: ShoppingCart,
  },
  {
    title: "Products",
    url: "/admin-dashboard/products",
    icon: Package,
  },
  {
    title: "Customers",
    url: "/admin-dashboard/customers",
    icon: Users,
  },
  {
    title: "Inventory",
    url: "/admin-dashboard/inventory",
    icon: Boxes,
  },
]

const navManagement = [
  {
    title: "Analytics",
    url: "/admin-dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/admin-dashboard/settings",
    icon: Settings,
  },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile, setOpen } = useSidebar()

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const isActive = (url: string) => {
    if (url === "/admin-dashboard") {
      return pathname === url
    }

    return pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="offcanvas"
      mobileWidth="75vw"
      className="sm:[--sidebar-width:17rem]"
    >
      {/* Brand */}
      <SidebarHeader className="border-b border-stone-200/70 px-4 py-5">
        <Link
          href="/admin-dashboard"
          onClick={handleNavClick}
          className="flex items-center gap-3 rounded-md
            outline-none focus-visible:ring-2
            focus-visible:ring-amber-700"
        >
          <span
            className="flex size-10 shrink-0 items-center
              justify-center rounded-xl bg-stone-950
              text-amber-400 shadow-sm"
          >
            <div className="relative size-7 rounded-full bg-[#B88E2F] flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-xs">
              L
            </div>
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px]
              font-semibold tracking-tight text-stone-900">
              Lumina Jewels
            </span>
            <span className="text-[10px] font-medium
              uppercase tracking-[0.18em] text-stone-500">
              Administration
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-1 px-3 py-4">
        {/* Main navigation */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="mb-2 px-3 text-[10px]
            font-semibold uppercase tracking-[0.16em]
            text-stone-400">
            Workspace
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navMain.map((item) => {
                const active = isActive(item.url)
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} onClick={handleNavClick} />}
                      isActive={active}
                      tooltip={item.title}
                      className="h-10 gap-3 rounded-lg px-3
                        text-[13px] font-medium text-stone-600
                        transition-colors duration-150
                        hover:bg-stone-100 hover:text-stone-950
                        data-[active=true]:bg-amber-50
                        data-[active=true]:font-semibold
                        data-[active=true]:text-amber-950
                        data-[active=true]:hover:bg-amber-100
                        focus-visible:ring-2
                        focus-visible:ring-amber-700"
                    >
                      <Icon
                        size={18}
                        strokeWidth={active ? 2.1 : 1.7}
                        className={
                          active
                            ? "text-amber-800"
                            : "text-stone-500"
                        }
                      />

                      <span>{item.title}</span>

                      {active && (
                        <ChevronRight
                          size={15}
                          className="ml-auto text-amber-800"
                        />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management navigation */}
        <SidebarGroup className="mt-5 p-0">
          <SidebarGroupLabel className="mb-2 px-3 text-[10px]
            font-semibold uppercase tracking-[0.16em]
            text-stone-400">
            Management
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navManagement.map((item) => {
                const active = isActive(item.url)
                const Icon = item.icon

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      render={<Link href={item.url} onClick={handleNavClick} />}
                      isActive={active}
                      tooltip={item.title}
                      className="h-10 gap-3 rounded-lg px-3
                        text-[13px] font-medium text-stone-600
                        transition-colors
                        hover:bg-stone-100 hover:text-stone-950
                        data-[active=true]:bg-amber-50
                        data-[active=true]:font-semibold
                        data-[active=true]:text-amber-950"
                    >
                      <Icon size={18} strokeWidth={1.7} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-stone-200/70 p-4">
        <div className="flex items-center gap-3 rounded-lg
          bg-stone-50 p-3">
          <div className="flex size-9 shrink-0 items-center
            justify-center rounded-full border border-amber-200
            bg-amber-100 text-xs font-semibold text-amber-950">
            LJ
          </div>

          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold
              text-stone-900">
              Lumina Jewels
            </p>
            <p className="truncate text-[11px] text-stone-500">
              Store administration
            </p>
          </div>
        </div>

        <p className="px-1 pt-2 text-center text-[10px]
          text-stone-400 group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} Lumina Jewels
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
