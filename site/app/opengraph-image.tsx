import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Zar del Fitness: el Reto de los 25 días by Ronald Medina";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ eyebrow: "Personal trainer · Colegiales, CABA · Online", title: "Reto de los 25 días", accent: "by Ronald Medina, el Zar del Fitness" });
}
