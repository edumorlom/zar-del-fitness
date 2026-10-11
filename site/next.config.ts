import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export to `out/` for plain hosting (cPanel/Apache)
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Los precios, planes y horarios están en db/, en la raíz del repo, compartidos con el asistente:
  // sin esto, Turbopack no lee archivos fuera de site/.
  turbopack: { root: path.join(__dirname, "..") },
  // cacheComponents / partialPrefetching (PPR) are not allowed with `output: "export"`
};

export default nextConfig;
