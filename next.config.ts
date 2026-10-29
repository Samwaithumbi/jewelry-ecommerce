
import type { NextConfig } from "next";

// Force Next.js dev server to reload config and reset Turbopack compilation state
const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "0kk5xcrl-3000.uks1.devtunnels.ms",
    "192.168.137.1",
  ],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pub-eadd62b3653e49d6b966afa2fd346b14.r2.dev",
      },
    ],
  },

  experimental: {
    serverActions: {
      allowedOrigins: [
        "0kk5xcrl-3000.uks1.devtunnels.ms",
        "localhost",
      ],
    },
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

