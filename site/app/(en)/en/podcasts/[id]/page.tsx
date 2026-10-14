import { episodeMetadata, PodcastEpisode } from "@/components/PodcastEpisode";
import { episodeParams } from "@/lib/podcasts";

// Un episodio del podcast en inglés: /en/podcasts/suplementos-ciencia-o-estafa/ (el "id" de db/podcasts.json).
export const dynamicParams = false;

export const generateStaticParams = episodeParams;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return episodeMetadata("en", (await params).id);
}

export default async function EpisodePage({ params }: { params: Promise<{ id: string }> }) {
  return <PodcastEpisode lang="en" id={(await params).id} />;
}
