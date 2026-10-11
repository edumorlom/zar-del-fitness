import { BlogPost, postMetadata } from "@/components/BlogPost";
import { postParams, type PostParams } from "@/lib/blog";

// Una nota del blog en inglés: /english/2026/10/03/peptides-weight-loss…/ (ver lib/blog.ts).
export const dynamicParams = false;

export const generateStaticParams = () => postParams("en");

export async function generateMetadata({ params }: { params: Promise<PostParams> }) {
  return postMetadata("en", await params);
}

export default async function PostPage({ params }: { params: Promise<PostParams> }) {
  return <BlogPost lang="en" params={await params} />;
}
