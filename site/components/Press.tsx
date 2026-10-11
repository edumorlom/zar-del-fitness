import { PressList } from "./PressList";
import { awards } from "@/lib/content";
import styles from "./Press.module.css";

/** `num`: el número de la sección en el inicio; las otras páginas la muestran sin número. */
export function Press({ num }: { num?: string }) {
  return (
    <section className={`section ${styles.press}`}>
      <div className="container">
        <header className="section-head">
          <p className="eyebrow" data-reveal>
            {num && <span className="num">{num}</span>} Trayectoria
          </p>
          <h2 className="h2" data-lines>
            <span className="ln">
              <span>De Maracaibo</span>
            </span>{" "}
            <span className="ln">
              <span>
                <em className="serif gold-text">a la pantalla.</em>
              </span>
            </span>
          </h2>
        </header>

        <PressList />

        <div className={styles.awards} data-reveal-stagger>
          {awards.map((a) => (
            <div key={a.title} className={styles.award}>
              <span className={styles.year}>{a.year}</span>
              <strong>{a.title}</strong>
              <span>{a.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
