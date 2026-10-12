import type { MetadataRoute } from "next";
import { business, content } from "@/lib/content";

export const dynamic = "force-static";

// El sitio instalado en el celular arranca en castellano (hay un solo manifest).
export default function manifest(): MetadataRoute.Manifest {
  const { t, locale, pages } = content("es");
  return {
    name: `${business.name} · ${t.seo.otroNombre}`,
    short_name: business.name,
    description: t.seo.aplicacion,
    lang: locale.html,
    start_url: pages.home,
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon1.png", sizes: "192x192", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
