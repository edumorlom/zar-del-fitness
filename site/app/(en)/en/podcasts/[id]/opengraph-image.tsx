import { episodeImage, ogContentType, ogSize } from "@/lib/og";
import { episodeParams } from "@/lib/podcasts";

const image = episodeImage("en");

export const dynamic = "force-static";
export const alt = image.alt;
export const size = ogSize;
export const contentType = ogContentType;

export const generateStaticParams = episodeParams;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  return image.render((await params).id);
}
