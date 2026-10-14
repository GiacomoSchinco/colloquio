import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/tecnologie", permanent: false },
      { source: "/tecnologia", destination: "/tecnologie", permanent: false },
      { source: "/tecnologia/:slug", destination: "/tecnologie/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
