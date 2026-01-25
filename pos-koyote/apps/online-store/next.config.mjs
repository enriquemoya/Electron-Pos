import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const imageHost = process.env.NEXT_PUBLIC_IMAGE_HOST || "example.com";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: imageHost,
        pathname: "/**"
      }
    ]
  }
};

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

export default withNextIntl(nextConfig);
