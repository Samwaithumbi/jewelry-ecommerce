import { Footer } from "@/components/footer"
import { Navbar } from "@/components/navbar"
import { getServerSession } from "next-auth";
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions);
   const user = session?.user ?? null
  
  // NuqsAdapter is needed here so that shop pages can use URL-based filter state
  // (nuqs/adapters/next/app must wrap the component tree that uses useQueryState)
  return (
  (
    <>
  <Navbar user={user}/>
  <NuqsAdapter>{children}</NuqsAdapter>
   <Footer/>

   </>
  )
  );
}
