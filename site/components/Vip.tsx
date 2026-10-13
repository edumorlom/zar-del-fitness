import { Lines } from "./Lines";
import { content } from "@/lib/content";
import type { Lang } from "@/lib/i18n";
import styles from "./Vip.module.css";

export function Vip({ lang }: { lang: Lang }) {
  const { t, perks, vipNote } = content(lang);
  return (
    <section className={`section ${styles.vip}`} id="gym">
      <div className={`container ${styles.grid}`}>
        <aside className={styles.aside}>
          <div className={styles.sticky}>
            <p className="eyebrow" data-reveal>
              <span className="num">05</span> {t.vip.antetitulo}
            </p>
            <h2 className="h2" data-lines>
              <Lines lines={t.vip.titulo} />
            </h2>
            <p className={styles.note} data-reveal>
              {vipNote}
            </p>
          </div>
        </aside>

        <ol className={styles.perks}>
          {perks.map(({ title, text }, i) => (
            <li key={title} className={styles.perk} data-reveal>
              <span className={styles.n}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <strong className={styles.title}>{title}</strong>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
