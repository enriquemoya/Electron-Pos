import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const rawHosts = process.env.NEXT_PUBLIC_IMAGE_HOST || "";
const hosts = Array.from(
  new Set(
    rawHosts
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .concat(["cdn.danimezone.com", "example.com"])
  )
);

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: hosts.map((hostname) => ({
      protocol: "https",
      hostname,
      pathname: "/**"
    }))
  }
};

const withNextIntl = createNextIntlPlugin("./i18n.ts");

export default withNextIntl(nextConfig);
