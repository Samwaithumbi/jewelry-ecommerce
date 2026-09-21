"use client"

import Link from "next/link"

const shopLinks = [
  { name: "All Jewelry", href: "/shop" },
  { name: "Rings", href: "/shop?category=rings" },
  { name: "Necklaces", href: "/shop?category=necklaces" },
  { name: "Earrings", href: "/shop?category=earrings" },
]

const discoverLinks = [
  { name: "AI Stylist", href: "/ai-stylist" },
  { name: "Visual Search", href: "/visual-search" },
  { name: "AR Try-On", href: "/ar-try-on" },
  { name: "Blog", href: "/blog" },
]

const contactInfo = {
  phone: "+1 (555) 123-4567",
  email: "hello@luminajewels.com",
  address: "123 Luxury Lane, Beverly Hills, CA 90210",
}

const socialLinks = [
  {
    name: "Instagram",
    href: "https://instagram.com/luminajewels",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://facebook.com/luminajewels",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    name: "Pinterest",
    href: "https://pinterest.com/luminajewels",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c -6.627 0 -12 5.372 -12 12c0 5.084 3.163 9.426 7.627 11.174c -0.105 -0.949 -0.2 -2.405 0.042 -3.441c0.218 -0.937 1.407 -5.965 1.407 -5.965s -0.359 -0.719 -0.359 -1.782c0 -1.668 0.967 -2.914 2.171 -2.914c1.023 0 1.518 0.769 1.518 1.69c0 1.029 -0.655 2.568 -0.994 3.995c -0.283 1.194 0.599 2.169 1.777 2.169c2.133 0 3.772 -2.249 3.772 -5.495c0 -2.873 -2.064 -4.882 -5.012 -4.882c -3.414 0 -5.418 2.561 -5.418 5.207c0 1.031 0.397 2.138 0.893 2.738c0.098 0.119 0.112 0.224 0.083 0.345c -0.091 0.378 -0.293 1.189 -0.332 1.355c -0.053 0.218 -0.174 0.265 -0.4 0.159c -1.492 -0.694 -2.424 -2.875 -2.424 -4.627c0 -3.771 2.74 -7.24 7.913 -7.24c4.157 0 7.39 2.963 7.39 6.931c0 4.136 -2.607 7.464 -6.227 7.464c -1.216 0 -2.359 -0.631 -2.75 -1.378c0 0 -0.601 2.288 -0.744 2.84c -0.269 1.035 -0.997 2.334 -1.485 3.129c1.115 0.347 2.293 0.535 3.514 0.535c6.627 0 12 -5.373 12 -12c0 -6.628 -5.373 -12 -12 -12z" />
      </svg>
    ),
  },
]

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Logo & Tagline */}
          <div className="md:col-span-1">
            <h3 className="text-2xl font-playfair-display mb-4">LUMINA JEWELS</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Crafting extraordinary jewelry for life's most meaningful moments. Every piece tells a story, every stone holds a memory.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#B8860B] flex items-center justify-center transition-colors"
                  aria-label={social.name}
                >
                  {social.icon}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Shop Links */}
          <div>
            <h4 className="font-medium mb-4 text-[#B8860B]">SHOP</h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Discover Links */}
          <div>
            <h4 className="font-medium mb-4 text-[#B8860B]">DISCOVER</h4>
            <ul className="space-y-3">
              {discoverLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="font-medium mb-4 text-[#B8860B]">CONTACT</h4>
            <ul className="space-y-3">
              <li className="text-gray-400 text-sm">{contactInfo.phone}</li>
              <li className="text-gray-400 text-sm">{contactInfo.email}</li>
              <li className="text-gray-400 text-sm">{contactInfo.address}</li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2024 Lumina Jewels. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-gray-500 hover:text-white transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-white transition-colors text-sm">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
