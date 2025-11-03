import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: process.env.BASE_PATH || '',
  images: { path: `${process.env.BASE_PATH || ''}/_next/image` },
};

export default nextConfig;
