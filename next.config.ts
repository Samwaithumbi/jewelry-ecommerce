
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "0kk5xcrl-3000.uks1.devtunnels.ms",
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
};

export default nextConfig;

