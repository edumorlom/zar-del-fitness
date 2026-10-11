import Image from "next/image";
import { Icon } from "./Icon";
import { socials, team } from "@/lib/content";
import styles from "./Team.module.css";

export function Team() {
  return (
    <section className={`section ${styles.team}`}>
      <div className={`container ${styles.grid}`}>
        <header className={styles.head}>
          <p className="eyebrow" data-reveal>
            Equipo
          </p>
          <h2 className="h2 h2--sm" data-lines>
            <span className="ln">
              <span>Entrenadores</span>
            </span>
            <span className="ln">
              <span>
                <em className="serif gold-text">by Zar del Fitness.</em>
              </span>
            </span>
          </h2>
          <p className="section-head__lead" data-reveal>
            El acompañamiento es el valor fundamental de nuestro servicio: sabemos que motivarte es clave, por eso nos
            esmeramos en hacerte el camino más fácil.
          </p>
        </header>

        {team.map((c) => (
          <article key={c.name} className={styles.coach} data-reveal>
            <div className={styles.img}>
              <Image src={c.img.src} alt={c.name} width={c.img.w} height={c.img.h} sizes="(max-width: 900px) 90vw, 30vw" />
            </div>
            <div className={styles.body}>
              <p className="tag">{c.role}</p>
              <h3>{c.name}</h3>
              <p>{c.bio}</p>
              {c.handle && (
                <a className="link-arrow" href={socials[0].href}>
                  <Icon name="ig" /> {c.handle}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
