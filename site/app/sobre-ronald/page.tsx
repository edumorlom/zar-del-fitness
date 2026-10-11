import { PageShell } from "@/components/PageShell";
import { PageHero } from "@/components/PageHero";
import { SectionHead } from "@/components/PlanBlocks";
import { Press } from "@/components/Press";
import { Team } from "@/components/Team";
import { FinalCta } from "@/components/FinalCta";
import { Icon } from "@/components/Icon";
import { Rich } from "@/components/Rich";
import { VideoButton } from "@/components/motion/VideoButton";
import { JsonLd } from "@/components/JsonLd";
import { links, pages, team, texts, videos } from "@/lib/content";
import { breadcrumbLd, pageMetadata, webPageLd } from "@/lib/seo";
import styles from "./page.module.css";

const ronald = team.find((m) => m.id === "ronald")!;

const path = pages.ronald;
const title = "Ronald Medina, el Zar del Fitness: trayectoria, premios y prensa";
const description =
  "Personal trainer venezolano radicado en Buenos Aires, creador del Reto de los 25 días, Emmy Winner 2024 y conocido como el entrenador de los famosos.";

export const metadata = pageMetadata({ title, description, path, absoluteTitle: true });

export default function RonaldPage() {
  return (
    <PageShell>
      <JsonLd
        data={[
          webPageLd({ path, name: title, description, type: "ProfilePage", about: "ronald" }),
          breadcrumbLd([{ name: "Sobre Ronald", path }]),
        ]}
      />

      <PageHero
        crumbs={[{ name: "Sobre Ronald", path }]}
        eyebrow={ronald.role}
        lines={["Ronald Medina,"]}
        accent="el Zar del Fitness."
        lead={<p>{ronald.bio}</p>}
        image={{ src: "/img/ronald-portrait.webp", w: 1080, h: 1080, alt: "Retrato de Ronald Medina, el Zar del Fitness" }}
      >
        <VideoButton videoId={videos.historia} className="btn btn--ghost btn--lg">
          <span className="btn__play">
            <Icon name="play" className="" />
          </span>
          <span>Conocé su historia</span>
        </VideoButton>
        {ronald.handleHref && (
          <a className="link-arrow" href={ronald.handleHref}>
            <Icon name="ig" /> {ronald.handle}
          </a>
        )}
      </PageHero>

      <section className="section">
        <div className={`container ${styles.story}`}>
          <SectionHead eyebrow="Su historia" title="Venezolano," accent="radicado en Buenos Aires." />
          <div className={styles.text} data-reveal>
            {texts.about.map((p) => (
              <p key={p}>
                <Rich text={p} />
              </p>
            ))}
          </div>
          <blockquote className={styles.quote} data-reveal>
            <p className="serif">{texts.quote}</p>
            <footer>— {ronald.name}</footer>
          </blockquote>
        </div>
      </section>

      <Press />
      <Team />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className={`container ${styles.next}`} data-reveal>
          <a className="btn btn--gold btn--lg" href={pages.online}>
            <span>Entrenamiento online</span>
            <Icon name="arrow" />
          </a>
          <a className="btn btn--outline btn--lg" href={pages.presencial}>
            <span>Entrenamiento presencial</span>
            <Icon name="arrow" />
          </a>
          <a className="link-arrow" href={links.waInfo}>
            <Icon name="wa" /> Escribinos
          </a>
        </div>
      </section>

      <FinalCta />
    </PageShell>
  );
}
