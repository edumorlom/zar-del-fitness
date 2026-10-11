import type { MetadataRoute } from "next";
import { posts, translationOf } from "@/lib/blog";
import { content } from "@/lib/content";
import { LANGS } from "@/lib/i18n";
import { abs, languages, type Alternates } from "@/lib/seo";

export const dynamic = "force-static";

// Todas las páginas del sitio, en los dos idiomas, para Google. Cada una dice cuál es su versión en el otro idioma
// (como los links hreflang de la página). Una página nueva tiene que agregarse acá.
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, alternates?: Alternates, images: string[] = []) => ({
    url: abs(path),
    changeFrequency: "monthly" as const,
    priority,
    images: images.map(abs),
    ...(alternates && {
      alternates: { languages: Object.fromEntries(Object.entries(languages(alternates)).map(([l, p]) => [l, abs(p)])) },
    }),
  });

  const [es, en] = LANGS.map((l) => content(l).pages);
  const home = { es: es.home, en: en.home };
  const blog = { es: es.blog, en: en.blog };

  return LANGS.flatMap((lang) => [
    page(home[lang], lang === "es" ? 1 : 0.9, home, ["/img/ronald-hero.jpg", "/img/ronald-seated.webp", "/img/vip-gym.webp"]),
    { ...page(blog[lang], 0.7, blog), lastModified: posts[lang][0]?.date, changeFrequency: "weekly" as const },
    ...posts[lang].map((p) => {
      const other = translationOf(p);
      const alternates = other && ({ [p.lang]: p.path, [other.lang]: other.path } as Alternates);
      return { ...page(p.path, 0.6, alternates, [p.image]), lastModified: p.date, changeFrequency: "yearly" as const };
    }),
  ]);
}
