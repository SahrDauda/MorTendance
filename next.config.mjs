/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable Turbopack explicitly to avoid deprecated middleware warning noise
  // while keeping room for future Turbopack options if needed.
  turbopack: {},
}

export default nextConfig
