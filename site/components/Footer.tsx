import Image from "next/image";
import { Icon } from "./Icon";
import { Year } from "./Year";
import { contact, links, socials, texts } from "@/lib/content";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.brand}>
          <Image src="/img/logo.webp" alt="Zar del Fitness" width={666} height={361} sizes="200px" />
          <p>{texts.motto}</p>
          <div className="socials">
            {socials.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label}>
                <Icon name={s.icon} className="" />
              </a>
            ))}
          </div>
        </div>

        <div className={styles.col}>
          <h4>Contacto</h4>
          <a href={contact.phoneHref}>
            <Icon name="wa" />
            {contact.phone}
          </a>
          <a href={links.directions}>
            <Icon name="pin" />
            {contact.street}
          </a>
        </div>
      </div>

      <div className={`container ${styles.bottom}`}>
        <span>
          © <Year /> Zar del Fitness. Todos los derechos reservados.
        </span>
        <a href="#top" className="link-sm">
          Volver arriba ↑
        </a>
      </div>

      <div className={styles.mega} aria-hidden="true" data-reveal>
        ZAR DEL FITNESS
      </div>
    </footer>
  );
}
