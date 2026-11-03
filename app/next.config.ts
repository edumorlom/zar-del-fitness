import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Usa los estilos y las animaciones de site/ y los datos de db/: sin esto, Turbopack no lee fuera de app/.
  turbopack: { root: path.join(__dirname, "..") },
  poweredByHeader: false,
  // El único <Image> es el logo del menú (site/components/Header.tsx), ya chico: sin el optimizador de imágenes.
  images: { unoptimized: true },
};

export default nextConfig;
