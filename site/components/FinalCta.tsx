import { Icon } from "./Icon";
import { contact, links } from "@/lib/content";
import styles from "./FinalCta.module.css";

export function FinalCta() {
  return (
    <section className={styles.cta}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={`container ${styles.inner}`}>
        <h2 className={styles.title} data-lines>
          <span className="ln">
            <span>Tu cuerpo</span>
          </span>{" "}
          <span className="ln">
            <span className="gold-text">puede cambiar.</span>
          </span>
        </h2>
        <p className={styles.sub} data-reveal>
          <em className="serif">Y nosotros estamos para ayudarte.</em>
        </p>
        <div className={styles.ctas} data-reveal>
          <a className="btn btn--gold btn--lg" href={links.retoOnline} data-magnetic>
            <span>Comenzá el reto</span>
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
