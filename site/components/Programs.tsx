import { Icon } from "./Icon";
import { ProgramArt } from "./ProgramArt";
import { Lines } from "./Lines";
import { TiltCard } from "./TiltCard";
import { content } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import styles from "./Programs.module.css";

export function Programs({ lang }: { lang: Lang }) {
  const { t, programs } = content(lang);
  return (
    <section className={`section ${styles.programs}`} id="programas">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow" data-reveal>
            <span className="num">02</span> {t.programas.antetitulo}
          </p>
          <h2 className="h2" data-lines>
            <Lines lines={t.programas.titulo} />
          </h2>
          <p className="section-head__lead" data-reveal>
            {t.programas.introduccion}
          </p>
        </header>

        <div className={styles.cards} data-reveal-stagger>
          {programs.map((p) => (
            <div key={p.title} className={styles.cell}>
              <TiltCard className={`${styles.card} ${p.featured ? styles.featured : ""}`}>
                <div className={styles.glow} aria-hidden="true" />
                {p.featured && <span className={styles.ribbon}>{t.programas.destacado}</span>}
                <div className={styles.media}>
                  <ProgramArt variant={p.art.variant} label={p.art.label} words={t.programas.arte} />
                </div>
                <div className={styles.body}>
                  <p className="tag">{p.tag}</p>
                  <h3 className={styles.title}>{p.title}</h3>
                  <p className={styles.price}>
                    <span className={styles.cur}>{p.currency}</span>
                    {p.price}
                    {p.suffix && <small>{p.suffix}</small>}
                  </p>
                  <p className={styles.desc}>{p.desc}</p>
                  <ul className={styles.list}>
                    {p.features.map((f) => (
                      <li key={f}>
                        <Icon name="check" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className={styles.ctas}>
                    <a className={`btn ${p.featured ? "btn--gold" : "btn--outline"}`} href={p.cta.href} data-magnetic={p.featured || undefined}>
                      <span>{p.cta.label}</span>
                      <Icon name="arrow" />
                    </a>
                  </div>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
