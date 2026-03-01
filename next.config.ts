import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  experimental: {
    optimizePackageImports: ['lucide-react', 'radix-ui'],
  },
};

export default nextConfig;
