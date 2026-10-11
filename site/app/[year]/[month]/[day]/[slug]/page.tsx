// Una nota del blog, en la misma URL que tenía en el sitio anterior: /2026/10/03/peptidos-y-perdida-de-peso…/

import Image from "next/image";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { PostCard, PostGrid } from "@/components/PostCard";
import { Icon } from "@/components/Icon";
import { JsonLd } from "@/components/JsonLd";
import { formatDate, posts } from "@/lib/blog";
import { links, pages, price, team } from "@/lib/content";
import { articleLd, breadcrumbLd, pageMetadata, webPageLd } from "@/lib/seo";
import styles from "./page.module.css";

type Params = { year: string; month: string; day: string; slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return posts.map((p) => {
    const [year, month, day] = p.date.split("-");
    return { year, month, day, slug: p.slug };
  });
}

const find = ({ year, month, day, slug }: Params) => posts.find((p) => p.slug === slug && p.date === `${year}-${month}-${day}`);

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const post = find(await params);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: post.path,
    article: { publishedTime: post.date, authors: [post.author], section: post.category },
  });
}

const ronald = team.find((m) => m.id === "ronald")!;

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const post = find(await params);
  if (!post) notFound();
  const more = posts.filter((p) => p !== post).slice(0, 3);
  const byRonald = post.author === ronald.name;

  return (
    <PageShell>
      <JsonLd
        data={[
          webPageLd({ path: post.path, name: post.title, description: post.description }),
          breadcrumbLd([
            { name: "Blog", path: pages.blog },
            { name: post.title, path: post.path },
          ]),
          articleLd(post),
        ]}
      />

      <article>
        <header className={styles.head} id="top">
          <div className={styles.glow} aria-hidden="true" />
          <div className={styles.narrow}>
            <nav aria-label="Migas de pan" className={styles.crumbs}>
              <ol>
                <li>
                  <a href="/">Inicio</a>
                </li>
                <li>
                  <a href={pages.blog}>Blog</a>
                </li>
                <li aria-current="page">{post.title}</li>
              </ol>
            </nav>
            <p className={styles.meta}>
              <span className="tag">{post.category}</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span>{post.minutes} min de lectura</span>
            </p>
            <h1 className={styles.title}>{post.title}</h1>
            <p className={styles.byline}>
              Por{" "}
              {byRonald ? (
                <a href="/#zar" rel="author">
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
            <Image src={post.image} alt="" width={post.imageSize.w} height={post.imageSize.h} sizes="(max-width: 1000px) 92vw, 960px" fetchPriority="high" />
          </figure>
        </div>

        <div className={styles.narrow}>
          <div className={styles.prose} dangerouslySetInnerHTML={{ __html: post.html }} />

          {byRonald && (
            <aside className={styles.author}>
              <Image src={ronald.img.src} alt={ronald.name} width={ronald.img.w} height={ronald.img.h} sizes="88px" />
              <div>
                <p className="tag">Sobre el autor</p>
                <p className={styles.authorName}>
                  <a href="/#zar">{ronald.name}</a>
                </p>
                <p>{ronald.bio}</p>
              </div>
            </aside>
          )}

          <aside className={styles.cta}>
            <p className={styles.ctaTitle}>
              ¿Querés un plan <em className="serif gold-text">hecho para vos?</em>
            </p>
            <p>Entrenamiento, alimentación y acompañamiento personalizados, online o en Colegiales.</p>
            <div className={styles.ctaLinks}>
              <a className="btn btn--gold" href={links.retoOnline}>
                <span>Reto de los 25 días</span>
                <span className="btn__price">{price("reto-online")}</span>
              </a>
              <a className="link-arrow" href="/#programas">
                Ver los programas <Icon name="arrow" />
              </a>
            </div>
          </aside>
        </div>
      </article>

      {more.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className={`h2 h2--sm ${styles.moreTitle}`}>
              Más <em className="serif gold-text">notas.</em>
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
