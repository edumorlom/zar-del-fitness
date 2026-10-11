import { ogContentType, ogImage, ogSize } from "@/lib/og";

export const dynamic = "force-static";
export const alt = "Sistema General Dirigido de Zar del Fitness, en Colegiales, CABA";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ eyebrow: "Presencial · The VIP", title: "Sistema General Dirigido", accent: "Colegiales, CABA" });
}
