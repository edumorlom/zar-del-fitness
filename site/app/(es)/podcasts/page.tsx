import { PodcastIndex, podcastsMetadata } from "@/components/PodcastIndex";

export const metadata = podcastsMetadata("es");

export default function PodcastsPage() {
  return <PodcastIndex lang="es" />;
}
