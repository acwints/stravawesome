import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'dgalywyr863hv.cloudfront.net', // Allow Strava profile images
      'www.strava.com', // Allow Strava official assets
    ],
  },
};

export default nextConfig;
