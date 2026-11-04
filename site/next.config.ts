import path from "node:path";
import type { NextConfig } from "next";
import { deviceSizes, imageSizes } from "./lib/image-variants.mjs";

// Un solo build para el sitio (zardelfitness.com.ar) y el portal (mi.zardelfitness.com.ar), servido por un solo
// servidor de Next.js en Railway (deploy/Dockerfile). Las páginas del sitio se generan estáticas en el build; las del
// portal, en cada pedido. Qué dominio ve qué páginas lo decide proxy.ts.
const root = path.join(__dirname, "..");

const nextConfig: NextConfig = {
  // El servidor con sólo lo que usa (server.js y sus node_modules), en .next/standalone/, para deploy/Dockerfile.
  output: "standalone",
  // Las URLs del sitio terminan en "/" (/blog/), como las tenía WordPress: así las conoce Google.
  trailingSlash: true,
  // …pero la redirección a la URL con "/" la hace proxy.ts, sólo en el sitio: las del portal (/clientes, /ingresar y
  // los pasos de Clerk) no la llevan.
  skipTrailingSlashRedirect: true,
  // Las copias en WebP de cada ancho las hace scripts/copy-images.mjs en el build, y lib/image-loader.ts las pone en
  // el srcset: sin el optimizador de imágenes de Next.js.
  images: { loader: "custom", loaderFile: "./lib/image-loader.ts", deviceSizes, imageSizes },
  // Los precios, planes, horarios y textos están en db/, en la raíz del repo: sin esto, Turbopack no lee archivos fuera
  // de site/.
  turbopack: { root },
  outputFileTracingRoot: root,
  // lib/blog.ts lee db/blog/ con fs (para las notas que no se generaron en el build): Next.js copia todo el proyecto al
  // servidor por las dudas. sharp sí va: lib/og.tsx lo usa y las imágenes para compartir se pueden generar en un pedido.
  outputFileTracingExcludes: { "*": ["site/public/**"] },
  poweredByHeader: false,
  // En desarrollo, el portal es http://mi.localhost:3000.
  allowedDevOrigins: ["mi.localhost"],
  // Tres layouts raíz (app/(es), app/(en) y app/(portal)): la 404 va aparte, en app/global-not-found.tsx.
  // experimental.inlineCss no conviene: Next.js pone el CSS dos veces en el HTML (en <style> y en los datos de React),
  // la página pesa el doble comprimida y Lighthouse dio peor primera pintada (1,7 s contra 1,5 s) el 2026-10-12.
  experimental: {
    globalNotFound: true,
    // La ficha del cliente sube su foto (hasta PHOTO_MAX_MB de portal/lib/storage.ts) con el resto del formulario.
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Los mismos encabezados de seguridad que tenía el .htaccess. HSTS sin includeSubDomains. Permissions-Policy no toca
  // fullscreen ni autoplay: los necesitan los videos de YouTube.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
        ],
      },
      // Las fotos (public/img/) cambian poco: una semana, como en cPanel. Los .js y .css ya llevan un año (con hash).
      { source: "/img/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800" }] },
    ];
  },
};

export default nextConfig;
