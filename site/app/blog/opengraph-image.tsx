import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Blog de Zar del Fitness: entrenamiento, alimentación y mitos";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ eyebrow: "Blog", title: "Entrenamiento y alimentación", accent: "sin mitos" });
}
