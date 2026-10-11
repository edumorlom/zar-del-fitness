import { Icon } from "./Icon";
import { Lines } from "./Lines";
import { content } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import styles from "./FinalCta.module.css";

export function FinalCta({ lang }: { lang: Lang }) {
  const { t, contact, links } = content(lang);
  return (
    <section className={styles.cta}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <h2 className={styles.title} data-lines>
          <Lines lines={t.final.titulo} accent="gold" />
        </h2>
        <p className={styles.sub} data-reveal>
          <em className="serif">{t.final.subtitulo}</em>
        </p>
        <div className={styles.ctas} data-reveal>
          <a className="btn btn--gold btn--lg" href={links.retoOnline} data-magnetic>
            <span>{t.final.boton}</span>
            <Icon name="arrow" />
          </a>
          <a className="btn btn--ghost btn--lg" href={links.waInfo} data-magnetic>
            <Icon name="wa" />
            <span>{contact.phone}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
