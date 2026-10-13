import Image from "next/image";
import { Icon } from "./Icon";
import { Year } from "./Year";
import { content, socials } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import styles from "./Footer.module.css";

export function Footer({ lang }: { lang: Lang }) {
  const { t, contact, links } = content(lang);
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Image src="/img/logo.webp" alt="Zar del Fitness" width={666} height={361} sizes="200px" />
          <p>{t.lema}</p>
          <div className="socials">
            {socials.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}>
                <Icon name={s.icon} className="" />
              </a>
            ))}
          </div>
        </div>

        <address className={styles.col}>
          <p className={styles.label}>{t.pie.contacto}</p>
          <a href={contact.phoneHref}>
            <Icon name="wa" />
            {contact.phone}
          </a>
          <a href={links.directions}>
            <Icon name="pin" />
            {contact.street}
          </a>
        </address>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>
          © <Year /> {t.pie.derechos}
        </span>
        <a href="#top" className="link-sm">
          {t.pie.arriba}
        </a>
      </div>

      <div className={styles.mega} aria-hidden="true" data-reveal>
        ZAR DEL FITNESS
      </div>
    </footer>
  );
}
