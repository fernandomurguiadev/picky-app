import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import path from "path";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd(), ".."),
  },
};

export default withNextIntl(nextConfig);
