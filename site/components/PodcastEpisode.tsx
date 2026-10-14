import { notFound } from "next/navigation";
import { PageShell } from "./PageShell";
import { EpisodeCard, EpisodeGrid } from "./EpisodeCard";
import { FinalCta } from "./FinalCta";
import { JsonLd } from "./JsonLd";
import { Rich } from "./Rich";
import { content } from "@/lib/content";
import { fill, otherLang, type Lang } from "@/lib/i18n";
import { episodes, findEpisode, formatDate, type Episode } from "@/lib/podcasts";
import { breadcrumbLd, pageMetadata, videoLd, webPageLd } from "@/lib/seo";
import styles from "./PodcastEpisode.module.css";

/** El mismo episodio en castellano y en inglés (tiene el mismo id en los dos). */
const alternatesOf = (e: Episode) => ({ [e.lang]: e.path, [otherLang(e.lang)]: findEpisode(otherLang(e.lang), e.id)!.path }) as Record<Lang, string>;

export function episodeMetadata(lang: Lang, id: string) {
  const episode = findEpisode(lang, id);
  if (!episode) return {};
  return pageMetadata({ lang, title: episode.pageTitle, description: episode.description, path: episode.path, alternates: alternatesOf(episode) });
}

/**
 * La página de un episodio (/podcasts/<id>/): el video arriba, a la vista apenas carga (Google sólo muestra en sus
 * resultados de video las páginas cuyo contenido principal es el video), su resumen y los otros episodios.
 */
export function PodcastEpisode({ lang, id }: { lang: Lang; id: string }) {
  const episode = findEpisode(lang, id);
  if (!episode) notFound();
  const { t, pages } = content(lang);
  const more = episodes[lang].filter((e) => e !== episode);

  return (
    <PageShell lang={lang} alternate={alternatesOf(episode)[otherLang(lang)]}>
      <JsonLd
        data={[
          webPageLd({ lang, path: episode.path, name: episode.pageTitle, description: episode.description }),
          breadcrumbLd(lang, [
            { name: t.menu.podcasts, path: pages.podcasts },
            { name: episode.title, path: episode.path },
          ]),
          videoLd(episode),
        ]}
      />

      <article>
        <header className={styles.head} id="top">
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.narrow}>
            <nav aria-label={t.general.migasDePan} className={styles.crumbs}>
              <ol>
                <li>
                  <a href={pages.home}>{t.general.inicio}</a>
                </li>
                <li>
                  <a href={pages.podcasts}>{t.menu.podcasts}</a>
                </li>
                <li aria-current="page">{episode.title}</li>
              </ol>
            </nav>
            <p className={styles.meta}>
              <span className="tag">{t.podcasts.antetitulo}</span>
              <time dateTime={episode.date}>{formatDate(episode.date, lang)}</time>
              <span>{fill(t.podcasts.duracion, { minutos: Math.round(episode.seconds / 60) })}</span>
            </p>
            <h1 className={styles.title}>{episode.title}</h1>
            <p className={styles.guest}>{fill(t.podcasts.con, { invitado: episode.guest })}</p>
          </div>
        </header>

        <div className={styles.wide}>
          <div className={styles.video}>
            <iframe
              src={`https://www.youtube.com/embed/${episode.videoId}?rel=0`}
              title={episode.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        </div>

        <div className={`${styles.narrow} ${styles.summary}`}>
          {episode.summary.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </article>

      {more.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className={`h2 h2--sm ${styles.moreTitle}`}>
              <Rich text={t.podcasts.masEpisodios} emClass="serif gold-text" />
            </h2>
            <EpisodeGrid>
              {more.map((e) => (
                <EpisodeCard key={e.id} episode={e} cursor={t.general.cursorVideo} heading="h3" />
              ))}
            </EpisodeGrid>
          </div>
        </section>
      )}

      <FinalCta lang={lang} />
    </PageShell>
  );
}
