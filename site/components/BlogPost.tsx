// Una nota del blog, en la misma URL que tenía en el sitio anterior: /2026/10/03/peptidos-y-perdida-de-peso…/
// La versión en inglés va en /en/2026/10/03/peptides-weight-loss…/ (ver lib/blog.ts).

import Image from "next/image";
import { notFound } from "next/navigation";
import { PageShell } from "./PageShell";
import { PostCard, PostGrid } from "./PostCard";
import { Icon } from "./Icon";
import { JsonLd } from "./JsonLd";
import { Rich } from "./Rich";
import { findPost, formatDate, posts, translationOf, type Post, type PostParams } from "@/lib/blog";
import { content } from "@/lib/content";
import { fill, otherLang, type Lang } from "@/lib/i18n";
import { articleLd, breadcrumbLd, pageMetadata, webPageLd } from "@/lib/seo";
import styles from "./BlogPost.module.css";

/** La nota en castellano y en inglés, si está traducida. */
function alternatesOf(post: Post) {
  const other = translationOf(post);
  return other && ({ [post.lang]: post.path, [other.lang]: other.path } as Record<Lang, string>);
}

export function postMetadata(lang: Lang, params: PostParams) {
  const post = findPost(lang, params);
  if (!post) return {};
  return pageMetadata({
    lang,
    title: post.title,
    description: post.description,
    path: post.path,
    alternates: alternatesOf(post),
    article: { publishedTime: post.date, authors: [post.author], section: post.category },
  });
}

export function BlogPost({ lang, params }: { lang: Lang; params: PostParams }) {
  const post = findPost(lang, params);
  if (!post) notFound();
  const { t, pages, team, links, price } = content(lang);
  const ronald = team.find((m) => m.id === "ronald")!;
  const more = posts[lang].filter((p) => p !== post).slice(0, 3);
  const byRonald = post.author === ronald.name;
  // El botón de idioma lleva a la nota traducida, o al blog del otro idioma si no lo está.
  const alternate = translationOf(post)?.path ?? content(otherLang(lang)).pages.blog;

  return (
    <PageShell lang={lang} alternate={alternate}>
      <JsonLd
        data={[
          webPageLd({ lang, path: post.path, name: post.title, description: post.description }),
          breadcrumbLd(lang, [
            { name: t.menu.blog, path: pages.blog },
            { name: post.title, path: post.path },
          ]),
          articleLd(post),
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
                  <a href={pages.blog}>{t.menu.blog}</a>
                </li>
                <li aria-current="page">{post.title}</li>
              </ol>
            </nav>
            <p className={styles.meta}>
              <span className="tag">{post.category}</span>
              <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
              <span>{fill(t.blog.lectura, { minutos: post.minutes })}</span>
            </p>
            <h1 className={styles.title}>{post.title}</h1>
            <p className={styles.byline}>
              {t.blog.por}{" "}
              {byRonald ? (
                <a href={`${pages.home}#zar`} rel="author">
                  {post.author}
                </a>
              ) : (
                post.author
              )}
            </p>
          </div>
        </header>

        <div className={styles.wide}>
          <figure className={styles.cover}>
            <Image src={post.image} alt={post.title} width={post.imageSize.w} height={post.imageSize.h} sizes="(max-width: 1000px) 92vw, 960px" fetchPriority="high" />
          </figure>
        </div>

        <div className={styles.narrow}>
          <div className={styles.prose} dangerouslySetInnerHTML={{ __html: post.html }} />

          {byRonald && (
            <aside className={styles.author}>
              <Image src={ronald.img.src} alt={ronald.name} width={ronald.img.w} height={ronald.img.h} sizes="88px" />
              <div>
                <p className="tag">{t.blog.sobreElAutor}</p>
                <p className={styles.authorName}>
                  <a href={`${pages.home}#zar`}>{ronald.name}</a>
                </p>
                <p>{ronald.bio}</p>
              </div>
            </aside>
          )}

          <aside className={styles.cta}>
            <p className={styles.ctaTitle}>
              <Rich text={t.blog.planTitulo} emClass="serif gold-text" />
            </p>
            <p>{t.blog.planTexto}</p>
            <div className={styles.ctaLinks}>
              <a className="btn btn--gold" href={links.retoOnline}>
                <span>{t.blog.planBoton}</span>
                <span className="btn__price">{price("reto-online")}</span>
              </a>
              <a className="link-arrow" href={`${pages.home}#programas`}>
                {t.blog.verProgramas} <Icon name="arrow" />
              </a>
            </div>
          </aside>
        </div>
      </article>

      {more.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className={`h2 h2--sm ${styles.moreTitle}`}>
              <Rich text={t.blog.masNotas} emClass="serif gold-text" />
            </h2>
            <PostGrid>
              {more.map((p) => (
                <PostCard key={p.slug} post={p} heading="h3" />
              ))}
            </PostGrid>
          </div>
        </section>
      )}
    </PageShell>
  );
}
