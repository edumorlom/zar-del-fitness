import Image from "next/image";
import { benefits } from "@/lib/content";
import styles from "./Benefits.module.css";

export function Benefits() {
  return (
    <section className={`section ${styles.benefits}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.aside}>
          <p className="eyebrow" data-reveal>
            Durante el reto vas a
          </p>
          <div data-reveal="scale">
            <Image
              className={styles.logo}
              src="/img/logo-ronald-medina.webp"
              alt="Zar del Fitness · Ronald Medina"
              width={666}
              height={408}
              sizes="(max-width: 900px) 60vw, 25vw"
            />
          </div>
        </div>
        <ol className={styles.list}>
          {benefits.map(([main, accent], i) => (
            <li key={main} data-reveal="left">
              <span className={styles.num}>0{i + 1}</span>
              <span className={styles.text}>
                {main} <em className="serif">{accent}</em>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
