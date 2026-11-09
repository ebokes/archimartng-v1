import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Let the dev server be opened from other devices on the LAN (e.g. a phone).
  // Without this, Next blocks its dev scripts and the page never hydrates.
  allowedDevOrigins: ['192.168.*.*'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}

export default nextConfig
