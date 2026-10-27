import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.18.107",
    "192.168.18.*",
    "192.168.*.*",
    "10.*.*.*",
  ],
};

export default nextConfig;
