import { perks, vipNote } from "@/lib/content";
import styles from "./Vip.module.css";

/** `num`: el número de la sección en el inicio; las otras páginas la muestran sin número. */
export function Vip({ num }: { num?: string }) {
  return (
    <section className={`section ${styles.vip}`} id="gym">
      <div className={`container ${styles.grid}`}>
        <aside className={styles.aside}>
          <div className={styles.sticky}>
            <p className="eyebrow" data-reveal>
              {num && <span className="num">{num}</span>} Sistema Premium
            </p>
            <h2 className="h2" data-lines>
              <span className="ln">
                <span>The VIP.</span>
              </span>{" "}
              <span className="ln">
                <span>
                  <em className="serif gold-text">Un gym sólo para vos.</em>
                </span>
              </span>
            </h2>
            <p className={styles.note} data-reveal>
              {vipNote}
            </p>
          </div>
        </aside>

        <ol className={styles.perks}>
          {perks.map(([title, text], i) => (
            <li key={title} className={styles.perk} data-reveal>
              <span className={styles.n}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
