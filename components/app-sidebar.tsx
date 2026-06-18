import Link from "next/link"
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
} from "@/components/ui/sidebar"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Gem,
} from "lucide-react"

const navMain = [
  { title: "Overview", url: "/admin-dashboard", icon: LayoutDashboard },
  { title: "Orders", url: "/admin-dashboard/orders", icon: ShoppingCart },
  { title: "Products", url: "/admin-dashboard/products", icon: Package },
  { title: "Catalog", url: "/admin-dashboard/catalog", icon: Package },
  { title: "Customers", url: "/admin-dashboard/customers", icon: Users },
  { title: "AI Stylist", url: "/admin-dashboard/ai-stylist", icon: Package },
   { title: "Analytics", url: "/admin-dashboard/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin-dashboard/settings", icon: Settings },
]



export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-3">
          <span className="text-lg font-semibold "><Gem className="h-6 w-6 text-gold-300" /> Lumina</span>
          <span className="border ">Admin</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<Link href={item.url} />}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        
      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Jewelry Store
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}