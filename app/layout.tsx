import "./globals.css"
import { Toaster } from "sonner"
export const metadata = {
     // ...your existing metadata
     verification: {
       google: "5348235bd3b9cdd8",
     },
   };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
         <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3000}
      />
        {children}
      </body>
    </html>
  )
}