/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  transpilePackages: ["@pos/ui", "@pos/core"]
};

export default nextConfig;
