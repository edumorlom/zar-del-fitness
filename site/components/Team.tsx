import Image from "next/image";
import { Icon } from "./Icon";
import { Lines } from "./Lines";
import { content } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import styles from "./Team.module.css";

export function Team({ lang }: { lang: Lang }) {
  const { t, team } = content(lang);
  return (
    <section className={`section ${styles.team}`}>
      <div className={`container ${styles.grid}`}>
        <header className={styles.head}>
          <p className="eyebrow" data-reveal>
            {t.equipo.antetitulo}
          </p>
          <h2 className="h2 h2--sm" data-lines>
            <Lines lines={t.equipo.titulo} />
          </h2>
          <p className="section-head__lead" data-reveal>
            {t.equipo.introduccion}
          </p>
        </header>

        {team.map((c) => (
          <article key={c.name} className={styles.coach} data-reveal>
            <div className={styles.img}>
              <Image src={c.img.src} alt={c.name} width={c.img.w} height={c.img.h} sizes="(max-width: 900px) 90vw, 30vw" />
            </div>
            <div className={styles.body}>
              <p className="tag">{c.role}</p>
              <strong className={styles.name}>{c.name}</strong>
              <p>{c.bio}</p>
              {c.handle && (
                <a className="link-arrow" href={c.handleHref}>
                  <Icon name="ig" /> {c.handle}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
