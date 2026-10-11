import { BlogIndex, blogMetadata } from "@/components/BlogIndex";

export const metadata = blogMetadata("es");

export default function BlogPage() {
  return <BlogIndex lang="es" />;
}
