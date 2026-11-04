import { abs } from "@/lib/seo";

// El robots.txt de mi.zardelfitness.com.ar (proxy.ts le antepone /portal). Nombra el sitemap del sitio: el ingreso del
// portal está ahí, y un sitemap de otro dominio sólo vale para estas páginas si el robots.txt de este dominio lo nombra.
export const dynamic = "force-static";

export function GET() {
  return new Response(`User-Agent: *\nAllow: /\n\nSitemap: ${abs("/sitemap.xml")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
