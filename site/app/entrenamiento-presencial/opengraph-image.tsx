import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Entrenamiento personal presencial en Colegiales, CABA, con Zar del Fitness";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ eyebrow: "The VIP · Colegiales, CABA", title: "Entrenamiento personal", accent: "presencial en Colegiales" });
}
