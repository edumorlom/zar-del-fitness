import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Sin "Host:": es una directiva vieja de Yandex que no está en el estándar, y los validadores la marcan como inválida.
    sitemap: abs("/sitemap.xml"),
  };
}
