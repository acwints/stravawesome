/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.stravawesome.com',
          },
        ],
        destination: 'https://stravawesome.com/:path*',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig 