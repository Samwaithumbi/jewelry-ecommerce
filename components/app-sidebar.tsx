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
  { title: "Customers", url: "/admin-dashboard/customers", icon: Users },
  { title: "Inventory", url: "/admin-dashboard/inventory", icon: Package },
  
]



export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2 py-3">
          <span className="text-lg font-semibold flex items-center gap-2 "> <span className="rounded-full text-black bg-orange-400 p-2">L</span>Lumina</span>
          <span className="text-xs font-medium ">Admin</span>
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
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


      </SidebarContent>

      <SidebarFooter>
        <div className="px-3 py-2 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lumina Jewelry Store
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}