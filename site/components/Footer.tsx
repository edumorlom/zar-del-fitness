import Image from "next/image";
import { Icon } from "./Icon";
import { Year } from "./Year";
import { content, legalHolder, socials } from "@/lib/content";
import { fill, type Lang } from "@/lib/i18n";
import styles from "./Footer.module.css";

export function Footer({ lang }: { lang: Lang }) {
  const { t, contact, links, pages } = content(lang);
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

        {/* Lo que pide la ley en el sitio: los términos (Ley 24.240, art. 38), la privacidad (Ley 25.326) y los links a
            Defensa del Consumidor (Res. 274/2021 y Ley CABA 2244). */}
        <nav className={styles.col} aria-label={t.legal.pie}>
          <p className={styles.label}>{t.legal.pie}</p>
          <a href={pages.terminos}>{t.legal.terminos}</a>
          <a href={pages.privacidad}>{t.legal.privacidad}</a>
          <a href={links.consumidor} rel="noopener">
            {t.legal.consumidor}
          </a>
          <a href={links.consumidorCaba} rel="noopener">
            {t.legal.consumidorCaba}
          </a>
        </nav>
      </div>

      <div className={`container ${styles.fine}`}>
        {legalHolder && <p>{fill(t.legal.titular, legalHolder)}</p>}
        <p>{t.legal.aaip}</p>
        {links.dataFiscal && (
          <a href={links.dataFiscal} target="_F960AFIPInfo" rel="noopener" className={styles.dataFiscal}>
            {/* El formulario 960/D de ARCA: el QR que lleva a los datos fiscales del titular. */}
            <img src="https://www.afip.gob.ar/images/f960/DATAWEB.jpg" alt="Data Fiscal" width={60} height={82} loading="lazy" />
          </a>
        )}
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
