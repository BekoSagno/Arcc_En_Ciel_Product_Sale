import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(process.cwd()),
  },
  /** Faute fréquente dans l’URL collée chez Djomy : …/djom au lieu de …/djomy */
  async rewrites() {
    return [{ source: "/api/webhooks/djom", destination: "/api/webhooks/djomy" }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
