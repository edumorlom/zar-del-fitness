import { PageShell } from "./PageShell";
import { PageHero } from "./PageHero";
import { PostCard, PostGrid } from "./PostCard";
import { FinalCta } from "./FinalCta";
import { JsonLd } from "./JsonLd";
import { posts } from "@/lib/blog";
import { content } from "@/lib/content";
import { localePath, otherLang, type Lang } from "@/lib/i18n";
import { abs, breadcrumbLd, pageMetadata, webPageLd } from "@/lib/seo";

const alternates = { es: localePath("es", "/blog/"), en: localePath("en", "/blog/") };

/** El título, la descripción y la URL del blog en un idioma. */
export function blogMetadata(lang: Lang) {
  const { t, pages } = content(lang);
  return pageMetadata({ lang, title: t.seo.blog.titulo, description: t.seo.blog.descripcion, path: pages.blog, alternates });
}

/** La lista de notas del blog en un idioma (/blog/ y /english/blog/). */
export function BlogIndex({ lang }: { lang: Lang }) {
  const { t, pages } = content(lang);
  const path = pages.blog;
  const { titulo: title, descripcion: description } = t.seo.blog;
  return (
    <PageShell lang={lang} alternate={alternates[otherLang(lang)]}>
      <JsonLd
        data={[
          {
            ...webPageLd({ lang, path, name: title, description, type: "CollectionPage" }),
            mainEntity: {
              "@type": "ItemList",
              itemListElement: posts[lang].map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(p.path) })),
            },
          },
          breadcrumbLd(lang, [{ name: t.menu.blog, path }]),
        ]}
      />

      <PageHero
        home={{ name: t.general.inicio, path: pages.home }}
        crumbsLabel={t.general.migasDePan}
        crumbs={[{ name: t.menu.blog, path }]}
        eyebrow={t.blog.antetitulo}
        lines={t.blog.titulo}
        lead={<p>{t.blog.bajada}</p>}
      />

      <section className="section">
        <div className="container">
          <PostGrid>
            {posts[lang].map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </PostGrid>
        </div>
      </section>

      <FinalCta lang={lang} />
    </PageShell>
  );
}
