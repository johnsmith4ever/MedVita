import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // NOTE: 'output: export' removed — Clerk auth requires server-side rendering
  images: {
    // Allow Next/Image to serve images from public folder
    remotePatterns: [],
  },
}

export default nextConfig
