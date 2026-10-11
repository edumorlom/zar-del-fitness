import { BlogIndex, blogMetadata } from "@/components/BlogIndex";

export const metadata = blogMetadata("en");

export default function BlogPage() {
  return <BlogIndex lang="en" />;
}
