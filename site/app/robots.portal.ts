import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";

// El robots.txt de mi.zardelfitness.com.ar. Nombra el sitemap del sitio: el ingreso del portal está ahí, y un sitemap
// de otro dominio sólo vale para estas páginas si el robots.txt de este dominio lo nombra.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: abs("/sitemap.xml") };
}
