import { Icon } from "./Icon";
import { ProgramArt } from "./ProgramArt";
import { TiltCard } from "./TiltCard";
import { programs, texts } from "@/lib/content";
import styles from "./Programs.module.css";

export function Programs() {
  return (
    <section className={`section ${styles.programs}`} id="programas">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow" data-reveal>
            <span className="num">02</span> Programas
          </p>
          <h2 className="h2" data-lines>
            <span className="ln">
              <span>Cuatro protocolos,</span>
            </span>{" "}
            <span className="ln">
              <span>
                <em className="serif gold-text">un solo objetivo: el tuyo.</em>
              </span>
            </span>
          </h2>
          <p className="section-head__lead" data-reveal>
            {texts.programs}
          </p>
        </header>

        <div className={styles.cards} data-reveal-stagger>
          {programs.map((p) => (
            <div key={p.title} className={styles.cell}>
              <TiltCard className={`${styles.card} ${p.featured ? styles.featured : ""}`}>
                <div className={styles.glow} aria-hidden="true" />
                {p.featured && <span className={styles.ribbon}>Experiencia exclusiva</span>}
                <div className={styles.media}>
                  <ProgramArt variant={p.art.variant} label={p.art.label} />
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
                    <a className="link-sm" href={p.page}>
                      Ver detalles<span className="sr-only"> de {p.title}</span>
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
