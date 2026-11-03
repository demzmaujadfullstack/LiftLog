import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents dimatikan: next-auth (Auth.js) membaca cookies() di banyak
  // segmen; pola Suspense wajib per-route belum didukung adapter-nya.
  cacheComponents: false,
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
