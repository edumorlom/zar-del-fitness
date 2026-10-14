import { PodcastIndex, podcastsMetadata } from "@/components/PodcastIndex";

export const metadata = podcastsMetadata("en");

export default function PodcastsPage() {
  return <PodcastIndex lang="en" />;
}
