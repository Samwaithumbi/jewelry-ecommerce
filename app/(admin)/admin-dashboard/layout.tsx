import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="flex h-12 items-center gap-2 border-b border-border px-4 shrink-0 bg-background">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-[1px] bg-border" />
          <span className="text-xs font-medium text-muted-foreground">Lumina Admin Portal</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}