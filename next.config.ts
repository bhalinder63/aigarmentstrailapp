import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large image uploads (base64 photos can be 5-10MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
