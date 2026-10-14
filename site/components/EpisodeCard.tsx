import Image from "next/image";
import { VideoLink } from "./motion/VideoLink";
import { business } from "@/lib/content";
import { formatDate, type Episode } from "@/lib/podcasts";
import styles from "./EpisodeCard.module.css";

/**
 * Un episodio del podcast, en la lista y en "Más episodios". Es un link a su página; un click común abre el video en
 * el modal, sin salir de la página (components/motion/VideoLink.tsx). `cursor` es el texto del cursor ("Play").
 */
export function EpisodeCard({ episode, cursor, heading: Heading = "h2" }: { episode: Episode; cursor: string; heading?: "h2" | "h3" }) {
  return (
    <article className={styles.card} data-reveal>
      <VideoLink
        videoId={episode.videoId}
        page={{ url: episode.path, title: `${episode.pageTitle} | ${business.name}` }}
        cursor={cursor}
        className={styles.link}
      >
        <div className={styles.img}>
          <Image src={episode.image} alt={episode.title} fill sizes="(max-width: 700px) 90vw, (max-width: 1100px) 45vw, 30vw" />
        </div>
        <div className={styles.body}>
          <p className={styles.meta}>
            <span className="tag">{episode.guest}</span>
            <time dateTime={episode.date}>{formatDate(episode.date, episode.lang)}</time>
          </p>
          <Heading className={styles.title}>{episode.title}</Heading>
          <p className={styles.desc}>{episode.description}</p>
        </div>
      </VideoLink>
    </article>
  );
}

/** La grilla de episodios. */
export function EpisodeGrid({ children }: { children: React.ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
