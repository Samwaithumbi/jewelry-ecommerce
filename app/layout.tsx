import "./globals.css"

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
        {children}
      </body>
    </html>
  )
}