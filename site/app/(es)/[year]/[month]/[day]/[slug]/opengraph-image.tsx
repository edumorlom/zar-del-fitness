import { postParams, type PostParams } from "@/lib/blog";
import { ogContentType, ogSize, postImage } from "@/lib/og";

const image = postImage("es");

export const dynamic = "force-static";
export const alt = image.alt;
export const size = ogSize;
export const contentType = ogContentType;

export const generateStaticParams = () => postParams("es");

export default async function Image({ params }: { params: Promise<PostParams> }) {
  return image.render((await params).slug);
}
