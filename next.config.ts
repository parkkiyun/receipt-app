import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qpwglizwntusxytwrkxm.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
    ],
  },
};

export default nextConfig;
