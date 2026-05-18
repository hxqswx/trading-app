import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the root to this project to avoid monorepo detection false-positives
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
