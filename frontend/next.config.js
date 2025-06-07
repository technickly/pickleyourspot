/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'pickleyourspot.com'],
    },
  },
}

module.exports = nextConfig 