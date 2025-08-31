import type { NextConfig } from "next";
/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ignore ESLint errors
  },
  typescript: {
    ignoreBuildErrors: true, // ignore TS errors
  },
};
export default nextConfig;
