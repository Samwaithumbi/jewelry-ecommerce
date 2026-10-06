import { Footer } from "@/components/footer"
import "./globals.css"
import { Navbar } from "@/components/navbar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  )
}