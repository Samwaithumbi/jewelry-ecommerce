import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Unauthenticated users are sent to the sign-in page
  if (!session?.user) {
    redirect("/sign_in")
  }

  // Non-admin users are sent back to the homepage
  if ((session.user as any).role !== "admin") {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="flex h-12 items-center gap-2 border-b border-border px-4 shrink-0 bg-background">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-[1px] bg-border" />
          <span className="text-xs font-medium text-muted-foreground">Lumina Admin Portal</span>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  )
}