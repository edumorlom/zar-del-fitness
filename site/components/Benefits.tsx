import Image from "next/image";
import { content } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import styles from "./Benefits.module.css";

export function Benefits({ lang }: { lang: Lang }) {
  const t = content(lang).t.beneficios;
  return (
    <section className={`section ${styles.benefits}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.aside}>
          <p className="eyebrow" data-reveal>
            {t.antetitulo}
          </p>
          <div data-reveal="scale">
            <Image
              className={styles.logo}
              src="/img/logo-ronald-medina.webp"
              alt={t.logo}
              width={666}
              height={408}
              sizes="(max-width: 900px) 60vw, 25vw"
            />
          </div>
        </div>
        <ol className={styles.list}>
          {t.lista.map(({ texto, acento }, i) => (
            <li key={texto} data-reveal="left">
              <span className={styles.num}>0{i + 1}</span>
              <span className={styles.text}>
                {texto} <em className="serif">{acento}</em>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
