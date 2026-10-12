import { execSync } from "node:child_process";
import path from "node:path";
import type { NextConfig } from "next";
import { deviceSizes, imageSizes } from "./lib/image-variants.mjs";

// El commit del build, para LogRocket (components/SessionRecording.tsx): cada sesión dice qué versión del sitio vio.
// En GitHub Actions viene en GITHUB_SHA.
function release() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "local";
  }
}

const nextConfig: NextConfig = {
  // Static export to `out/` for plain hosting (cPanel/Apache)
  output: "export",
  trailingSlash: true,
  // Sin servidor que achique las fotos: las copias en WebP de cada ancho las hace scripts/copy-images.mjs en el build,
  // y lib/image-loader.ts las pone en el srcset.
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts", deviceSizes, imageSizes },
  env: { RELEASE: release() },
  // Los precios, planes y horarios están en db/, en la raíz del repo, compartidos con el asistente:
  // sin esto, Turbopack no lee archivos fuera de site/.
  turbopack: { root: path.join(__dirname, "..") },
  // cacheComponents / partialPrefetching (PPR) are not allowed with `output: "export"`
  // Dos layouts raíz (app/(es) y app/(en), uno por idioma): la 404 va aparte, en app/global-not-found.tsx.
  // experimental.inlineCss no conviene: Next.js pone el CSS dos veces en el HTML (en <style> y en los datos de React),
  // la página pesa el doble comprimida y Lighthouse dio peor primera pintada (1,7 s contra 1,5 s) el 2026-10-12.
  experimental: { globalNotFound: true },
};

export default nextConfig;
