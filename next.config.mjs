/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  transpilePackages: ['three'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images-assets.nasa.gov',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.nasa.gov',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mars.nasa.gov',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'mars.jpl.nasa.gov',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
