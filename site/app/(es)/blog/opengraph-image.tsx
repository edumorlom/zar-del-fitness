import { blogImage, ogContentType, ogSize } from "@/lib/og";

const image = blogImage("es");

export const dynamic = "force-static";
export const alt = image.alt;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return image.render();
}
