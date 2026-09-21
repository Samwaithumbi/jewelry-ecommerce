import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/providers/session-provider"
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumina Jewels - Fine Jewelry Store",
  description: "Discover extraordinary jewelry for life's most meaningful moments. Certified, ethically sourced fine jewelry with AI-powered styling assistance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable}`}>
      <body className="font-sans">
        <NuqsAdapter>
         <Navbar/>
          <AuthProvider>{children}</AuthProvider>
          <Footer/>
        </NuqsAdapter>
      </body>
    </html>
  )
}
