import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { PostCard, PostGrid } from "@/components/PostCard";
import { FinalCta } from "@/components/FinalCta";
import { JsonLd } from "@/components/JsonLd";
import { posts } from "@/lib/blog";
import { pages } from "@/lib/content";
import { abs, breadcrumbLd, pageMetadata, webPageLd } from "@/lib/seo";

const path = pages.blog;
const title = "Blog de entrenamiento, alimentación y mitos del fitness";
const description =
  "Notas de Ronald Medina, el Zar del Fitness, y su equipo sobre entrenamiento, alimentación, suplementación y los mitos del gimnasio, explicados sin vueltas.";

export const metadata = pageMetadata({ title, description, path });

export default function BlogPage() {
  return (
    <PageShell>
      <JsonLd
        data={[
          {
            ...webPageLd({ path, name: title, description, type: "CollectionPage" }),
            mainEntity: {
              "@type": "ItemList",
              itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: abs(p.path) })),
            },
          },
          breadcrumbLd([{ name: "Blog", path }]),
        ]}
      />

      <PageHero
        crumbs={[{ name: "Blog", path }]}
        eyebrow="Blog"
        lines={["Entrenamiento,", "alimentación"]}
        accent="y mitos del fitness."
        lead={<p>Lo que hay que saber para entrenar mejor, comer mejor y no caer en promesas mágicas.</p>}
      />

      <section className="section">
        <div className="container">
          <PostGrid>
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </PostGrid>
        </div>
      </section>

      <FinalCta />
    </PageShell>
  );
}
