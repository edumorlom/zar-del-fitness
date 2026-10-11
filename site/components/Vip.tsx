import { perks } from "@/lib/content";
import styles from "./Vip.module.css";

export function Vip() {
  return (
    <section className={`section ${styles.vip}`} id="gym">
      <div className={`container ${styles.grid}`}>
        <aside className={styles.aside}>
          <div className={styles.sticky}>
            <p className="eyebrow" data-reveal>
              <span className="num">05</span> Sistema Premium
            </p>
            <h2 className="h2" data-lines>
              <span className="ln">
                <span>The VIP.</span>
              </span>
              <span className="ln">
                <span>
                  <em className="serif gold-text">Un gym sólo para vos.</em>
                </span>
              </span>
            </h2>
            <p className={styles.note} data-reveal>
              Más observación, más exclusividad y dinámicas de entrenamiento más individuales, con el acompañamiento
              cercano del Zar y sus dos asistentes premium.
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
