/** @type {import("next").NextConfig} */
const iisDefaultBasePath = process.env.IISNODE_VERSION ? "/TheodenClient/Clock" : "";
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || iisDefaultBasePath;
const basePath = rawBasePath ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}` : undefined;

const nextConfig = {
  basePath,
  assetPrefix: basePath,
  distDir: ".next",
};

module.exports = nextConfig;
