import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: process.env.BASE_PATH || '',
  assetPrefix: process.env.ASSET_PREFIX || '',
  images: { path: `${process.env.BASE_PATH || ''}/_next/image` },
};

export default nextConfig;
