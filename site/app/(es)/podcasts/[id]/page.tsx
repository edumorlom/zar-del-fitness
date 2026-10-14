import { episodeMetadata, PodcastEpisode } from "@/components/PodcastEpisode";
import { episodeParams } from "@/lib/podcasts";

// Un episodio del podcast: /podcasts/suplementos-ciencia-o-estafa/ (el "id" de db/podcasts.json).
export const dynamicParams = false;

export const generateStaticParams = episodeParams;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return episodeMetadata("es", (await params).id);
}

export default async function EpisodePage({ params }: { params: Promise<{ id: string }> }) {
  return <PodcastEpisode lang="es" id={(await params).id} />;
}
