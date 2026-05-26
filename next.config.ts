import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * NOTE: turbopack.root is REQUIRED here.
 *
 * A stray C:\Users\creoc\package-lock.json in the user's home directory makes
 * Next.js auto-detect the wrong workspace root (the entire home folder),
 * which causes Turbopack to scan tens of thousands of unrelated files and
 * makes the first `/` compile appear to hang. Pinning the root to this
 * project keeps the dev server fast on Windows.
 *
 * See: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.md
 */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    qualities: [75, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
