import path from "node:path";
import type { NextConfig } from "next";
import { deviceSizes, imageSizes } from "./lib/image-variants.mjs";

// Un solo proyecto, dos builds:
// - el sitio (`npm run build`): páginas estáticas en out/, para cPanel (Apache) y Railway (Caddy). Sin servidor.
// - el portal (`npm run build:portal`, PORTAL=1): mi.zardelfitness.com.ar, con servidor (Clerk, Postgres, formularios)
//   en .next-portal/standalone/, para Railway.
// Cada build toma sus propios archivos de Next.js (page, layout, route, proxy, instrumentation) por su extensión
// (pageExtensions): los del sitio son page.tsx, los del portal page.portal.tsx (en app/(portal)/). El resto (componentes,
// lib/, estilos, db/) es uno solo y lo usan los dos.
const portal = process.env.PORTAL === "1";

// Los precios, planes, horarios y textos están en db/, en la raíz del repo: sin esto, Turbopack no lee archivos fuera
// de site/.
const root = path.join(__dirname, "..");

const site: NextConfig = {
  // Static export to `out/` for plain hosting (cPanel/Apache)
  output: "export",
  // Sólo page.tsx, layout.tsx…: page.portal.tsx no es una página para este build (y el portal no se puede exportar).
  pageExtensions: ["tsx", "ts"],
  trailingSlash: true,
  // Sin servidor que achique las fotos: las copias en WebP de cada ancho las hace scripts/copy-images.mjs en el build,
  // y lib/image-loader.ts las pone en el srcset.
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts", deviceSizes, imageSizes },
  turbopack: { root },
  // cacheComponents / partialPrefetching (PPR) are not allowed with `output: "export"`
  // Dos layouts raíz (app/(es) y app/(en), uno por idioma): la 404 va aparte, en app/global-not-found.tsx.
  // experimental.inlineCss no conviene: Next.js pone el CSS dos veces en el HTML (en <style> y en los datos de React),
  // la página pesa el doble comprimida y Lighthouse dio peor primera pintada (1,7 s contra 1,5 s) el 2026-10-12.
  experimental: { globalNotFound: true },
};

const portalConfig: NextConfig = {
  // El servidor con sólo lo que usa (server.js y sus node_modules), para la imagen de deploy/portal.Dockerfile.
  output: "standalone",
  // Aparte de .next/, para que un build no pise al otro.
  distDir: ".next-portal",
  // Sólo page.portal.tsx, layout.portal.tsx…: las páginas del sitio no son parte del portal.
  pageExtensions: ["portal.tsx", "portal.ts"],
  turbopack: { root },
  outputFileTracingRoot: root,
  poweredByHeader: false,
  // El único <Image> es el logo del menú (components/Header.tsx), ya chico: sin el optimizador de imágenes.
  images: { unoptimized: true },
  // La ficha del cliente sube su foto (hasta PHOTO_MAX_MB de portal/lib/storage.ts) con el resto del formulario.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
};

export default portal ? portalConfig : site;
