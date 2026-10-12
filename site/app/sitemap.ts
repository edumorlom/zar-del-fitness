import type { MetadataRoute } from "next";
import { posts, translationOf, type Post } from "@/lib/blog";
import { content } from "@/lib/content";
import { lastCommit } from "@/lib/git";
import { LANGS } from "@/lib/i18n";
import { abs, languages, type Alternates } from "@/lib/seo";

export const dynamic = "force-static";

// La fecha de la última vez que cambió cada página (lastmod), del historial de git. Google y Bing la usan para saber
// qué volver a leer, y scripts/indexnow.mjs para avisarle a Bing qué cambió en cada despliegue.
// El inicio cambia con los datos de db/ y con los componentes.
const homeUpdated = lastCommit("../db/*.json", "components");
// Una nota: su archivo, o su fecha si todavía no tiene commit. Nunca antes de su fecha.
const postUpdated = (p: Post) => {
  const commit = lastCommit(`../db/blog/${p.lang === "en" ? "en/" : ""}${p.slug}.md`);
  return commit && commit.slice(0, 10) > p.date ? commit : p.date;
};
const latest = (dates: string[]) => dates.reduce((a, b) => (new Date(b) > new Date(a) ? b : a));

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

  return LANGS.flatMap((lang) => {
    const updated = posts[lang].map(postUpdated);
    return [
      {
        ...page(home[lang], lang === "es" ? 1 : 0.9, home, ["/img/ronald-hero.jpg", "/img/ronald-seated.webp", "/img/vip-gym.webp"]),
        lastModified: homeUpdated,
      },
      // El blog cambia cuando cambia alguna de sus notas.
      { ...page(blog[lang], 0.7, blog), lastModified: updated.length ? latest(updated) : undefined, changeFrequency: "weekly" as const },
      ...posts[lang].map((p, i) => {
        const other = translationOf(p);
        const alternates = other && ({ [p.lang]: p.path, [other.lang]: other.path } as Alternates);
        return { ...page(p.path, 0.6, alternates, [p.image]), lastModified: updated[i], changeFrequency: "yearly" as const };
      }),
    ];
  });
}
