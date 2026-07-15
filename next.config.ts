import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // Disable streaming metadata so prerender shell and browser use the same head tree.
  htmlLimitedBots: /.*/,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest-sistema.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon.png",
        permanent: false,
      },
      {
        source: "/fidelizacao",
        destination: "/app",
        permanent: true,
      },
      {
        source: "/fidelizacao/:path*",
        destination: "/app/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
