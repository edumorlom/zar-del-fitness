import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export to `out/` for plain hosting (cPanel/Apache)
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // cacheComponents / partialPrefetching (PPR) are not allowed with `output: "export"`
};

export default nextConfig;
