import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Ronald Medina, el Zar del Fitness";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ eyebrow: "Personal trainer · Emmy Winner 2024", title: "Ronald Medina", accent: "el Zar del Fitness" });
}
