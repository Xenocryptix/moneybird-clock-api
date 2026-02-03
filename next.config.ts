import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  basePath: isProd ? "/TheodenClient/Clock" : undefined,
  distDir: process.env.BUILD_DIR || '.next',
};

export default nextConfig;
