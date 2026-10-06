import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-eadd62b3653e49d6b966afa2fd346b14.r2.dev',
      },
    ],
  },
};

export default nextConfig;
