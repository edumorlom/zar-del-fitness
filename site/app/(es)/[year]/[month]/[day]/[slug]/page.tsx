import { BlogPost, postMetadata } from "@/components/BlogPost";
import { postParams, type PostParams } from "@/lib/blog";

// Una nota del blog, en la misma URL que tenía en el sitio anterior: /2026/10/03/peptidos-y-perdida-de-peso…/
export const dynamicParams = false;

export const generateStaticParams = () => postParams("es");

export async function generateMetadata({ params }: { params: Promise<PostParams> }) {
  return postMetadata("es", await params);
}

export default async function PostPage({ params }: { params: Promise<PostParams> }) {
  return <BlogPost lang="es" params={await params} />;
}
