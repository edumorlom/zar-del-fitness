import { PageShell } from "./PageShell";
import { PageHero } from "./PageHero";
import { EpisodeCard, EpisodeGrid } from "./EpisodeCard";
import { FinalCta } from "./FinalCta";
import { JsonLd } from "./JsonLd";
import { content } from "@/lib/content";
import { localePath, otherLang, type Lang } from "@/lib/i18n";
import { episodes } from "@/lib/podcasts";
import { abs, breadcrumbLd, pageMetadata, webPageLd } from "@/lib/seo";

const alternates = { es: localePath("es", "/podcasts/"), en: localePath("en", "/podcasts/") };

/** El título, la descripción y la URL de los podcasts en un idioma. */
export function podcastsMetadata(lang: Lang) {
  const { t, pages } = content(lang);
  return pageMetadata({ lang, title: t.seo.podcasts.titulo, description: t.seo.podcasts.descripcion, path: pages.podcasts, alternates });
}

/** La lista de episodios del podcast en un idioma (/podcasts/ y /en/podcasts/). Cada uno se abre en el modal de video. */
export function PodcastIndex({ lang }: { lang: Lang }) {
  const { t, pages } = content(lang);
  const path = pages.podcasts;
  const { titulo: title, descripcion: description } = t.seo.podcasts;
  return (
    <PageShell lang={lang} alternate={alternates[otherLang(lang)]}>
      <JsonLd
        data={[
          {
            ...webPageLd({ lang, path, name: title, description, type: "CollectionPage" }),
            // Los VideoObject van en la página de cada episodio, donde el video se ve apenas carga.
            mainEntity: {
              "@type": "ItemList",
              itemListElement: episodes[lang].map((e, i) => ({ "@type": "ListItem", position: i + 1, url: abs(e.path) })),
            },
          },
          breadcrumbLd(lang, [{ name: t.menu.podcasts, path }]),
        ]}
      />

      <PageHero
        home={{ name: t.general.inicio, path: pages.home }}
        crumbsLabel={t.general.migasDePan}
        crumbs={[{ name: t.menu.podcasts, path }]}
        eyebrow={t.podcasts.antetitulo}
        lines={t.podcasts.titulo}
        lead={<p>{t.podcasts.bajada}</p>}
      />

      <section className="section">
        <div className="container">
          <EpisodeGrid>
            {episodes[lang].map((e) => (
              <EpisodeCard key={e.videoId} episode={e} cursor={t.general.cursorVideo} />
            ))}
          </EpisodeGrid>
        </div>
      </section>

      <FinalCta lang={lang} />
    </PageShell>
  );
}
