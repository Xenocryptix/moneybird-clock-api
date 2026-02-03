import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/TheodenClient/Clock",
  distDir: process.env.BUILD_DIR || '.next',
};

export default nextConfig;
