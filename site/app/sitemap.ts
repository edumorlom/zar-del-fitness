import type { MetadataRoute } from "next";
import { posts } from "@/lib/blog";
import { pages } from "@/lib/content";
import { abs } from "@/lib/seo";

export const dynamic = "force-static";

// Todas las páginas del sitio, para Google. Una página nueva tiene que agregarse acá.
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, images: string[] = []) => ({
    url: abs(path),
    changeFrequency: "monthly" as const,
    priority,
    images: images.map(abs),
  });

  return [
    page("/", 1, ["/img/ronald-hero.jpg", "/img/ronald-seated.webp", "/img/vip-gym.webp"]),
    { ...page(pages.blog, 0.7), lastModified: posts[0]?.date, changeFrequency: "weekly" as const },
    ...posts.map((p) => ({ ...page(p.path, 0.6, [p.image]), lastModified: p.date, changeFrequency: "yearly" as const })),
  ];
}
