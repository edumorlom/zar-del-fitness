"use client";

// El loader de next/image (next.config.ts): para cada ancho del srcset, la copia en WebP más chica que alcanza
// (las hace scripts/copy-images.mjs antes de dev y build). Una imagen que no está en lib/image-widths.json (un SVG)
// va tal cual.
import widths from "./image-widths.json";
import { variantPath } from "./image-variants.mjs";

const available: Record<string, number[]> = widths;

export default function imageLoader({ src, width }: { src: string; width: number }) {
  const list = available[src];
  if (!list) return src;
  return variantPath(src, list.find((w) => w >= width) ?? list[list.length - 1]);
}
