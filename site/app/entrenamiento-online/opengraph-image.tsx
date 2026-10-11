import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Entrenamiento online: el Reto de los 25 días de Zar del Fitness";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ eyebrow: "Online · Argentina e internacional", title: "Entrenamiento online", accent: "Reto de los 25 días" });
}
