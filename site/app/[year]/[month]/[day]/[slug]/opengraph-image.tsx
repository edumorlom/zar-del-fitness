import { formatDate, posts } from "@/lib/blog";
import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Nota del blog de Zar del Fitness";
export const size = ogSize;
export const contentType = ogContentType;

type Params = { year: string; month: string; day: string; slug: string };

export function generateStaticParams(): Params[] {
  return posts.map((p) => {
    const [year, month, day] = p.date.split("-");
    return { year, month, day, slug: p.slug };
  });
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug)!;
  return ogImage({
    eyebrow: `${post.category} · ${formatDate(post.date)}`,
    title: post.title,
    accent: `Por ${post.author}`,
    withPhoto: false,
  });
}
